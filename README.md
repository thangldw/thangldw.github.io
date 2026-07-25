# thangldw.github.io

Static portfolio, technical case studies and browser-based certification study tools.

Website: [thangldw.github.io](https://thangldw.github.io/)

## Active surfaces

| Group | Routes |
|---|---|
| Portfolio | `/`, `/apps/` |
| Product and solution pages | `/apps/kakeflow/`, `/apps/namiquant/`, `/apps/data-copilot/`, `/apps/pipeline/`, `/apps/earthquake-intelligence/`, `/apps/city-climate/` |
| Certification hubs | `/apps/cert/`, `/apps/gkentei/`, `/apps/bjt-study/`, `/apps/jlpt-n1/` |
| JLPT practice | Canonical `/apps/n1-*` routes listed in `sitemap.xml` |

Legacy redirect routes and historical QA documents are intentionally not kept.

## Design source of truth

Read [AGENTS.md](AGENTS.md) before creating or editing a page.

Ordinary content and utility pages use:

- `css/tokens.css`
- `css/app-footer.css`
- `css/app-design-system.css`
- `js/site-header-v2.js`
- `body.portfolio-app.content-page`

Product/solution pages may use a custom composition. Exam and learning pages may keep task-specific interaction, but shared chrome and colors should still use semantic tokens whenever compatible.

## Data safety

Question banks, answers, vocabulary, grammar, reading passages and exam datasets are repository assets, not cleanup candidates. Do not delete, shorten, reorder or regenerate them unless the task explicitly names the dataset.

Current data locations include:

- `apps/gkentei/questions.json`
- `apps/bjt-study/data/`
- `apps/jlpt-n1/quiz-data.js`
- `apps/n1-*/data.js`
- embedded question data in active learning pages

Runtime snapshots used by active technical pages are also retained:

- `apps/data-copilot/data/`
- `apps/public-signals/data/`

## Local development

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. Root-relative assets and browser APIs make `file://` unsuitable.

## Data refresh

Market data:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install pandas pyarrow
python3 scripts/fetch_stocks.py
```

Public climate and earthquake signals:

```bash
python3 scripts/fetch_public_signals.py
```

Review schema and diff before committing generated data.

## Validation

```bash
python3 scripts/audit_ui_standards.py
python3 scripts/validate_site.py
node scripts/smoke_learning_apps.mjs
node scripts/qa_jlpt_n1.mjs
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
