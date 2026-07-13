# Design QA — Split-profile online resume and two-collection catalog

- Source visual truth: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/source-option-3.png`
- Implementation screenshot: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-desktop-pass2.png`
- Full-view comparison evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/comparison-pass2.jpg`
- Apps catalog evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-two-groups-desktop.png`
- Mobile evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-mobile-390.png` and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-language-mobile-390.png`
- Viewport: 1440 × 1024 desktop; 390 × 844 mobile
- State: light theme for visual comparison; dark theme and mobile navigation tested separately

## Findings

- No remaining P0, P1, or P2 issues.
- Home matches the selected split-profile direction: fixed visual rail on desktop, senior-role summary, About statement, three-part work method, and two compact past-project rows.
- The requested Apps information architecture is explicit and scalable: `Technical` contains the three engineering projects and `Language` contains all twelve Japanese-learning tools.
- Fonts and typography: Space Grotesk, IBM Plex Mono, weights, compact mono labels, two-line statement, and hierarchy closely match the source.
- Spacing and layout rhythm: 350px profile rail, thin dividers, three-column method, and four-column project rows align with the source; mobile collapses without horizontal overflow.
- Colors and visual tokens: existing light/dark neutral surfaces, indigo primary accent, and orange secondary accent are preserved.
- Image quality and asset fidelity: the selected concept contains no photographic or raster content; Font Awesome supplies the closest matching interface icons.
- Copy and content: About, roles, working method, and project summaries use real portfolio content. The unsupported mock-only PDF action was intentionally omitted rather than linking a fake document.

## Interaction and implementation checks

- Home theme toggle changes light/dark state and updates its accessible label.
- Home mobile menu opens, closes with Escape, and retains the standardized navigation.
- Apps filters expose All, Technical, and Language; `Language` shows 12 apps and `Technical` shows 3 projects.
- Search inside Language with `kanji` returns 2 results and updates the URL/live result text.
- Legacy category URLs (`data`, `vocabulary`, `exam`, `grammar`, `reading`) map to the new Technical/Language model.
- Browser console errors: none.

## Comparison history

1. Pass 1: P2 density mismatch — the Language project row started below the 1024px viewport, while the selected source showed both project rows. Evidence: `audit/resume-v3/comparison-pass1.jpg`.
2. Fix: reduced About and method vertical spacing, tightened body type, and compacted project-row padding without changing content or hierarchy.
3. Pass 2: both Technical and Language project rows are visible in the target viewport; no actionable P0/P1/P2 differences remain. Evidence: `audit/resume-v3/comparison-pass2.jpg`.

## Focused comparison evidence

The 2880 × 1024 combined comparison keeps the profile rail, About typography, method columns, and both project rows readable at original resolution. Apps grouping and mobile behavior are separately captured, so no additional crop was required.

## Follow-up polish

- P3: a downloadable resume action can be added later when a real, maintained PDF exists.

final result: passed
