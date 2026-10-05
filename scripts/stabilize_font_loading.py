"""Apply the loading policy to published pages and generated app artifacts."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
changed = []
for page in root.rglob('*.html'):
    if '.git' in page.parts or '_sources' in page.parts:
        continue
    text = page.read_text()
    if 'site-shell.css' not in text:
        continue
    text = re.sub(r'site-shell\.css\?v=[\w-]+', 'site-shell.css?v=20261005stable', text)
    if 'as="font"' not in text:
        text = text.replace('</head>', '  <link rel="preload" href="/assets/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin>\n</head>')
    if text != page.read_text():
        page.write_text(text)
        changed.append(str(page.relative_to(root)))
for base in ('cert/assets', 'japan-pr-guide/assets'):
    for css in (root / base).glob('*.css'):
        text = css.read_text()
        updated = text.replace('font-display:swap', 'font-display:optional')
        if updated != text:
            css.write_text(updated)
            changed.append(str(css.relative_to(root)))
print(f'Updated {len(changed)} files')
