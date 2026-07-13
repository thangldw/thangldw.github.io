# Design QA — Unified navigation standard

- Source visual truth: `/Users/thang/Documents/thangldw.github.io/audit/nav-standard-v2/source-production.png`
- Implementation screenshot: `/Users/thang/Documents/thangldw.github.io/audit/nav-standard-v2/implementation-home.png`
- Full-view comparison evidence: `/Users/thang/Documents/thangldw.github.io/audit/nav-standard-v2/comparison-final.jpg`
- Mobile evidence: `/Users/thang/Documents/thangldw.github.io/audit/nav-standard-v2/implementation-home-mobile-menu-320.png`
- Viewport: 1440 × 1024 desktop; 320 × 780 mobile
- State: light theme; desktop header visible; mobile menu tested open and closed

## Findings

- No remaining P0, P1, or P2 visual issues.
- The page body, typography, spacing, palette, icons, imagery, and content remain unchanged from the v2.0.0 visual source.
- The only desktop visual difference is the requested navigation simplification: Demos, Collections, Notes, About, and Contact were removed; `Apps & Demo` replaces Contact; `EN / 日本語` sits immediately before the theme control.
- Home, Apps, Japanese, RAGOps, Data Copilot, and every sub-app using the shared header now expose the same navigation order.
- At 320px, Home retains its menu interaction and the shared sub-page header remains free of horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: unchanged from the v2.0.0 source; header labels retain Space Grotesk/Noto Sans JP sizing and weight.
- Spacing and layout rhythm: the 68px desktop header, 65px mobile header, page gutters, hero, spotlight, collections, and method band remain aligned with the source.
- Colors and visual tokens: unchanged light/dark tokens and indigo accent.
- Image quality and asset fidelity: no image assets were added, removed, rescaled, or recompressed.
- Copy and content: page content is unchanged; only the user-requested navigation labels were altered.

## Interaction and implementation checks

- Home mobile menu opens, reports `aria-expanded=true`, closes with Escape, and contains only `Apps & Demo` and `EN / 日本語`.
- Theme controls remain present after the language link on all tested headers.
- `Apps & Demo` is marked current on Apps routes; the Japanese page's language link returns to English Home.
- Tested routes: Home, Apps, Japanese Home, RAGOps, and Data Copilot at desktop and 320px.
- Console errors: none.

## Comparison history

1. The first and final comparison confirmed that the implementation differs from the source only where explicitly requested in the header.
2. No P0/P1/P2 correction loop was required.

## Focused comparison evidence

The header text, order, spacing, and theme control are readable at full resolution in the 2880 × 1024 combined comparison. Mobile menu visibility and fit are separately captured at 320 × 780, so no additional crop was required.

final result: passed
