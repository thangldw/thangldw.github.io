#!/usr/bin/env python3
"""Enforce the shared HTML/CSS contract for every public site route."""

from __future__ import annotations

import math
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent.parent
DEPRECATED_COLORS = {"#f3f0e8": "use #fbfaf6 or the shared background token"}
COLOR_TOKEN_PATH = ROOT / "css" / "tokens.css"
SHARED_SHELL_CSS_PATH = ROOT / "css" / "site-shell.css"
SHARED_SHELL_SCRIPT_PATH = ROOT / "js" / "site-shell.js"
REQUIRED_COLOR_ROLES = {
    "--color-canvas",
    "--color-surface",
    "--color-surface-raised",
    "--color-surface-subtle",
    "--color-text",
    "--color-text-body",
    "--color-text-strong",
    "--color-text-muted",
    "--color-border",
    "--color-border-strong",
    "--color-accent",
    "--color-on-accent",
    "--color-accent-soft",
    "--color-brand",
    "--color-brand-soft",
    "--color-success",
    "--color-success-soft",
    "--color-danger",
    "--color-danger-soft",
    "--color-warning",
    "--color-warning-soft",
    "--color-info",
    "--color-info-soft",
}
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
        self.body_attrs: dict[str, str] = {}
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
        self.scripts: list[str] = []
        self.style_layers: list[str] = []
        self.headers: list[dict[str, str]] = []
        self.footers: list[dict[str, str]] = []

    def handle_decl(self, decl: str) -> None:
        if decl.lower().strip() == "doctype html":
            self.doctype = True

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        self.counts[tag] += 1
        if tag == "html":
            self.html_attrs = values
        if tag == "body":
            self.body_attrs = values
        if tag == "header":
            self.headers.append(values)
        if tag == "footer":
            self.footers.append(values)
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
            href = values.get("href", "")
            self.stylesheets.append(href)
            self.style_layers.append(href)
        elif tag == "style":
            self.style_layers.append("<style>")
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])

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


def inline_presentation_counts(source: str, parser: UIParser) -> dict[str, int]:
    """Count presentation debt, including button markup inside JS templates."""
    return {
        "style_blocks": parser.counts["style"],
        "style_attributes": len(INLINE_STYLE_RE.findall(source)),
        "event_handlers": len(INLINE_EVENT_RE.findall(source)),
        "buttons_missing_type": sum(
            1 for tag in BUTTON_TAG_RE.findall(source) if not TYPE_BUTTON_RE.search(tag)
        ),
    }

def css_block(source: str, selector: str) -> str:
    match = re.search(re.escape(selector) + r"\s*\{([^}]+)\}", source, re.DOTALL)
    return match.group(1) if match else ""


def color_values(block: str) -> dict[str, str]:
    return {
        name: value.lower()
        for name, value in re.findall(
            r"(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;", block
        )
    }


def relative_luminance(color: str) -> float:
    channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [
        channel / 12.92
        if channel <= 0.04045
        else math.pow((channel + 0.055) / 1.055, 2.4)
        for channel in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(left: str, right: str) -> float:
    lighter, darker = sorted(
        (relative_luminance(left), relative_luminance(right)), reverse=True
    )
    return (lighter + 0.05) / (darker + 0.05)


def audit_color_contract() -> list[str]:
    if not COLOR_TOKEN_PATH.exists():
        return ["css/tokens.css: missing canonical color contract"]
    source = COLOR_TOKEN_PATH.read_text(encoding="utf-8")
    light = color_values(css_block(source, ":root"))
    dark = color_values(css_block(source, ':root[data-theme="dark"]'))
    errors = []
    for theme, values in (("light", light), ("dark", dark)):
        missing = sorted(REQUIRED_COLOR_ROLES - values.keys())
        if missing:
            errors.append(
                f"css/tokens.css: {theme} theme missing color roles: {', '.join(missing)}"
            )
            continue
        checks = (
            ("accent text", values["--color-accent"], values["--color-canvas"]),
            ("filled accent", values["--color-on-accent"], values["--color-accent"]),
        )
        for label, foreground, background in checks:
            ratio = contrast_ratio(foreground, background)
            if ratio < 4.5:
                errors.append(
                    f"css/tokens.css: {theme} {label} contrast {ratio:.2f}:1 is below 4.5:1"
                )
    return errors


def audit_shared_shell() -> list[str]:
    errors = []
    if not SHARED_SHELL_CSS_PATH.exists():
        errors.append("css/site-shell.css: missing canonical site shell")
        return errors
    if not SHARED_SHELL_SCRIPT_PATH.exists():
        errors.append("js/site-shell.js: missing canonical site shell behavior")
        return errors

    css_source = SHARED_SHELL_CSS_PATH.read_text(encoding="utf-8").lower()
    script_source = SHARED_SHELL_SCRIPT_PATH.read_text(encoding="utf-8").lower()
    for role in (
        "--color-canvas",
        "--color-surface-raised",
        "--color-text",
        "--color-border",
        "--color-accent",
        "--color-accent-soft",
    ):
        if role not in css_source:
            errors.append(f"css/site-shell.css: shared shell must use {role}")
    for component in (
        ".site-header",
        ".site-foot",
        ".site-brand",
        ".site-theme-toggle",
    ):
        if component not in css_source:
            errors.append(f"css/site-shell.css: missing canonical component {component}")
    for behavior in ("themetoggle", "localstorage", "themechange"):
        if behavior not in script_source:
            errors.append(f"js/site-shell.js: missing shared behavior {behavior}")
    for legacy_color in ("#7c9cff", "#3a5bd9", "#151922", "#262c38"):
        if legacy_color in css_source or legacy_color in script_source:
            errors.append(
                f"shared site shell: legacy color {legacy_color} is not allowed"
            )
    return errors


def audit_site() -> list[str]:
    errors: list[str] = audit_color_contract() + audit_shared_shell()
    pages = public_pages()

    for page in pages:
        relative = page.relative_to(ROOT)
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

        design_index = next((i for i, href in enumerate(parser.style_layers) if "app-design-system.css" in href), None)
        readable_index = next((i for i, href in enumerate(parser.style_layers) if "language-app-readable.css" in href), None)
        shell_index = next((i for i, href in enumerate(parser.style_layers) if "site-shell.css" in href), None)
        if readable_index is not None and (design_index is None or readable_index < design_index):
            errors.append(f"{relative}: language readability CSS must load after app-design-system.css")
        if design_index is not None:
            unexpected_trailing = [
                layer for layer in parser.style_layers[design_index + 1:]
                if "language-app-readable.css" not in layer and "site-shell.css" not in layer
            ]
            if unexpected_trailing:
                errors.append(
                    f"{relative}: only language readability CSS and site-shell.css may "
                    f"follow app-design-system.css; found {', '.join(unexpected_trailing)}"
                )
        if readable_index is not None and shell_index is not None and readable_index > shell_index:
            errors.append(
                f"{relative}: language-app-readable.css must load before site-shell.css"
            )

        uses_shared_tokens = any(
            "tokens.css" in href or "app-design-system.css" in href
            for href in parser.stylesheets
        )
        page_kind = parser.body_attrs.get("data-page-kind", "")
        if not uses_shared_tokens and page_kind not in {"product", "exam-shell"}:
            errors.append(
                f"{relative}: must load the shared design system or declare a supported page kind"
            )

        body_classes = set(parser.body_attrs.get("class", "").split())
        if page_kind != "exam-shell":
            site_headers = [
                attrs for attrs in parser.headers
                if "site-header" in set(attrs.get("class", "").split())
            ]
            site_footers = [
                attrs for attrs in parser.footers
                if "site-foot" in set(attrs.get("class", "").split())
            ]
            if "site-page" not in body_classes:
                errors.append(f"{relative}: public page must include body.site-page")
            if len(site_headers) != 1:
                errors.append(
                    f"{relative}: shared shell requires exactly one header.site-header; "
                    f"found {len(site_headers)}"
                )
            if len(site_footers) != 1:
                errors.append(
                    f"{relative}: shared shell requires exactly one footer.site-foot; "
                    f"found {len(site_footers)}"
                )
            if shell_index is None:
                errors.append(f"{relative}: public page must load site-shell.css")
            elif shell_index != len(parser.style_layers) - 1:
                errors.append(f"{relative}: site-shell.css must be the final style layer")
            if not any("site-shell.js" in src for src in parser.scripts):
                errors.append(f"{relative}: public page must load site-shell.js")

        if "content-page" in body_classes:
            if page_kind != "content":
                errors.append(
                    f"{relative}: content page must declare data-page-kind=content"
                )
            required_styles = (
                "tokens.css",
                "app-design-system.css",
                "site-shell.css",
            )
            for required_style in required_styles:
                if not any(required_style in href for href in parser.stylesheets):
                    errors.append(
                        f"{relative}: content page must load {required_style}"
                    )
            for metric, count in inline_presentation_counts(source, parser).items():
                if count:
                    errors.append(
                        f"{relative}: content page requires zero {metric}; found {count}"
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
