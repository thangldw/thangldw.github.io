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
CONTACT_EMAIL = "thangldw@gmail.com"
APP_CATALOG_PAGE = ROOT / "apps/index.html"
EXPECTED_PROJECT_VERSIONS = {
    "ragops": "v2.0.2",
    "proofline": "v2.0.2",
    "kakeflow": "v1.2.1",
    "maintainer-defense": "v1.1.1",
    "toolbox": "v2.0.0",
}
EXPECTED_HOMEPAGE_FEATURED_ORDER = {
    "ragops": 0,
    "proofline": 1,
    "kakeflow": 2,
    "toolbox": 4,
    "maintainer-defense": 5,
    "igo": 6,
    "pmp-studio": 7,
    "bjt": 8,
    "jlpt-n1-skills": 9,
    "fp3": 12,
    "g-kentei": 11,
    "ap": 10,
}
EXPECTED_LANGUAGE_COLLECTION_ORDER = 3
RETIRED_PROJECT_IDS = {"diskora", "changeora"}
CASE_STUDY_ROUTES = {
    "ragops": "/case-studies/ragops/",
    "proofline": "/case-studies/proofline/",
    "kakeflow": "/case-studies/kakeflow/",
    "certification-study": "/case-studies/certification-library/",
}
CASE_STUDY_SECTION_IDS = {
    "production-problem",
    "architecture-tradeoffs",
    "benchmark-failure",
    "demo-under-five",
    "ownership-leadership",
    "limitations-evidence",
}
SITE_FONT_STYLESHEET = "/css/site-shell.css?v=20261007brandstates"
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
    Path("docs/japan-pr-guide/DESIGN_CONTRACT.md"),
    Path("docs/japan-pr-guide/DESIGN_QA.md"),
    Path("docs/japan-pr-guide/README.md"),
    Path("docs/japan-pr-guide/historical-scoring-parity-plan.md"),
    Path("docs/superpowers/plans/2026-08-11-apps-viewport-background.md"),
    Path("docs/superpowers/plans/2026-08-12-japan-hsp-calculator-renewal.md"),
    Path("docs/superpowers/plans/2026-08-13-japan-hsp-score-spine.md"),
    Path("docs/superpowers/plans/2026-08-28-portfolio-flagship-case-studies.md"),
    Path("docs/superpowers/specs/2026-08-11-apps-viewport-background-design.md"),
    Path("docs/superpowers/specs/2026-08-12-japan-hsp-calculator-renewal-design.md"),
    Path("docs/superpowers/specs/2026-08-13-japan-hsp-score-spine-design.md"),
    Path("docs/superpowers/specs/2026-08-28-portfolio-flagship-case-studies-design.md"),
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.classes: Counter[str] = Counter()
        self.references: list[str] = []
        self.canonicals: list[str] = []
        self.refreshes: list[str] = []
        self.meta_names: dict[str, str] = {}
        self.meta_properties: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        self.classes.update(values.get("class", "").split())
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
    pages = sorted(path for path in ROOT.rglob("*.html") if "_sources" not in path.relative_to(ROOT).parts)
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
        language_collection = catalog.get("languageCollection")
        if catalog.get("schemaVersion") != 1:
            errors.append("js/projects-data.json: unsupported schemaVersion")
        if not isinstance(projects, list) or not isinstance(learning_collections, list):
            errors.append("js/projects-data.json: projects and learningCollections must be arrays")
        else:
            entries = projects + learning_collections
            required_project_fields = {
                "id", "title", "description", "href", "ariaLabel", "icon",
                "accent", "status", "tags", "category", "categoryLabel", "cta",
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
                case_study_href = project.get("caseStudyHref")
                if case_study_href is not None:
                    if not isinstance(case_study_href, str) or not case_study_href.startswith(
                        "/case-studies/"
                    ):
                        errors.append(
                            f"js/projects-data.json: entry {index} has invalid caseStudyHref"
                        )
                    else:
                        target = local_target(catalog_path, case_study_href)
                        if target is None or not target.is_file():
                            errors.append(
                                "js/projects-data.json: broken caseStudyHref "
                                f"{case_study_href}"
                            )
            duplicates = sorted(
                identifier for identifier, count in Counter(identifiers).items() if count > 1
            )
            if duplicates:
                errors.append(
                    f"js/projects-data.json: duplicate ids: {', '.join(duplicates)}"
                )
            project_by_id = {
                project.get("id"): project
                for project in projects
                if isinstance(project, dict) and isinstance(project.get("id"), str)
            }
            for project_id, expected_version in EXPECTED_PROJECT_VERSIONS.items():
                project = project_by_id.get(project_id)
                if not isinstance(project, dict):
                    errors.append(f"js/projects-data.json: missing {project_id} project")
                elif project.get("status") != expected_version:
                    errors.append(
                        "js/projects-data.json: "
                        f"{project_id} status must be {expected_version}"
                    )
            featured_projects = {
                project.get("id"): project.get("featuredOrder")
                for project in projects
                if isinstance(project, dict) and project.get("featured") is True
            }
            if featured_projects != EXPECTED_HOMEPAGE_FEATURED_ORDER:
                errors.append(
                    "js/projects-data.json: homepage featured projects must be "
                    + ", ".join(
                        f"{project_id}:{order}"
                        for project_id, order in EXPECTED_HOMEPAGE_FEATURED_ORDER.items()
                    )
                )
            for retired_id in sorted(RETIRED_PROJECT_IDS & project_by_id.keys()):
                errors.append(
                    f"js/projects-data.json: retired project {retired_id} must be removed"
                )
            if sum(project_id == "toolbox" for project_id in project_by_id) != 1:
                errors.append("js/projects-data.json: Toolbox must appear exactly once")
            for project_id, expected_href in CASE_STUDY_ROUTES.items():
                if project_id == "certification-study":
                    continue
                project = project_by_id.get(project_id)
                if not isinstance(project, dict) or project.get("caseStudyHref") != expected_href:
                    errors.append(
                        "js/projects-data.json: "
                        f"{project_id} caseStudyHref must be {expected_href}"
                    )
            if not isinstance(language_collection, dict):
                errors.append("js/projects-data.json: missing languageCollection")
            elif language_collection.get("caseStudyHref") != CASE_STUDY_ROUTES[
                "certification-study"
            ]:
                errors.append(
                    "js/projects-data.json: Certification Library caseStudyHref must be "
                    f"{CASE_STUDY_ROUTES['certification-study']}"
                )
            elif language_collection.get("featuredOrder") != EXPECTED_LANGUAGE_COLLECTION_ORDER:
                errors.append(
                    "js/projects-data.json: Certification Library featuredOrder must be "
                    f"{EXPECTED_LANGUAGE_COLLECTION_ORDER}"
                )
            else:
                target = local_target(catalog_path, language_collection["caseStudyHref"])
                if target is None or not target.is_file():
                    errors.append(
                        "js/projects-data.json: broken Certification Library "
                        f"caseStudyHref {language_collection['caseStudyHref']}"
                    )
            kakeflow = next(
                (project for project in projects if project.get("id") == "kakeflow"),
                None,
            )
            if not isinstance(kakeflow, dict):
                errors.append("js/projects-data.json: missing KakeFlow project")
            elif kakeflow.get("href") != "https://thangldw.github.io/kakeflow/":
                errors.append(
                    "js/projects-data.json: KakeFlow must link to its public landing page"
                )
            if "kakeflow-releases" in catalog_path.read_text(encoding="utf-8"):
                errors.append(
                    "js/projects-data.json: retired KakeFlow repository must not be referenced"
                )
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"js/projects-data.json: cannot load catalog: {exc}")

    certification_manifest_path = ROOT / "cert/certifications-manifest.json"
    try:
        certification_manifest = json.loads(
            certification_manifest_path.read_text(encoding="utf-8")
        )
        certifications = certification_manifest.get("certifications")
        if certification_manifest.get("schemaVersion") != "1.0":
            errors.append(
                "cert/certifications-manifest.json: unsupported schemaVersion"
            )
        if not isinstance(certifications, list):
            errors.append(
                "cert/certifications-manifest.json: certifications must be an array"
            )
        elif certification_manifest.get("certificationCount") != len(certifications):
            errors.append(
                "cert/certifications-manifest.json: certificationCount mismatch"
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
                        f"cert/certifications-manifest.json: entry {index} must be an object"
                    )
                    continue
                unexpected = sorted(certification.keys() - allowed_fields)
                missing = sorted(allowed_fields - certification.keys())
                if unexpected or missing:
                    errors.append(
                        "cert/certifications-manifest.json: "
                        f"entry {index} fields differ; missing={missing}, unexpected={unexpected}"
                    )
                exam = certification.get("exam")
                if not isinstance(exam, dict) or set(exam.keys()) != allowed_exam_fields:
                    errors.append(
                        f"cert/certifications-manifest.json: entry {index} has invalid exam metadata"
                    )
                identifier = certification.get("id")
                if isinstance(identifier, str):
                    manifest_ids.append(identifier)
                href = certification.get("href")
                if isinstance(href, str):
                    target = local_target(certification_manifest_path, href)
                    if target is not None and not target.exists():
                        errors.append(
                            f"cert/certifications-manifest.json: broken href {href}"
                        )
            duplicate_manifest_ids = sorted(
                identifier
                for identifier, count in Counter(manifest_ids).items()
                if count > 1
            )
            if duplicate_manifest_ids:
                errors.append(
                    "cert/certifications-manifest.json: duplicate ids: "
                    + ", ".join(duplicate_manifest_ids)
                )
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(
            f"cert/certifications-manifest.json: cannot load manifest: {exc}"
        )

    markdown_files = {
        path.relative_to(ROOT)
        for path in ROOT.rglob("*.md")
        if ".git" not in path.parts and "_sources" not in path.relative_to(ROOT).parts
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

        if page == APP_CATALOG_PAGE:
            for removed_class in ("catalog-tools", "catalog-toolbar"):
                if parser.classes[removed_class]:
                    errors.append(
                        f"apps/index.html: removed catalog control .{removed_class} must not be rendered"
                    )

        is_redirect = parser.refreshes or any(urlsplit(reference).path.endswith("redirect.js") for reference in parser.references)
        if page != ROOT / "index.html" and not is_redirect:
            support_scripts = [reference for reference in parser.references if urlsplit(reference).path == "/js/support-dialog.js"]
            if not support_scripts and "Support my work" not in page.read_text(encoding="utf-8"):
                errors.append(f"{page.relative_to(ROOT)}: missing optional support entry")

        duplicates = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
        if duplicates:
            errors.append(f"{page.relative_to(ROOT)}: duplicate ids: {', '.join(duplicates)}")

        analytics_references = [
            reference for reference in parser.references if urlsplit(reference).path == ANALYTICS_SCRIPT
        ]
        # The owner-held PMP app intentionally has no analytics or remote tracking.
        if parser.refreshes or page.relative_to(ROOT).as_posix() in {"pmp/index.html", "jlpt-n1/index.html", "apps/pmp/index.html", "cert/pmp/index.html"}:
            if analytics_references:
                errors.append(
                    f"{page.relative_to(ROOT)}: redirect pages and standalone study apps must not load analytics"
                )
        elif len(analytics_references) != 1:
            errors.append(
                f"{page.relative_to(ROOT)}: expected one {ANALYTICS_SCRIPT} reference"
            )

        font_references = [
            reference
            for reference in parser.references
            if reference.startswith("/css/site-shell.css?v=")
        ]
        if not parser.refreshes and (len(font_references) != 1 or font_references[0] not in {SITE_FONT_STYLESHEET, "/css/site-shell.css?v=20261007brandstates"}):
            errors.append(
                f"{page.relative_to(ROOT)}: expected one approved shared font stylesheet reference"
            )

        for reference in parser.references:
            target = local_target(page, reference)
            if target is not None and not target.exists():
                errors.append(f"{page.relative_to(ROOT)}: broken reference {reference}")

    for path in sorted((*ROOT.rglob("*.html"), *ROOT.rglob("*.css"), *ROOT.rglob("*.js"))):
        if "_sources" in path.relative_to(ROOT).parts:
            continue  # Jekyll excludes build sources; validate generated public assets instead.
        content = path.read_text(encoding="utf-8")
        for label, pattern in EXTERNAL_FONT_PATTERNS.items():
            if pattern in content:
                errors.append(f"{path.relative_to(ROOT)}: external font dependency ({label})")

    for page, parser in parsed_pages.items():
        if parser.refreshes:
            relative = page.relative_to(ROOT).as_posix()
            if relative.startswith("apps/cert/"):
                suffix = relative[len("apps/cert/"):].removesuffix("index.html")
                target = "/pmp/" if suffix == "pmp/" else "/cert/" + suffix
                if parser.refreshes != [f"0;url={target}"] or not (ROOT / target.lstrip("/") / "index.html").exists():
                    errors.append(f"{relative}: invalid certification redirect")
                script = (ROOT / "apps/cert/redirect.js").read_text()
                if "location.replace(target + location.search + location.hash)" not in script:
                    errors.append(f"{relative}: redirect must preserve query and hash")
                continue
            if relative == "jlpt/index.html":
                if 'location.replace("/jlpt-n1/"+location.search+location.hash)' not in page.read_text() or not (ROOT / "jlpt-n1/index.html").is_file():
                    errors.append(f"{relative}: invalid JLPT compatibility redirect")
                continue
            if relative in {"cert/bjt/index.html", "cert/fp3/index.html"}:
                slug = relative.split("/")[1]
                script = (ROOT / f"cert/{slug}/redirect.js").read_text()
                if parser.refreshes != [f"0;url=/{slug}/"] or not (ROOT / f"{slug}/index.html").is_file() or f'location.replace("/{slug}/" + location.search + location.hash)' not in script:
                    errors.append(f"{relative}: invalid {slug} compatibility redirect")
                continue
            if relative == "cert/g/index.html":
                script = (ROOT / "cert/g/redirect.js").read_text()
                if parser.refreshes != ["0;url=/g-kentei/"] or not (ROOT / "g-kentei/index.html").is_file() or 'location.replace("/g-kentei/" + location.search + location.hash)' not in script:
                    errors.append(f"{relative}: invalid G検定 compatibility redirect")
                continue
            if relative == "cert/jlpt/index.html" or relative.startswith("cert/n1-modules/"):
                refresh = parser.refreshes[0] if len(parser.refreshes) == 1 else ""
                destination = refresh.removeprefix("0;url=")
                parsed = urlsplit(destination)
                if parsed.path != "/jlpt-n1/" or parsed.scheme or parsed.netloc or not (ROOT / "jlpt-n1/index.html").is_file():
                    errors.append(f"{relative}: invalid standalone JLPT redirect")
                continue
            if relative != "apps/japan-pr-guide/index.html" or parser.refreshes != ["0; url=/japan-pr-guide/"]:
                errors.append(f"{page.relative_to(ROOT)}: unapproved redirect")
            elif 'location.replace("/japan-pr-guide/" + location.search + location.hash)' not in page.read_text():
                errors.append(f"{page.relative_to(ROOT)}: redirect must preserve query and hash")

    for route in CASE_STUDY_ROUTES.values():
        page_file = ROOT / route.lstrip("/") / "index.html"
        parser = parsed_pages.get(page_file)
        if parser is None:
            errors.append(f"{page_file.relative_to(ROOT)}: required case study is missing")
            continue
        missing_sections = sorted(CASE_STUDY_SECTION_IDS - set(parser.ids))
        if missing_sections:
            errors.append(
                f"{page_file.relative_to(ROOT)}: missing case-study sections: "
                + ", ".join(missing_sections)
            )

    certification_case_study = (
        ROOT / "case-studies/certification-library/index.html"
    )
    if certification_case_study.is_file():
        certification_case_text = certification_case_study.read_text(encoding="utf-8").lower()
        forbidden_certification_text = {
            "github.com/thangldw/cert",
            "protected-data/",
            "question-media/",
            "data/certifications/",
            '"correctanswer"',
        }
        for forbidden in sorted(forbidden_certification_text):
            if forbidden in certification_case_text:
                errors.append(
                    "case-studies/certification-library/index.html: "
                    f"forbidden private-content reference {forbidden}"
                )

    home_references = parsed_pages.get(ROOT / "index.html", PageParser()).references
    for contact_page in [ROOT / "index.html", *(ROOT / route.lstrip('/') / 'index.html' for route in CASE_STUDY_ROUTES.values())]:
        references = parsed_pages.get(contact_page, PageParser()).references
        if not any(urlsplit(reference).scheme == 'mailto' and urlsplit(reference).path == CONTACT_EMAIL for reference in references):
            errors.append(f"{contact_page.relative_to(ROOT)}: missing portable email contact")

    sitemap_root = ET.parse(ROOT / "sitemap.xml").getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = {node.text for node in sitemap_root.findall("s:url/s:loc", namespace)}

    for route in CASE_STUDY_ROUTES.values():
        expected_url = SITE_URL + route
        if expected_url not in sitemap_urls:
            errors.append(f"sitemap.xml: missing case-study URL {expected_url}")

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
        page_required_og = required_og | {"og:image"}
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
        "with social metadata, approved route redirects, and all local references."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
