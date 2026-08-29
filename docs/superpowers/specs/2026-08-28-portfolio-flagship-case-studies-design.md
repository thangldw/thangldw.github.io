# Portfolio Flagship Case Studies Design

## Goal

Turn the portfolio homepage into a recruiter path that leads from a concise project card to a shareable, evidence-grounded case study, while correcting stale release metadata and preserving the site's dependency-light GitHub Pages architecture.

This design covers the website workstream only. Demo-video production and a non-synthetic RAGOps evaluation remain separate evidence workstreams because neither can be represented honestly by a website-only change.

## Current-state evidence

The website has one durable catalog source, `js/projects-data.json`, loaded by both the portfolio homepage and `/apps/`. The catalog currently exposes stale project identities and versions:

- RAGOps is shown as `v1.0` instead of `v2.0.2`.
- Proofline is shown as `v0.14.17` instead of `v2.0.2`.
- KakeFlow is shown as `v1.2.0` instead of `v1.2.1`.
- Awesome Maintainer Defense is shown as `v1.0` instead of `v1.1.1`.
- Diskora and Changeora remain separate entries even though Toolbox `v2.0.0` is now the maintained product.

The site has no case-study route. Homepage cards and catalog cards both currently resolve through the same `href`, so changing that field to a case-study URL would remove the direct product destination from `/apps/`.

## Selected architecture

Add four English-only static case-study pages:

- `/case-studies/ragops/`
- `/case-studies/proofline/`
- `/case-studies/kakeflow/`
- `/case-studies/certification-library/`

Each route owns its semantic HTML and factual narrative. All four share `css/case-study.css`, the existing design tokens, self-hosted fonts, theme behavior, analytics contract, and social image assets. No framework, package-manager build, backend, runtime Markdown renderer, or external data dependency is introduced.

The portfolio homepage remains the case-study index. A separate `/case-studies/` hub is not added.

## Catalog contract and routing

Add an optional `caseStudyHref` field to project and language-collection entries.

- The homepage project rail uses `caseStudyHref || href`.
- The `/apps/` catalog continues to use `href`, preserving direct access to the repository, release, or live application.
- The RAGOps spotlight links to its case study and changes its action label from `Open demo` to `Read case study`.
- Entries without a case study retain current behavior.
- If `caseStudyHref` is absent, the homepage falls back to `href`; there is no blank or disabled card state.

`scripts/validate_site.py` validates that every provided `caseStudyHref` is a local `/case-studies/.../` route that resolves to an HTML page.

## Catalog corrections

Update the existing catalog as follows:

| Project | Public status | Direct destination |
| --- | --- | --- |
| RAGOps | `v2.0.2` | `https://github.com/thangldw/ragops` |
| Proofline | `v2.0.2` | `https://github.com/thangldw/proofline` |
| KakeFlow | `v1.2.1` | `https://thangldw.github.io/kakeflow/` |
| Awesome Maintainer Defense | `v1.1.1` | `https://github.com/thangldw/awesome-maintainer-defense` |
| Toolbox | `v2.0.0` | `https://github.com/thangldw/toolbox/releases/tag/v2.0.0` |

Remove the separate Diskora and Changeora catalog entries and replace them with one Toolbox entry. This changes only portfolio presentation; it does not remove historical repositories, releases, or files.

## Case-study information architecture

Every case study uses the same visible sequence:

1. **Production problem** — the operational failure or decision the system addresses, without claiming customer adoption.
2. **Architecture and trade-offs** — the selected boundaries, rejected alternatives, and why the design is appropriate for the stated scope.
3. **Benchmark or failure case** — reproducible evidence with an explicit evidence type such as synthetic regression, exact-head CI, public release artifact, or production-site smoke.
4. **Reproduce in under five minutes** — the shortest released-version path, including prerequisites and expected output.
5. **What I designed and led** — ownership grounded in repository history; solo ownership is not described as team leadership.
6. **Limitations and missing evidence** — unsupported production, adoption, signing, hosted, multi-user, or external-evaluation claims are named directly.

Each page also contains:

- a one-sentence outcome-led hero;
- project status and evidence-status labels;
- an evidence-as-of date;
- primary links to the repository, release, live product, documentation, or public manifest as applicable;
- a back-to-portfolio link and links to the other flagship case studies.

## Page-specific evidence boundaries

### RAGOps

- Present the deterministic offline release-gate architecture and credential-free `BLOCK` demo.
- Label citation and groundedness deltas as synthetic regression evidence.
- Link to `v2.0.2`, architecture, operations, security, and the public repository.
- State that customer adoption, a consented pilot, and non-synthetic evaluation evidence are not yet published.

### Proofline

- Present immutable source versions, exact citations, stale-decision detection, and root-hash evidence verification.
- Label the 10,000-decision figures as synthetic scale regression evidence.
- Link to `v2.0.2`, documentation, and the public repository.
- State the current one-local-user boundary and the absence of hosted-team production evidence.

### KakeFlow

- Present reviewed ingestion, double-entry ledger boundaries, row-level lineage, and local receipt processing.
- Use the released receipt-to-provenance demo and exact-head Quality workflow as evidence without claiming user adoption.
- Link to `v1.2.1`, the PWA, product website, documentation, and repository.
- Preserve distribution, managed-sync, and production-adoption limitations; do not claim notarization without external proof.

### Certification Library

- Present the private-source-to-public-artifact pipeline, semantic data gates, protected build output, lazy hydration, and local learning state.
- Publish only aggregate counts already allowed by the public manifest or a freshly verified sanitized quality-gate summary.
- Do not publish prompts, choices, answers, explanations, protected asset identifiers, private repository URLs, or learner data.
- State that static asset protection raises extraction cost but is not server-side access control.
- Link to the live Certification Library and its public metadata manifest.

## Presentation

Use an editorial evidence layout rather than product-marketing cards:

- a narrow reading column for narrative sections;
- a compact evidence summary beside the hero on wide screens and inline on mobile;
- visible evidence-type labels such as `Synthetic`, `Exact-head CI`, `Public release`, `Private source`, and `Not yet evidenced`;
- semantic headings, lists, tables, code blocks, and links without custom interaction JavaScript;
- one-column rendering below the existing mobile breakpoint, no horizontal page overflow, and readable code blocks with local horizontal scrolling only.

The pages use the existing color tokens and Inter font. They do not introduce diagrams, generated illustrations, autoplay media, external fonts, or decorative animation.

## Data flow and failure behavior

The case-study pages are static and render without fetching GitHub, release, or certification data at runtime. This avoids rate limits, client-side loading states, and external availability coupling.

The catalog loader remains responsible only for project metadata. If the JSON request fails, existing homepage and `/apps/` empty-state behavior remains unchanged. If a case-study field is omitted, the project resolves to its direct destination.

Version and evidence statements are snapshot-based. Every case study displays an evidence-as-of date and links to its authoritative source so a later release can be audited without implying automatic freshness.

## Privacy and claims policy

- No private Certification Library source or question content is copied into this repository.
- Aggregate certification metrics must be regenerated or verified immediately before publication.
- Synthetic benchmarks are never labeled production benchmarks.
- Release downloads are not labeled users or adoption.
- A green workflow is described by workflow name and exact revision; skipped, disabled, or startup-failed checks are not represented as passing.
- Ownership language distinguishes personal design and maintenance from collaboration or team leadership.

## Validation

Extend the existing static validator and browser smoke coverage rather than adding a new test framework.

Static validation must prove:

- the catalog contains the corrected project set and versions;
- Diskora and Changeora are absent and Toolbox is present once;
- every `caseStudyHref` resolves locally;
- every case study has one canonical URL, valid description, required Open Graph fields, one analytics reference, and no broken local references;
- every case study contains the six required section identifiers;
- the Certification Library case study contains no disallowed private-content fields or private repository URL;
- all four case-study URLs are present in `sitemap.xml`.

Rendered validation must cover:

- homepage flagship card to case study to primary evidence link;
- `/apps/` card still opening the direct product destination;
- all four pages at desktop and 390px mobile widths;
- meaningful content, no framework overlay, no relevant console errors or warnings, no horizontal page overflow, visible focus, and correct theme rendering.

The existing commands remain authoritative:

```bash
python3 scripts/audit_ui_standards.py
python3 scripts/validate_site.py
node scripts/smoke_cert.mjs
```

After merge, wait for GitHub Pages to build the exact commit, allow CDN propagation, and repeat the homepage-to-case-study production smoke on desktop and mobile.

## Out of scope

- Recording or publishing the RagOps and Proofline demo videos.
- Selecting or running a public non-synthetic evaluation dataset.
- Claiming a consented production pilot.
- Modifying the RAGOps, Proofline, KakeFlow, Toolbox, Awesome Maintainer Defense, or Certification Library source repositories.
- Editing generated files under `apps/cert/`.
- Adding a CMS, templating engine, package build, backend, contact form, analytics provider, or new project.

## Acceptance criteria

- Homepage clicks for the four flagships open their case studies; `/apps/` retains direct project destinations.
- Catalog versions match the selected released versions and Toolbox replaces Diskora and Changeora.
- Each case study answers all six recruiter questions in English and exposes its evidence type and limitations within two minutes of reading.
- The Certification Library case study is useful without exposing protected content or implying server-side access control.
- Static audits, site validation, and certification browser smoke pass from a clean checkout.
- Desktop and 390px browser QA show no relevant console issue, clipping, overlap, missing asset, broken navigation, or horizontal page overflow.
- The exact deployed Pages commit passes a fresh production smoke.

## Self-review

- Placeholder scan: no unresolved placeholder, empty media slot, invented pilot, or open content decision remains.
- Consistency: homepage case-study routing and `/apps/` direct routing use separate fields without changing the existing `href` contract.
- Scope: this spec contains one deployable website workstream; video and non-synthetic evaluation work remain explicitly separate.
- Ambiguity: routes, page structure, version targets, privacy exclusions, fallback behavior, evidence labels, tests, and deployment gates are explicit.
