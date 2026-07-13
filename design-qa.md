# Design QA — Apps readability aligned to the Home design system

- Original visual direction: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/source-option-3.png`
- User annotation truth: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/user-about-annotation.png`
- Home baseline: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-before.png`
- Home implementation: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-header-75-desktop.png`
- Home comparison: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-v302-comparison.jpg`
- Apps baseline: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-two-groups-desktop.png`
- Apps implementation: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-header-75-desktop.png`
- Apps comparison: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-copy-comparison.jpg`
- Header-width comparisons: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-header-75-comparison.jpg` and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-header-75-comparison.jpg`
- Reported sticky-header defect: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/user-header-overlap-bug.png`
- Sticky-header fix evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-header-inner-75-scrolled.png` and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/header-overlap-fix-comparison.jpg`
- Apps intro spacing evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-32-desktop.png`, `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-28-mobile.png`, and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-comparison.jpg`
- Compact Apps intro evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-16-desktop.png`, `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-20-mobile.png`, and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-hero-spacing-compact-comparison.jpg`
- Apps readability source truth: `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/00-user-small-type-report.png` and `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/01-home-reference.png`
- Apps readability implementation: `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/03-apps-after-all.png`, `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/04-apps-after-language.png`, `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/05-apps-after-compact-640.png`, `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/05-apps-menu-open-640.png`, and `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/05-apps-after-mobile-390.png`
- Full and focused comparisons: `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/06-readability-before-after.jpg`, `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/07-home-apps-system-comparison.jpg`, and `/Users/thang/Documents/thangldw.github.io/audit/apps-readability-v308/08-card-type-focused-comparison.jpg`
- Individual Language app readability evidence: `/Users/thang/Documents/thangldw.github.io/audit/language-apps-readability-v309/01-before-contact-sheet.jpg`, `/Users/thang/Documents/thangldw.github.io/audit/language-apps-readability-v309/02-after-contact-sheet.jpg`, and `/Users/thang/Documents/thangldw.github.io/audit/language-apps-readability-v309/03-before-after-comparison.jpg`
- Responsive evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-four-step-laptop-1024.png`, `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/home-header-75-mobile-390.png`, and `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/apps-header-75-mobile-390.png`
- Viewports: 1440 × 1024 desktop, 1024 × 900 laptop, 640 × 900 compact navigation, and 390 × 844 mobile
- State: light theme; Home default; Apps All, Technical, and Language filters

## Findings

- No remaining P0, P1, or P2 issues.
- Home remains the unchanged visual reference. The Apps page now carries the same type families, 16px base rhythm, neutral/indigo tokens, navigation behavior, and restrained borders.
- All 15 Apps cards use 19px titles, 15px descriptions, 14px CTAs, and 12px tags/status labels. Increased line-height and padding improve scanning without changing project copy or category structure.
- Apps mobile navigation now follows Home's Menu/Close pattern and supports `aria-expanded`, close-on-link, and Escape-to-close behavior.
- Home no longer exposes location information or duplicated profile tags. `Languages`, `Open to Opportunities`, and the relocated learner-first availability statement form a clearer sidebar hierarchy.
- About uses evidence from the earlier portfolio: 10+ years across statistical analysis, data engineering, and technical delivery; cross-sector experience; current front-line delivery leadership; and a clear learner/collaborator stance.
- `How I Work` now covers Embed, Build, Enable, and Measure/Improve. All four numbered titles render as single-line phrases at 1440px, 1024px, and 390px.
- Apps removes the unused search path and replaces catalog-first copy with a professional description of applied work, feedback, and collaboration. Technical and Language remain durable top-level filters.
- Apps intro padding is reduced from the original 54px to 16px on desktop and from 40px to 20px on mobile, giving the opening statement a compact visual relationship to the header without compressing the headline or filters.
- The RAGOps card now says `Open RAGOps` and points directly to `https://thangldw.github.io/ragops/`.
- Home and Apps sticky header backdrops now span the full 1440px viewport, while their inner content and footer content measure exactly 1080px (75%) and are centered at x=180px. Mobile inner content uses 358px in a 390px viewport to preserve usable navigation space.
- Each of the 12 individual Language apps now loads a shared, route-scoped readability layer. Visible app text no longer renders below 12px, dense reference grids use three readable desktop columns, and all routes remain free of mobile horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: Space Grotesk and IBM Plex Mono remain consistent. The revised headline retains the selected concept's two-line scale and accent treatment. All method titles avoid wrapping at tested breakpoints.
- Spacing and layout rhythm: Home uses four equal method columns on desktop, a 2×2 laptop grid, and a single mobile column. Apps gains a cleaner filter-only control row after search removal. Header/footer content follows the requested centered 75% desktop measure, while the sticky backdrop remains full-width so scrolled content cannot overlap the logo.
- Colors and visual tokens: the established neutral, indigo, and orange system is unchanged. Language bullets use one subtle indigo because they do not represent different semantic categories.
- Image quality and asset fidelity: no photographic assets are required; Font Awesome provides all interface icons. Social previews are real 1200 × 630 browser captures.
- Copy and content: new claims are grounded in prior portfolio copy. The tone emphasizes contribution, learning, team ownership, feedback, and collaboration without inventing outcomes or proficiency levels.

## Interaction and implementation checks

- Home: four method items; all titles one line; no location text; no horizontal overflow at 1440px, 1024px, or 390px.
- Apps: no search control; All shows 15, Technical shows 3, and Language shows 12; filter URL state and legacy category aliases remain supported.
- Apps card structure audit: all 15 cards include one title, description, tag group, CTA, accessible whole-card link, and status; the shared CSS applies the readability change across every row.
- RAGOps accessible link target: `https://thangldw.github.io/ragops/`.
- Computed Home and Apps desktop outer header widths: `1440px`; inner header/footer ratios: `0.75`; mobile inner widths: `358px` at a `390px` viewport.
- Browser console errors: none.
- Compact Apps interaction: Menu opens as a 608px panel in a 640px viewport, Escape closes it, document width remains 640px, Language exposes 12 cards and synchronized URL/ARIA state, and theme labels update in both directions.
- At 390px, document width remains 390px, cards measure 342px, and filters reflow to 167px / 167px / 342px so no label is clipped.
- Static validation covers 32 HTML pages, 10 redirects, 18 sitemap URLs, social metadata, and all local references.
- Twelve-route Language interaction pass: filters, tabs, answers, set selection, reading choices, and flashcard flipping all work without runtime exceptions. The stale Grammar Flashcard `flipBtn` binding was removed.

## Comparison history

1. Baseline: repeated location/role/language tags, generic headings, three-stage working method, catalog-first Apps copy, and an unnecessary search field.
2. Draft: introduced a profile snapshot, then removed it after recognizing that it repeated sidebar information.
3. Refinement: removed location, unified language markers, relocated the opportunity status, rewrote About from prior portfolio evidence, and combined each numbered method title into one line.
4. Final iteration: added `04_Measure & improve`, shortened method labels to hold a single line, rewrote Apps around practical work and collaboration, removed search and its query-state code, and corrected the RAGOps destination.
5. Post-fix evidence: desktop, laptop, and mobile browser captures show no overflow; filter counts, URL state, and console checks pass.
6. Width refinement: centered header/footer bands were reduced to 75% on Home and Apps. Computed dimensions, mobile overrides, visual comparisons, and console checks pass.
7. Production cache check: Apps loaded the new width immediately; Home initially retained the prior cached stylesheet. The Home stylesheet query was advanced to `20260714c` so GitHub Pages clients fetch the verified 75% rule.
8. Sticky-header correction: the user-reported scroll state revealed that narrowing the sticky element also narrowed its opaque backdrop. Home and Apps now keep a full-width sticky surface with a centered 75% inner container; the same scrolled state, 1440px desktop, and 390px mobile checks pass with zero overflow or console errors.
9. Apps rhythm refinement: the intro moves 22px closer to the header on desktop and 12px closer on mobile. Same-viewport comparison confirms the tighter hierarchy while preserving the existing grid, copy, filter row, and card layout.
10. Compact spacing iteration: following additional user feedback, desktop padding moves from 32px to 16px and mobile from 28px to 20px. The eyebrow retains visible separation from the header while the opening content now reads as part of the same page frame.
11. Readability audit: the user-provided card screenshot and the current 1440px implementation confirmed undersized descriptions, supporting labels, and CTAs. All 15 cards now use a larger shared type scale; focused before/after evidence shows the improvement, Language state preserves long bilingual titles, and the compact capture confirms the Home-style mobile menu and one-column card rhythm.
12. Individual-app audit: every canonical Language route was measured and captured at the same viewport. A shared readability layer removes sub-12px visible app text, reduces dense desktop grids to three columns, preserves 390px document width, and fixes the Grammar Flashcard runtime error discovered during interaction QA.

## Follow-up polish

- No P3 follow-up is required for the current scope.

final result: passed
