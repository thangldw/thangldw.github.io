# Responsive audit

## Scope

Home, Apps, Data Copilot, Pipeline, Goi Tabs, Mondai 3, Kanji Collocations, plus shared styles used by all app pages.

## Breakpoints checked

- Mobile: 390 × 844
- Tablet: 768 × 900
- Small desktop: 1024 × 900
- Desktop: 1280px content width

## Findings and fixes

1. Pipeline intro used `white-space: nowrap` too early and expanded the 1280px page to 1357px. The copy now wraps below 1400px.
2. Home biography had the same issue at 1280px. It now wraps below 1400px.
3. Data Copilot and the Apps intro now use the same 1400px wrapping threshold.
4. Shared app styles now constrain images, video, canvas, SVG, form controls, and long text to their containers.
5. Mondai 3 uses explicit 4/3/2/1 responsive columns.
6. Goi Tabs uses horizontally scrollable primary tabs at narrow widths while cards remain a readable single column.
7. Shared headers use 75px desktop and 65px mobile heights with 48px and 24px gutters respectively.

## Verification

- Home, Apps, Data Copilot, Goi Tabs, Mondai 3 and Kanji Collocations: no document-level horizontal overflow at 390, 768, or 1024px in the representative audit run.
- Pipeline: corrected from 1357px to 1280px at the 1280px viewport.
- No console errors observed on final Home and Pipeline checks.

## Evidence limits

Responsive screenshots confirm visible reflow and overflow behavior. Native select menus, every quiz state, browser zoom above 200%, and every virtual keyboard configuration need separate device-level testing.
