# thangldw.github.io

Static portfolio, technical case studies and browser-based certification study tools.

Website: [thangldw.github.io](https://thangldw.github.io/)

## Active surfaces

| Group | Routes |
|---|---|
| Portfolio | `/`, `/apps/` |
| Certification study | `/apps/cert/` and its `/apps/cert/{slug}/` study spaces |

Legacy certification hubs, standalone JLPT practice routes, redirect routes and historical QA documents are intentionally not kept.

## Design source of truth

Read [AGENTS.md](AGENTS.md) before creating or editing a page.

Ordinary content and utility pages use:

- `css/tokens.css`
- `css/app-design-system.css`
- `css/site-shell.css`
- `js/site-shell.js`
- `body.site-page.portfolio-app.content-page`

Content pages, `/apps/` and `404.html` use the same static header and footer. The single-page portfolio resume at `/` embeds the shared brand and theme control in its main profile and intentionally has no header or footer. Exam and learning pages keep task-specific navigation while reusing semantic tokens whenever compatible.

## Data safety

Certification source data lives in the private `thangldw/cert` repository. `apps/cert/` is its generated GitHub Pages release artifact and should not be edited by hand.

Question banks, answers, vocabulary and exam datasets must be changed in `thangldw/cert`, validated there, and then released here.

## Local development

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. Root-relative assets and browser APIs make `file://` unsuitable.

## Validation

```bash
python3 scripts/audit_ui_standards.py
python3 scripts/validate_site.py
node scripts/smoke_cert.mjs
git diff --check
git status --short
```

The validators enforce semantic HTML, shared color roles, content-page design rules, metadata, local references and the absence of legacy redirects.

## Repository layout

```text
.
├── AGENTS.md   # page and cleanup contract
├── README.md   # repository operations
├── apps/       # active pages, exam UI and data
├── assets/     # shared images, icons and fonts
├── css/        # canonical tokens and shared components
├── js/         # shared runtime behavior
├── scripts/    # validation and controlled data refresh
├── index.html
└── sitemap.xml
```
