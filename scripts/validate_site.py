#!/usr/bin/env python3
"""Validate the static site without a build step or CI service."""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://thangldw.github.io"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[str] = []
        self.canonicals: list[str] = []
        self.refreshes: list[str] = []

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
    errors: list[str] = []
    pages = sorted(ROOT.rglob("*.html"))
    parsed_pages: dict[Path, PageParser] = {}

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

        for reference in parser.references:
            target = local_target(page, reference)
            if target is not None and not target.exists():
                errors.append(f"{page.relative_to(ROOT)}: broken reference {reference}")

    migration = (ROOT / "apps/URL-MIGRATION.md").read_text(encoding="utf-8")
    mappings = re.findall(r"\| `(/apps/[^`]+/)` \| `(/apps/[^`]+/)` \|", migration)
    if not mappings:
        errors.append("apps/URL-MIGRATION.md: no URL mappings found")

    sitemap_root = ET.parse(ROOT / "sitemap.xml").getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = {node.text for node in sitemap_root.findall("s:url/s:loc", namespace)}

    for previous, canonical in mappings:
        previous_file = ROOT / previous.lstrip("/") / "index.html"
        canonical_file = ROOT / canonical.lstrip("/") / "index.html"
        if not previous_file.exists() or not canonical_file.exists():
            errors.append(f"mapping missing file: {previous} -> {canonical}")
            continue
        previous_page = parsed_pages[previous_file]
        canonical_page = parsed_pages[canonical_file]
        if not any(canonical in value for value in previous_page.refreshes):
            errors.append(f"{previous}: redirect does not target {canonical}")
        absolute = SITE_URL + canonical
        if canonical_page.canonicals != [absolute]:
            errors.append(f"{canonical}: expected canonical {absolute}")
        if absolute not in sitemap_urls:
            errors.append(f"sitemap.xml: missing {absolute}")

    if errors:
        print("Site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(pages)} HTML pages, {len(mappings)} redirects, "
        f"{len(sitemap_urls)} sitemap URLs, and all local references."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
