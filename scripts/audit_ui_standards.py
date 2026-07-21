#!/usr/bin/env python3
"""Enforce the shared HTML/CSS contract for every public site route."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://thangldw.github.io"
DEPRECATED_COLORS = {"#f3f0e8": "use #fbfaf6 or the shared background token"}
STANDARD_VERSION = "1.1"
LEGACY_BASELINE_PATH = ROOT / "scripts" / "ui_legacy_baseline.json"
INLINE_STYLE_RE = re.compile(r"\bstyle\s*=", re.IGNORECASE)
INLINE_EVENT_RE = re.compile(
    r"\bon(?:click|change|input|keydown|keyup|submit|load|error|focus|blur|"
    r"mouseover|mouseout|pointerdown|pointerup|touchstart|touchend)\s*=",
    re.IGNORECASE,
)
BUTTON_TAG_RE = re.compile(r"<button\b[^>]*>", re.IGNORECASE | re.DOTALL)
TYPE_BUTTON_RE = re.compile(r"\btype\s*=\s*(['\"])button\1", re.IGNORECASE)


class UIParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.doctype = False
        self.html_attrs: dict[str, str] = {}
        self.counts: Counter[str] = Counter()
        self.ids: list[str] = []
        self.meta_names: dict[str, str] = {}
        self.has_charset = False
        self.in_title = False
        self.title_parts: list[str] = []
        self.buttons: list[dict[str, object]] = []
        self.button_stack: list[int] = []
        self.images_without_alt: list[str] = []
        self.blank_links_without_noopener: list[str] = []
        self.tablists: list[dict[str, str]] = []
        self.tabs: list[dict[str, str]] = []
        self.tabpanels: list[dict[str, str]] = []
        self.stylesheets: list[str] = []

    def handle_decl(self, decl: str) -> None:
        if decl.lower().strip() == "doctype html":
            self.doctype = True

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        self.counts[tag] += 1
        if tag == "html":
            self.html_attrs = values
        if values.get("id"):
            self.ids.append(values["id"])
        if tag == "meta":
            if "charset" in values:
                self.has_charset = True
            if values.get("name"):
                self.meta_names[values["name"].lower()] = values.get("content", "").strip()
        if tag == "title":
            self.in_title = True
        if tag == "button":
            self.buttons.append({"attrs": values, "text": []})
            self.button_stack.append(len(self.buttons) - 1)
        if tag == "img" and "alt" not in values:
            self.images_without_alt.append(values.get("src", "<unknown>"))
        if tag == "a" and values.get("target", "").lower() == "_blank":
            rel = set(values.get("rel", "").lower().split())
            if "noopener" not in rel:
                self.blank_links_without_noopener.append(values.get("href", "<unknown>"))
        role = values.get("role", "").lower()
        if role == "tablist":
            self.tablists.append(values)
        elif role == "tab":
            self.tabs.append(values)
        elif role == "tabpanel":
            self.tabpanels.append(values)
        if tag == "link" and "stylesheet" in values.get("rel", "").lower().split():
            self.stylesheets.append(values.get("href", ""))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "button" and self.button_stack:
            self.button_stack.pop()

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        for index in self.button_stack:
            text = self.buttons[index]["text"]
            assert isinstance(text, list)
            text.append(data)


def public_pages() -> list[Path]:
    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    pages = []
    for node in sitemap.findall("s:url/s:loc", namespace):
        path = urlsplit(node.text or "").path
        pages.append(ROOT / "index.html" if path == "/" else ROOT / path.lstrip("/") / "index.html")
    pages.append(ROOT / "404.html")
    return sorted(set(pages))


def legacy_counts(source: str, parser: UIParser) -> dict[str, int]:
    """Count legacy-only patterns, including button markup inside JS templates."""
    return {
        "style_blocks": parser.counts["style"],
        "style_attributes": len(INLINE_STYLE_RE.findall(source)),
        "event_handlers": len(INLINE_EVENT_RE.findall(source)),
        "buttons_missing_type": sum(
            1 for tag in BUTTON_TAG_RE.findall(source) if not TYPE_BUTTON_RE.search(tag)
        ),
    }


def load_legacy_baseline() -> dict[str, object]:
    if not LEGACY_BASELINE_PATH.exists():
        raise FileNotFoundError(f"missing {LEGACY_BASELINE_PATH.relative_to(ROOT)}")
    return json.loads(LEGACY_BASELINE_PATH.read_text(encoding="utf-8"))


def audit_site() -> list[str]:
    errors: list[str] = []
    pages = public_pages()
    try:
        baseline = load_legacy_baseline()
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        return [str(exc)]
    if baseline.get("standard_version") != STANDARD_VERSION:
        errors.append(
            f"scripts/ui_legacy_baseline.json: expected standard_version {STANDARD_VERSION}"
        )
    inline_debt = baseline.get("inline_debt", {})
    token_exceptions = baseline.get("shared_token_exceptions", {})
    if not isinstance(inline_debt, dict) or not isinstance(token_exceptions, dict):
        return ["scripts/ui_legacy_baseline.json: invalid baseline structure"]
    public_names = {str(page.relative_to(ROOT)) for page in pages}
    for stale in sorted(set(inline_debt) - public_names):
        errors.append(f"scripts/ui_legacy_baseline.json: stale page entry: {stale}")
    for stale in sorted(set(token_exceptions) - public_names):
        errors.append(f"scripts/ui_legacy_baseline.json: stale token exception: {stale}")

    for page in pages:
        relative = page.relative_to(ROOT)
        relative_name = str(relative)
        source = page.read_text(encoding="utf-8")
        parser = UIParser()
        parser.feed(source)
        parser.close()

        if not parser.doctype:
            errors.append(f"{relative}: missing HTML5 doctype")
        if not parser.html_attrs.get("lang"):
            errors.append(f"{relative}: <html> requires lang")
        if not parser.has_charset:
            errors.append(f"{relative}: missing meta charset")
        if not parser.meta_names.get("viewport"):
            errors.append(f"{relative}: missing responsive viewport")
        if not "".join(parser.title_parts).strip():
            errors.append(f"{relative}: missing document title")
        if not parser.meta_names.get("description"):
            errors.append(f"{relative}: missing meta description")
        if parser.counts["main"] != 1:
            errors.append(f"{relative}: expected exactly one <main>, found {parser.counts['main']}")
        if parser.counts["h1"] != 1:
            errors.append(f"{relative}: expected exactly one source <h1>, found {parser.counts['h1']}")

        duplicates = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
        if duplicates:
            errors.append(f"{relative}: duplicate ids: {', '.join(duplicates)}")
        for src in parser.images_without_alt:
            errors.append(f"{relative}: image requires alt: {src}")
        for href in parser.blank_links_without_noopener:
            errors.append(f"{relative}: target=_blank requires rel=noopener: {href}")

        for button in parser.buttons:
            attrs = button["attrs"]
            text = button["text"]
            assert isinstance(attrs, dict) and isinstance(text, list)
            name = " ".join("".join(text).split())
            if not (name or attrs.get("aria-label") or attrs.get("aria-labelledby") or attrs.get("title")):
                errors.append(f"{relative}: button requires an accessible name")

        for tablist in parser.tablists:
            if not (tablist.get("aria-label") or tablist.get("aria-labelledby")):
                errors.append(f"{relative}: tablist requires aria-label or aria-labelledby")
        for tab in parser.tabs:
            missing = [key for key in ("id", "aria-selected", "aria-controls") if not tab.get(key)]
            if tab.get("type", "").lower() != "button":
                missing.append("type=button")
            if missing:
                errors.append(f"{relative}: tab missing {', '.join(missing)}")
        for panel in parser.tabpanels:
            if not panel.get("aria-labelledby"):
                errors.append(f"{relative}: tabpanel requires aria-labelledby")

        design_index = next((i for i, href in enumerate(parser.stylesheets) if "app-design-system.css" in href), None)
        readable_index = next((i for i, href in enumerate(parser.stylesheets) if "language-app-readable.css" in href), None)
        if readable_index is not None and (design_index is None or readable_index < design_index):
            errors.append(f"{relative}: language readability CSS must load after app-design-system.css")

        uses_shared_tokens = any(
            "tokens.css" in href or "app-design-system.css" in href
            for href in parser.stylesheets
        )
        if not uses_shared_tokens:
            exception = token_exceptions.get(relative_name)
            required = ("reason", "owner", "expires_when")
            if not isinstance(exception, dict) or any(not exception.get(key) for key in required):
                errors.append(f"{relative}: must load shared tokens or have a documented exception")

        actual_debt = legacy_counts(source, parser)
        expected_debt = inline_debt.get(relative_name, {})
        if not isinstance(expected_debt, dict):
            errors.append(f"{relative}: invalid inline-debt baseline")
            expected_debt = {}
        for metric, actual in actual_debt.items():
            expected = expected_debt.get(metric, 0)
            if actual > expected:
                errors.append(
                    f"{relative}: {metric} increased from baseline {expected} to {actual}"
                )
            elif actual < expected:
                errors.append(
                    f"{relative}: {metric} improved from {expected} to {actual}; lower the baseline"
                )

    for path in sorted((*ROOT.rglob("*.html"), *ROOT.rglob("*.css"))):
        source = path.read_text(encoding="utf-8").lower()
        for color, guidance in DEPRECATED_COLORS.items():
            if color in source:
                errors.append(f"{path.relative_to(ROOT)}: deprecated color {color}; {guidance}")
    return errors


def main() -> int:
    errors = audit_site()
    if errors:
        print("UI standards audit failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"UI standards passed for {len(public_pages())} public pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
