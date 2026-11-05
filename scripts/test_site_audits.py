import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import audit_ui_standards as ui
import validate_design_system as design
from validate_site import PageParser, audit_analytics, tracked_local_metadata


class SiteAuditRegressionTests(unittest.TestCase):
    def test_isolated_support_export_cannot_drift_from_canonical_tokens(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative in ['css/tokens.css', 'css/site-shell.css', 'css/homepage.css', 'css/apps-catalog.css', 'css/support-tokens.css', 'DESIGN.md', 'index.html', 'apps/index.html', 'aws/index.html']:
                target = root / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((design.ROOT / relative).read_bytes())
            with patch.object(design, 'ROOT', root):
                self.assertEqual(design.audit_design_system(), [])
                support = root / 'css/support-tokens.css'
                support.write_text(support.read_text().replace('--color-canvas: #ffffff;', '--color-canvas: #000000;'))
                self.assertTrue(any('generated tokens differ' in error for error in design.audit_design_system()))

    def test_metadata_is_checked_in_the_published_git_tree(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", directory], check=True)
            (root / ".gitignore").write_text(".DS_Store\n")
            (root / "nested").mkdir()
            for path in [root / ".DS_Store", root / "nested/.DS_Store"]:
                path.write_bytes(b"Finder metadata")
            self.assertEqual(tracked_local_metadata(root), [])
            subprocess.run(["git", "-C", directory, "add", "-f", ".DS_Store", "nested/.DS_Store"], check=True)
            self.assertEqual(tracked_local_metadata(root), [".DS_Store", "nested/.DS_Store"])

    def test_analytics_opt_out_forbids_tracking_without_weakening_default(self):
        tracker = '<script src="/js/analytics.js"></script>'
        for body, scripts, valid in [
            ('data-analytics="off"', '', True),
            ('data-analytics="off"', tracker, False),
            ('', '', False),
            ('', tracker, True),
            ('', tracker + tracker, False),
        ]:
            with self.subTest(body=body, scripts=scripts):
                parser = PageParser()
                parser.feed(f'<html><body {body}>{scripts}</body></html>')
                self.assertEqual(not audit_analytics(Path("aws/index.html"), parser), valid)

    def test_generated_fallback_keeps_landmark_and_style_gates(self):
        source = (ui.ROOT / "aws/index.html").read_text()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / "index.html"
            with patch.object(ui, "ROOT", root), patch.object(ui, "public_pages", return_value=[page]):
                page.write_text(source)
                self.assertEqual(ui.audit_site(), [])
                page.write_text(source.replace('<h1>AWS SAA</h1>', ''))
                self.assertTrue(any('source <h1>' in error for error in ui.audit_site()))
                page.write_text(source.replace('class="site-header"', 'class="missing-header"'))
                self.assertTrue(any('header.site-header' in error for error in ui.audit_site()))
                page.write_text(source.replace('<link rel="stylesheet" href="/css/site-shell.css?v=20261011vi">', ''))
                self.assertTrue(any('must load site-shell.css' in error for error in ui.audit_site()))


if __name__ == "__main__":
    unittest.main()
