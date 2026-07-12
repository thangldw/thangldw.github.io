**Design QA**

- Source visual truth: `/Users/thang/Downloads/design_handoff_portfolio/Home.dc.html` and `/Users/thang/Downloads/design_handoff_portfolio/Apps.dc.html`
- Implementation screenshot: `/Users/thang/Documents/thangldw.github.io/home-preview.png`
- Comparison evidence: `/Users/thang/Documents/thangldw.github.io/design-comparison.jpg`
- Viewport: desktop, 1440 × 1000; responsive CSS checked at 1024px and 680px breakpoints
- State: Home light theme; Apps light theme with Grammar filter active
- Primary interactions tested: Apps single-select filter, theme initialization, project links present, anchor navigation present
- Console errors: none

**Findings**

- No remaining P0/P1/P2 issues in the implemented scope.
- Fonts and typography: Space Grotesk, IBM Plex Mono and Noto Sans JP match the handoff; heading scale and mono labels follow the supplied values.
- Spacing and layout rhythm: 48px desktop gutters, bordered section rhythm, two-column featured grid and three-column app grid match the handoff; mobile collapses to one column.
- Colors and visual tokens: light/dark variables use the supplied indigo palette and dark inversion.
- Image quality and asset fidelity: the four featured cards use raster screenshots captured from the actual local project routes, cropped to the required 520:170 ratio.
- Copy and content: Home content and all 15 app entries preserve the handoff/current project wording.

**Focused comparison evidence**

Hero typography, process strip, featured card image ratio, Apps filters, app card typography, and footer/contact treatment were checked. No additional crop was needed because these surfaces are readable in the full-page evidence and the Apps interaction was separately inspected in-browser.

**Comparison history**

1. Initial implementation used stylized project panels. Replaced all four with real captured project screenshots and retained the handoff's 520:170 slot ratio.
2. Apps filtering was tested with `文法 · 4`; only the Grammar group remained visible and no console errors were reported.

**Follow-up Polish**

- P3: recapture featured screenshots after meaningful app visual updates to keep portfolio imagery fresh.

final result: passed
