# Portfolio Flagship Case Studies Implementation Plan

**Goal:** Correct stale portfolio versions, replace Diskora and Changeora with Toolbox, and publish four evidence-grounded flagship case studies without changing the site's dependency-light GitHub Pages architecture.

**Architecture:** Keep `js/projects-data.json` as the durable project catalog. Add optional `caseStudyHref` routing for homepage cards while `/apps/` retains direct product links. Publish four static English pages that share one stylesheet and are validated by the existing static and browser gates.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Python standard library, Node.js 22, Chrome, GitHub Pages.

## Global constraints

- Do not modify generated files under `apps/cert/`.
- Do not publish Certification Library prompts, choices, answers, explanations, protected identifiers, private repository URLs, or learner data.
- Label synthetic evidence, exact-head CI, public releases, private source, and missing evidence precisely.
- Do not infer adoption, users, production usage, notarization, or team leadership.
- Use English-only case-study content.
- Preserve direct destinations from `/apps/`; only homepage and RAGOps spotlight route to case studies.
- No framework, package build, backend, runtime Markdown, external font, new analytics provider, or media placeholder.
- Work from `origin/master` in `codex/portfolio-case-studies` and make task-level commits.

---

### Task 1: Add failing catalog and case-study contracts

**Files:**
- Modify: `scripts/validate_site.py`

**Contracts:**
- Catalog versions: RAGOps `v2.0.2`, Proofline `v2.0.2`, KakeFlow `v1.2.1`, Awesome Maintainer Defense `v1.1.1`, Toolbox `v2.0.0`.
- Catalog composition: exactly one Toolbox entry; no Diskora or Changeora entries.
- Case-study routes: four local `caseStudyHref` values that resolve to HTML pages.
- Page structure: six stable section IDs per route.
- Privacy: Certification Library case study contains no private repository URL or protected-content field names.

- [ ] Extend catalog validation with an explicit expected-version map and retired-ID guard.
- [ ] Validate optional `caseStudyHref` type, `/case-studies/.../` prefix, and resolved local target.
- [ ] Validate the four required case-study files, six section IDs, and sitemap membership.
- [ ] Add a bounded text guard for Certification Library exclusions.
- [ ] Run `python3 scripts/validate_site.py` and verify RED because catalog metadata and pages have not been updated.
- [ ] Commit only after Tasks 2 and 3 turn these contracts GREEN; do not commit a permanently failing default branch.

### Task 2: Correct the catalog and split homepage/direct routing

**Files:**
- Modify: `js/projects-data.json`
- Modify: `js/projects-data.js`
- Modify: `js/main.js`

**Interfaces:**
- Catalog entry input: optional `caseStudyHref`.
- Homepage destination: `project.caseStudyHref || project.href`.
- `/apps/` destination: unchanged `project.href`.
- Spotlight destination: `/case-studies/ragops/` with action label `Read case study`.

- [ ] Update the selected released versions and current project descriptions.
- [ ] Remove `diskora` and `changeora`; add one `toolbox` entry linking to `v2.0.0`.
- [ ] Add case-study links to RAGOps, Proofline, KakeFlow, and the Certification Library language collection.
- [ ] Preserve the loader's existing required fields and accept `caseStudyHref` only as an optional string.
- [ ] Change homepage card construction to use the case-study fallback expression.
- [ ] Change only the RAGOps spotlight URL and CTA label; do not alter `/apps/` card routing.
- [ ] Run JSON parsing and JavaScript syntax checks:

```bash
python3 -m json.tool js/projects-data.json >/dev/null
node --check js/projects-data.js
node --check js/main.js
```

- [ ] Verify the static validator still fails only for the not-yet-created case-study pages.

### Task 3: Publish the shared case-study surface and factual narratives

**Files:**
- Add: `css/case-study.css`
- Add: `case-studies/ragops/index.html`
- Add: `case-studies/proofline/index.html`
- Add: `case-studies/kakeflow/index.html`
- Add: `case-studies/certification-library/index.html`
- Modify: `sitemap.xml`
- Modify: `README.md`

**Evidence sources:**
- RAGOps: public `v2.0.2` README, release notes, architecture, operations, security, exact-head CI, credential-free synthetic demo.
- Proofline: public `v2.0.2` README, documentation hub, architecture, stale-decision demo, synthetic 10,000-decision benchmark, exact-head CI.
- KakeFlow: public `v1.2.1` README, documentation, release, PWA, receipt-to-provenance demo, exact-head Quality workflow.
- Certification Library: live application, public manifest, and freshly verified sanitized aggregate output from the private source quality gate.

- [ ] Re-verify every release link, default-branch document link, workflow conclusion, public manifest count, and sanitized Certification Library aggregate before writing claims.
- [ ] Create one shared editorial stylesheet using existing tokens, Inter, theme variables, visible focus, responsive evidence summary, and locally scrollable code blocks.
- [ ] Create four complete semantic pages with unique canonical/OG metadata and the same six stable IDs:
  - `production-problem`
  - `architecture-tradeoffs`
  - `benchmark-failure`
  - `demo-under-five`
  - `ownership-leadership`
  - `limitations-evidence`
- [ ] Give each page evidence-as-of metadata, evidence-type labels, primary links, back navigation, and sibling case-study links.
- [ ] Keep the Certification Library narrative sanitized and describe static protection as extraction-cost hardening, not access control.
- [ ] Add all four URLs to `sitemap.xml` and document the route responsibility in `README.md`.
- [ ] Run `python3 scripts/validate_site.py` and verify GREEN.
- [ ] Run `python3 scripts/audit_ui_standards.py` and verify GREEN.
- [ ] Run `git diff --check`.
- [ ] Commit Tasks 1–3:

```bash
git add scripts/validate_site.py js/projects-data.json js/projects-data.js js/main.js css/case-study.css case-studies sitemap.xml README.md
git commit -m "feat: publish flagship portfolio case studies"
```

### Task 4: Extend rendered browser coverage

**Files:**
- Modify: `scripts/smoke_cert.mjs`
- Modify if QA finds a defect: files owned by Tasks 2–3

**Target flows:**
- `/` -> RAGOps homepage card -> `/case-studies/ragops/` -> repository/release evidence link.
- `/apps/` -> RAGOps card -> direct GitHub repository.
- Each case-study route -> six visible sections -> sibling navigation.

- [ ] Add browser assertions for homepage case-study routing and `/apps/` direct routing.
- [ ] Add route/content/overflow checks for all four case studies at desktop and 390px widths.
- [ ] Add theme-toggle and keyboard-focus coverage without weakening existing Certification Library smoke checks.
- [ ] Run `node scripts/smoke_cert.mjs` and fix only reproducible regressions.
- [ ] Run the complete local release gate:

```bash
python3 scripts/audit_ui_standards.py
python3 scripts/validate_site.py
node scripts/smoke_cert.mjs
git diff --check
```

- [ ] Commit rendered coverage and any bounded corrections:

```bash
git add scripts/smoke_cert.mjs css/case-study.css case-studies js
git commit -m "test: cover flagship recruiter paths"
```

### Task 5: Independent browser QA and exact-artifact release

**Files:**
- Modify only if QA identifies a reproducible defect.
- Do not commit screenshots, traces, temporary profiles, or reports.

- [ ] Start the static server on the repository's documented port.
- [ ] Use the in-app Browser to verify page identity, meaningful DOM, console health, no framework overlay, screenshot evidence, and the target interactions.
- [ ] Test desktop and 390x844 mobile viewports for all four case studies; check clipping, overlap, link focus, theme, code overflow, missing assets, and page-level horizontal overflow.
- [ ] Re-run the complete local release gate after any correction.
- [ ] Inspect `git diff`, commit scope, and exact HEAD status.
- [ ] Push `codex/portfolio-case-studies` and create a focused PR against `master`.
- [ ] Wait for required CI at the exact PR head; resolve only in-scope failures.
- [ ] Merge after green CI, then wait for GitHub Pages to report `built` for the exact merged SHA.
- [ ] Allow CDN propagation and production-smoke:
  - homepage metadata and Toolbox replacement;
  - each case-study canonical route;
  - homepage case-study routing;
  - `/apps/` direct product routing;
  - desktop and 390px rendering;
  - live Certification Library link and public manifest.
- [ ] Report the deployed SHA, commands, result counts, production URLs, screenshots, and remaining evidence gaps. Do not report videos or non-synthetic evaluation as complete.
