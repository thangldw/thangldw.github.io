#!/usr/bin/env python3
"""Validate the static site without a build step or CI service."""

from __future__ import annotations

import json
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
SITE_FONT_STYLESHEET = "/css/site-shell.css?v=20260803font2"
SITE_FONT_ASSET = Path("assets/fonts/InterVariable.woff2")
SITE_FONT_LICENSE = Path("assets/fonts/Inter-LICENSE.txt")
EXTERNAL_FONT_PATTERNS = {
    "Google Fonts stylesheet": "fonts.googleapis.com",
    "Google Fonts asset": "fonts.gstatic.com",
    "Font Awesome CDN": "use.fontawesome.com",
}
ALLOWED_MARKDOWN = {
    Path("README.md"),
    Path("assets/fonts/licenses/be-vietnam-pro/SOURCE.md"),
    Path("assets/fonts/licenses/font-awesome-6.4.2/SOURCE.md"),
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

    for required_font_file in (SITE_FONT_ASSET, SITE_FONT_LICENSE):
        if not (ROOT / required_font_file).is_file():
            errors.append(f"{required_font_file}: required self-hosted Inter file is missing")

    site_shell = (ROOT / "css/site-shell.css").read_text(encoding="utf-8")
    if '@font-face' not in site_shell or '--site-font-ui: "Inter"' not in site_shell:
        errors.append("css/site-shell.css: Inter must remain the canonical site UI font")

    catalog_path = ROOT / "js/projects-data.json"
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        projects = catalog.get("projects")
        learning_collections = catalog.get("learningCollections")
        if catalog.get("schemaVersion") != 1:
            errors.append("js/projects-data.json: unsupported schemaVersion")
        if not isinstance(projects, list) or not isinstance(learning_collections, list):
            errors.append("js/projects-data.json: projects and learningCollections must be arrays")
        else:
            entries = projects + learning_collections
            required_project_fields = {
                "id", "title", "description", "href", "ariaLabel", "icon",
                "accent", "status", "tags", "category", "cta",
            }
            identifiers: list[str] = []
            for index, project in enumerate(entries):
                if not isinstance(project, dict):
                    errors.append(f"js/projects-data.json: entry {index} must be an object")
                    continue
                missing = sorted(required_project_fields - project.keys())
                if missing:
                    errors.append(
                        f"js/projects-data.json: entry {index} missing {', '.join(missing)}"
                    )
                if not isinstance(project.get("tags"), list):
                    errors.append(f"js/projects-data.json: entry {index} tags must be an array")
                if isinstance(project.get("id"), str):
                    identifiers.append(project["id"])
            duplicates = sorted(
                identifier for identifier, count in Counter(identifiers).items() if count > 1
            )
            if duplicates:
                errors.append(
                    f"js/projects-data.json: duplicate ids: {', '.join(duplicates)}"
                )
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"js/projects-data.json: cannot load catalog: {exc}")

    certification_manifest_path = ROOT / "apps/cert/certifications-manifest.json"
    try:
        certification_manifest = json.loads(
            certification_manifest_path.read_text(encoding="utf-8")
        )
        certifications = certification_manifest.get("certifications")
        if certification_manifest.get("schemaVersion") != "1.0":
            errors.append(
                "apps/cert/certifications-manifest.json: unsupported schemaVersion"
            )
        if not isinstance(certifications, list):
            errors.append(
                "apps/cert/certifications-manifest.json: certifications must be an array"
            )
        elif certification_manifest.get("certificationCount") != len(certifications):
            errors.append(
                "apps/cert/certifications-manifest.json: certificationCount mismatch"
            )
        else:
            allowed_fields = {
                "id", "slug", "displayOrder", "accent", "shortName", "name",
                "issuer", "syllabusVersion", "href", "availableQuestionCount", "exam",
            }
            allowed_exam_fields = {
                "durationMinutes", "questionCount", "format", "structure",
            }
            manifest_ids: list[str] = []
            for index, certification in enumerate(certifications):
                if not isinstance(certification, dict):
                    errors.append(
                        f"apps/cert/certifications-manifest.json: entry {index} must be an object"
                    )
                    continue
                unexpected = sorted(certification.keys() - allowed_fields)
                missing = sorted(allowed_fields - certification.keys())
                if unexpected or missing:
                    errors.append(
                        "apps/cert/certifications-manifest.json: "
                        f"entry {index} fields differ; missing={missing}, unexpected={unexpected}"
                    )
                exam = certification.get("exam")
                if not isinstance(exam, dict) or set(exam.keys()) != allowed_exam_fields:
                    errors.append(
                        f"apps/cert/certifications-manifest.json: entry {index} has invalid exam metadata"
                    )
                identifier = certification.get("id")
                if isinstance(identifier, str):
                    manifest_ids.append(identifier)
                href = certification.get("href")
                if isinstance(href, str):
                    target = local_target(certification_manifest_path, href)
                    if target is not None and not target.exists():
                        errors.append(
                            f"apps/cert/certifications-manifest.json: broken href {href}"
                        )
            duplicate_manifest_ids = sorted(
                identifier
                for identifier, count in Counter(manifest_ids).items()
                if count > 1
            )
            if duplicate_manifest_ids:
                errors.append(
                    "apps/cert/certifications-manifest.json: duplicate ids: "
                    + ", ".join(duplicate_manifest_ids)
                )
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(
            f"apps/cert/certifications-manifest.json: cannot load manifest: {exc}"
        )

    markdown_files = {
        path.relative_to(ROOT)
        for path in ROOT.rglob("*.md")
        if ".git" not in path.parts
    }
    for stale_markdown in sorted(markdown_files - ALLOWED_MARKDOWN):
        errors.append(
            f"{stale_markdown}: Markdown file is not in the durable-document allowlist"
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

        font_references = [
            reference
            for reference in parser.references
            if reference.startswith("/css/site-shell.css?v=")
        ]
        if font_references != [SITE_FONT_STYLESHEET]:
            errors.append(
                f"{page.relative_to(ROOT)}: expected one {SITE_FONT_STYLESHEET} reference"
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

    required_og = {"og:type", "og:title", "og:description", "og:url"}
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
        page_required_og = required_og | ({"og:image"} if path != "/" else set())
        missing_og = sorted(page_required_og - page.meta_properties.keys())
        if missing_og:
            errors.append(f"{page_file.relative_to(ROOT)}: missing {', '.join(missing_og)}")
        elif page.meta_properties["og:url"] != absolute:
            errors.append(f"{page_file.relative_to(ROOT)}: og:url must match canonical")
        elif "og:image" in page.meta_properties:
            image_url = page.meta_properties["og:image"]
            image_path = ROOT / urlsplit(image_url).path.lstrip("/")
            if not image_url.startswith(SITE_URL + "/") or not image_path.is_file():
                errors.append(f"{page_file.relative_to(ROOT)}: invalid og:image {image_url}")
        twitter_card = page.meta_names.get("twitter:card")
        if path != "/" and twitter_card != "summary_large_image":
            errors.append(f"{page_file.relative_to(ROOT)}: expected twitter summary_large_image")
        elif twitter_card and twitter_card != "summary_large_image":
            errors.append(f"{page_file.relative_to(ROOT)}: invalid twitter:card {twitter_card}")

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
