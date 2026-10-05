# Apps Viewport and Light Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fit the complete Apps catalog into one desktop viewport and set the homepage and Apps light-theme backgrounds to `#fbfcfe` without changing dark theme or mobile scrolling.

**Architecture:** Keep the existing semantic table and filtering JavaScript. Add desktop-only viewport layout rules that allocate the remaining height to nine catalog rows, retain the current mobile content flow, and add page-scoped light-theme canvas overrides.

**Tech Stack:** Static HTML, CSS custom properties, vanilla JavaScript, Node.js CDP smoke tests, Browser/IAB.

## Global Constraints

- `/apps/` must show all nine rows without page or internal vertical scrolling above `760px`.
- `/apps/` must preserve natural document scrolling at widths of `760px` or less.
- `/` and `/apps/` must use `#fbfcfe` only in light theme.
- Dark-theme backgrounds and all homepage content and interactions must remain unchanged.
- No new dependencies.

---

### Task 1: Light-theme page backgrounds

**Files:**
- Modify: `css/styles.css`
- Modify: `css/apps-catalog.css`
- Test: `scripts/smoke_cert.mjs`

**Interfaces:**
- Consumes: existing `data-theme` root attribute and `--bg` / `--catalog-bg` custom properties.
- Produces: light-theme computed background `rgb(251, 252, 254)` on `/` and `/apps/`; existing dark computed background remains `rgb(17, 19, 15)`.

- [ ] **Step 1: Write the failing rendered background assertions**

Add smoke checks that remove `theme`, navigate to `/` and `/apps/`, and require both `document.body` and the page wrapper background to equal `rgb(251, 252, 254)`. Set `theme=dark`, reload both pages, and require `rgb(17, 19, 15)`.

- [ ] **Step 2: Run the smoke test to verify RED**

Run: `node scripts/smoke_cert.mjs`

Expected: FAIL because the current light canvas is `rgb(251, 250, 246)`.

- [ ] **Step 3: Implement page-scoped light canvas overrides**

Add selectors equivalent to:

```css
:root:not([data-theme="dark"]) .home-v2 { --bg: #fbfcfe; }
:root:not([data-theme="dark"]) .portfolio-catalog { --catalog-bg: #fbfcfe; }
```

Do not change the shared dark palette.

- [ ] **Step 4: Run the smoke test to verify GREEN**

Run: `node scripts/smoke_cert.mjs`

Expected: PASS for both light and dark backgrounds.

- [ ] **Step 5: Commit**

```bash
git add css/styles.css css/apps-catalog.css scripts/smoke_cert.mjs
git commit -m "style: align light page backgrounds"
```

### Task 2: Desktop single-viewport Apps catalog

**Files:**
- Modify: `css/apps-catalog.css`
- Test: `scripts/smoke_cert.mjs`

**Interfaces:**
- Consumes: `.apps-main`, `#catalog`, `.project-library`, `.project-table`, and nine `.project-row` elements.
- Produces: a desktop layout with `scrollHeight <= innerHeight`; unchanged content-driven mobile layout.

- [ ] **Step 1: Extend the smoke viewport helper and add failing layout checks**

Change `CdpPage.navigate(url, width)` to `CdpPage.navigate(url, width, height = 900)` and pass `height` to `Emulation.setDeviceMetricsOverride`. Add a loop over `[1280, 720]`, `[1440, 900]`, and `[1440, 1000]` requiring:

```js
document.documentElement.scrollHeight <= window.innerHeight
  && document.documentElement.scrollWidth <= window.innerWidth
  && document.querySelectorAll('.project-row:not([hidden])').length === 9
```

At `390x844`, require `scrollHeight > innerHeight`, no horizontal overflow, and visible descriptions.

- [ ] **Step 2: Run the smoke test to verify RED**

Run: `node scripts/smoke_cert.mjs`

Expected: FAIL at the desktop viewport-height assertion.

- [ ] **Step 3: Implement desktop viewport allocation**

For `min-width: 761px`, make `.apps-main` a `100dvh` grid, make `#catalog` and the library chain shrinkable, compact the hero and toolbar, and make `tbody` distribute the available height across nine rows. Remove desktop row minimum heights, clamp descriptions to one line, and hide tag chips only in the intermediate-width desktop layout. Keep the existing `max-width:760px` rules authoritative for mobile.

- [ ] **Step 4: Run targeted and full site checks**

Run:

```bash
python3 scripts/validate_site.py
node scripts/smoke_cert.mjs
```

Expected: 39 HTML pages validated and all smoke checks pass.

- [ ] **Step 5: Commit**

```bash
git add css/apps-catalog.css scripts/smoke_cert.mjs
git commit -m "style: fit apps catalog to desktop viewport"
```

### Task 3: Browser QA and release

**Files:**
- Verify: `index.html`
- Verify: `apps/index.html`
- Verify: `css/styles.css`
- Verify: `css/apps-catalog.css`

**Interfaces:**
- Consumes: committed static site output.
- Produces: deployed GitHub Pages revision with production evidence.

- [ ] **Step 1: Run Browser/IAB QA locally**

Verify page identity, meaningful DOM, no framework overlay, clean console, search interaction, and screenshots at `1280x720`, `1440x900`, `1440x1000`, and `390x844`.

- [ ] **Step 2: Verify the final diff**

Run:

```bash
git diff --check
git status --short
python3 scripts/validate_site.py
node scripts/smoke_cert.mjs
```

- [ ] **Step 3: Fast-forward `master` and push**

Fetch `origin`, confirm `origin/master` is still the feature branch base, fast-forward local `master`, rerun the full site gate, and push `master`.

- [ ] **Step 4: Wait for Pages and verify production**

Require the Pages build for the pushed commit to complete successfully. Re-run the desktop/mobile layout, background, search, and console checks against `https://thangldw.github.io/` and `https://thangldw.github.io/apps/`.
