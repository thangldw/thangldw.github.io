#!/usr/bin/env python3
"""Validate the static site without a build step or CI service."""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from audit_ui_standards import audit_site


ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://thangldw.github.io"
ANALYTICS_SCRIPT = "/js/analytics.js"
EXTERNAL_FONT_PATTERNS = {
    "Google Fonts stylesheet": "fonts.googleapis.com",
    "Google Fonts asset": "fonts.gstatic.com",
    "Font Awesome CDN": "use.fontawesome.com",
}
ALLOWED_MARKDOWN = {
    Path("AGENTS.md"),
    Path("README.md"),
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[str] = []
        self.canonicals: list[str] = []
        self.refreshes: list[str] = []
        self.meta_names: dict[str, str] = {}
        self.meta_properties: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if values.get("id"):
            self.ids.append(values["id"])
        for key in ("href", "src"):
            if values.get(key):
                self.references.append(values[key])
        if tag == "link" and values.get("rel", "").lower() == "canonical":
            self.canonicals.append(values.get("href", ""))
        if tag == "meta" and values.get("http-equiv", "").lower() == "refresh":
            self.refreshes.append(values.get("content", ""))
        if tag == "meta" and values.get("name"):
            self.meta_names[values["name"].lower()] = values.get("content", "").strip()
        if tag == "meta" and values.get("property"):
            self.meta_properties[values["property"].lower()] = values.get("content", "").strip()


def local_target(page: Path, reference: str) -> Path | None:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or reference.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    clean = unquote(parsed.path)
    if not clean:
        return None
    target = ROOT / clean.lstrip("/") if clean.startswith("/") else page.parent / clean
    target = target.resolve()
    try:
        target.relative_to(ROOT)
    except ValueError:
        return target
    if clean.endswith("/") or target.is_dir():
        target /= "index.html"
    return target


def main() -> int:
    errors: list[str] = audit_site()
    pages = sorted(ROOT.rglob("*.html"))
    parsed_pages: dict[Path, PageParser] = {}

    markdown_files = {
        path.relative_to(ROOT)
        for path in ROOT.rglob("*.md")
        if ".git" not in path.parts
    }
    for stale_markdown in sorted(markdown_files - ALLOWED_MARKDOWN):
        errors.append(
            f"{stale_markdown}: only README.md and AGENTS.md are durable repository docs"
        )
    for metadata_file in sorted(
        path for path in ROOT.rglob(".DS_Store") if ".git" not in path.parts
    ):
        errors.append(
            f"{metadata_file.relative_to(ROOT)}: local metadata must not be kept"
        )

    for page in pages:
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
            parser.close()
        except Exception as exc:
            errors.append(f"{page.relative_to(ROOT)}: HTML parse failed: {exc}")
            continue
        parsed_pages[page] = parser

        duplicates = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
        if duplicates:
            errors.append(f"{page.relative_to(ROOT)}: duplicate ids: {', '.join(duplicates)}")

        analytics_references = [
            reference for reference in parser.references if reference == ANALYTICS_SCRIPT
        ]
        if parser.refreshes:
            if analytics_references:
                errors.append(
                    f"{page.relative_to(ROOT)}: redirect pages must not load analytics"
                )
        elif analytics_references != [ANALYTICS_SCRIPT]:
            errors.append(
                f"{page.relative_to(ROOT)}: expected one {ANALYTICS_SCRIPT} reference"
            )

        for reference in parser.references:
            target = local_target(page, reference)
            if target is not None and not target.exists():
                errors.append(f"{page.relative_to(ROOT)}: broken reference {reference}")

    for path in sorted((*ROOT.rglob("*.html"), *ROOT.rglob("*.css"), *ROOT.rglob("*.js"))):
        content = path.read_text(encoding="utf-8")
        for label, pattern in EXTERNAL_FONT_PATTERNS.items():
            if pattern in content:
                errors.append(f"{path.relative_to(ROOT)}: external font dependency ({label})")

    for page, parser in parsed_pages.items():
        if parser.refreshes:
            errors.append(
                f"{page.relative_to(ROOT)}: legacy redirect pages are not allowed"
            )

    sitemap_root = ET.parse(ROOT / "sitemap.xml").getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = {node.text for node in sitemap_root.findall("s:url/s:loc", namespace)}

    required_og = {"og:type", "og:title", "og:description", "og:url", "og:image"}
    for absolute in sorted(sitemap_urls):
        if not absolute or not absolute.startswith(SITE_URL + "/"):
            errors.append(f"sitemap.xml: invalid site URL {absolute}")
            continue
        path = urlsplit(absolute).path
        page_file = ROOT / path.lstrip("/") / "index.html" if path != "/" else ROOT / "index.html"
        if page_file not in parsed_pages:
            errors.append(f"sitemap.xml: missing page for {absolute}")
            continue
        page = parsed_pages[page_file]
        if page.canonicals != [absolute]:
            errors.append(f"{page_file.relative_to(ROOT)}: expected canonical {absolute}")
        description = page.meta_names.get("description", "")
        if not description:
            errors.append(f"{page_file.relative_to(ROOT)}: missing meta description")
        elif not 60 <= len(description) <= 170:
            errors.append(
                f"{page_file.relative_to(ROOT)}: meta description must be 60–170 characters"
            )
        missing_og = sorted(required_og - page.meta_properties.keys())
        if missing_og:
            errors.append(f"{page_file.relative_to(ROOT)}: missing {', '.join(missing_og)}")
        elif page.meta_properties["og:url"] != absolute:
            errors.append(f"{page_file.relative_to(ROOT)}: og:url must match canonical")
        else:
            image_url = page.meta_properties["og:image"]
            image_path = ROOT / urlsplit(image_url).path.lstrip("/")
            if not image_url.startswith(SITE_URL + "/") or not image_path.is_file():
                errors.append(f"{page_file.relative_to(ROOT)}: invalid og:image {image_url}")
        if page.meta_names.get("twitter:card") != "summary_large_image":
            errors.append(f"{page_file.relative_to(ROOT)}: expected twitter summary_large_image")

    if errors:
        print("Site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(pages)} HTML pages, {len(sitemap_urls)} sitemap URLs "
        "with social metadata, no legacy redirects, and all local references."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
