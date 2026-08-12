# Japan HSP Score Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global floating score dock with a calculator-bounded responsive score spine and static score context in downstream workflows.

**Architecture:** Preserve one score state from `HSPScoring.calculateScore()`. Render it into a compact calculator score component and three static downstream context rows; use responsive CSS to present the component as a desktop right rail or a mobile/tablet sticky ribbon. Remove the page-global observer and use normal sticky containment plus explicit disclosure anchoring.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node built-in test runner, in-app Browser, GitHub Pages.

## Global Constraints

- The compact score presentation is sticky only inside `#calculator`; no score UI may be `position: fixed`.
- Desktop breakpoint is `1024px`; the desktop score spine has no internal vertical scrolling.
- Tablet/mobile score ribbon is at most `64px` high and appears after activity selection.
- Visa, PR diagnosis, and Documents receive static score context; Sources does not.
- `Edit score` targets `#coreFactors` and has a minimum 44px target.
- Use one consolidated `role="status" aria-live="polite" aria-atomic="true"` score announcement.
- Preserve scoring logic, bilingual content, PR diagnosis, document persistence, official sources, static hosting, and the existing design system.
- No framework, dependency, backend, new route, internal score scroll container, or page-global score overlay.

---

### Task 1: Score information architecture and state fan-out

**Files:**
- Modify: `apps/japan-pr-guide/index.html`
- Modify: `apps/japan-pr-guide/app.js`
- Modify: `apps/japan-pr-guide/tests/structure.test.js`

**Interfaces:**
- Consumes: the existing `scoringResult` returned by `HSPScoring.calculateScore()`.
- Produces: `#scoreSpine`, `#scoreSpineStatus`, `#scoreDetails`, `#coreFactors`, three `.workflow-score-context-row` elements, and `updateScoreContexts(scoringResult)`.

- [ ] **Step 1: Replace the obsolete structure contract with failing score-spine assertions**

```js
test('score is bounded to the calculator and reused as static workflow context', () => {
  assert.match(html, /id="scoreSpine"/);
  assert.match(html, /id="scoreSpineStatus"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.match(html, /id="scoreDetails"/);
  assert.match(html, /id="coreFactors"/);
  assert.equal((html.match(/class="workflow-score-context-row"/g) || []).length, 3);
  assert.equal((html.match(/href="#coreFactors"/g) || []).length, 3);
  assert.doesNotMatch(html, /id="scoreDock"/);
  assert.doesNotMatch(app, /new IntersectionObserver/);
  assert.match(app, /function updateScoreContexts\(scoringResult\)/);
});
```

- [ ] **Step 2: Run the focused structure test and verify RED**

Run: `node --test apps/japan-pr-guide/tests/structure.test.js`

Expected: FAIL because `#scoreSpine`, contexts, and `updateScoreContexts` do not exist and `#scoreDock` still exists.

- [ ] **Step 3: Restructure the score DOM without changing existing calculation IDs**

Use this component boundary in `index.html`:

```html
<aside id="scoreSummary" class="score-card">
  <div id="scoreSpine" class="score-spine">
    <!-- Keep #score, #scoreQualification, #meter, threshold labels, and #scoreRoute here. -->
    <p id="scoreSpineStatus" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>
</aside>
```

Move `#scoreStatus`, `#hardStops`, evidence progress, point breakdown, PR CTA, privacy, trust text, and copy action after `#pointsForm` into:

```html
<section id="scoreDetails" class="score-details-panel" aria-label="Detailed score result">
  <!-- Existing detailed-result controls, preserving their IDs. -->
</section>
```

Set `id="coreFactors"` on the existing core-factor section. Remove `#scoreDock` entirely. Increment `app.js` and `redesign.css` cache keys to `v=20260813a`.

- [ ] **Step 4: Add static context rows after the Visa, Diagnosis, and Documents summaries**

Use the same markup exactly three times:

```html
<div class="workflow-score-context-row">
  <span data-score-context>Calculated HSP: 0 · Below 70 / Điểm HSP: 0 · Dưới 70</span>
  <a href="#coreFactors">Edit score / Sửa điểm</a>
</div>
```

Do not add the row to `#sources`.

- [ ] **Step 5: Fan out one calculated state to the compact and static presentations**

Add this function in `app.js` and call it once per `calculate()` after `currentScore` and classification are assigned:

```js
function updateScoreContexts(scoringResult){
  const score=scoringResult.score;
  const route=scoringResult.hardStops.length
    ?"Review eligibility / Kiểm tra điều kiện"
    :scoringResult.route==="hsp80"
      ?"Potential 1-year PR route / Có thể theo lộ trình PR 1 năm"
      :scoringResult.route==="hsp70"
        ?"Potential 3-year PR route / Có thể theo lộ trình PR 3 năm"
        :`${Math.max(0,70-score)} points to 70 / còn ${Math.max(0,70-score)} điểm`;
  $("#scoreSpineStatus").textContent=`${score} points. ${route}`;
  $$('[data-score-context]').forEach(element=>{
    element.textContent=`Calculated HSP: ${score} · ${route}`;
  });
}
```

Remove the old `scoreDockValue`, `scoreDockStatus`, and `IntersectionObserver` code.

- [ ] **Step 6: Run structure and scoring tests and verify GREEN**

Run: `node --test apps/japan-pr-guide/tests/*.test.js`

Expected: all tests pass.

- [ ] **Step 7: Commit Task 1**

```bash
git add apps/japan-pr-guide/index.html apps/japan-pr-guide/app.js apps/japan-pr-guide/tests/structure.test.js
git commit -m "refactor: unify HSP score presentation"
```

### Task 2: Responsive score spine and bounded scroll behavior

**Files:**
- Modify: `apps/japan-pr-guide/redesign.css`
- Modify: `apps/japan-pr-guide/app.js`
- Modify: `apps/japan-pr-guide/tests/structure.test.js`

**Interfaces:**
- Consumes: the Task 1 DOM IDs and context rows.
- Produces: desktop score spine at `min-width: 1024px`, mobile/tablet score ribbon below that breakpoint, and `alignDisclosure(disclosure)`.

- [ ] **Step 1: Add failing CSS and disclosure-anchor assertions**

```js
test('score spine uses bounded responsive sticky layouts without fixed overlays', () => {
  assert.match(css, /@media\s*\(min-width:\s*1024px\)[\s\S]*?\.score-spine\s*\{[^}]*position:\s*sticky[^}]*top:\s*80px/s);
  assert.match(css, /@media\s*\(max-width:\s*1023px\)[\s\S]*?\.score-spine\s*\{[^}]*position:\s*sticky[^}]*max-height:\s*64px/s);
  assert.doesNotMatch(css, /\.score-(?:dock|spine)\s*\{[^}]*position:\s*fixed/s);
  assert.doesNotMatch(css, /\.score-spine\s*\{[^}]*overflow(?:-y)?:\s*(?:auto|scroll)/s);
  assert.match(css, /#coreFactors\s*\{[^}]*scroll-margin-top:/s);
  assert.match(app, /function alignDisclosure\(disclosure\)/);
});
```

- [ ] **Step 2: Run the focused structure test and verify RED**

Run: `node --test apps/japan-pr-guide/tests/structure.test.js`

Expected: FAIL because the old fixed-dock CSS remains and bounded responsive rules do not exist.

- [ ] **Step 3: Implement the desktop score spine**

At `min-width: 1024px`, keep the calculator grid and apply:

```css
.score-card { align-self: stretch; }
.score-spine {
  position: sticky;
  top: 80px;
  display: grid;
  gap: 14px;
  max-height: calc(100dvh - 96px);
  padding: 28px 30px;
}
```

Do not set `overflow`, `overflow-y`, or a fixed height. Keep only score, qualification, meter, thresholds, and route visible in the spine. Style `.score-details-panel` as normal-flow content beneath the form in the left column.

- [ ] **Step 4: Implement the tablet/mobile score ribbon**

At `max-width: 1023px`:

```css
.calculator-layout { display: flex; flex-direction: column; }
.calculator-head { order: 0; }
.activity-tabs { order: 1; }
.caution { order: 2; }
.score-card { order: 3; }
.points-form { order: 4; }
.score-details-panel { order: 5; }
.score-spine {
  position: sticky;
  top: 72px;
  z-index: 45;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  max-height: 64px;
  min-height: 56px;
}
```

Hide desktop-only meter and threshold cards inside the ribbon, keep `#score` and one route/state line visible, and add enough `scroll-margin-top` to calculator fields so focused controls are not obscured.

- [ ] **Step 5: Keep context rows visible and anchor disclosures below the app header**

Change the closed-disclosure selector so `.workflow-score-context-row` remains visible:

```css
.workspace-disclosure:not([open]) > :not(summary):not(.workflow-score-context-row) { display: none; }
.workflow-score-context-row { display: flex; min-height: 44px; align-items: center; justify-content: space-between; }
#coreFactors, .workspace-disclosure { scroll-margin-top: 84px; }
```

Replace the current toggle handler with:

```js
function alignDisclosure(disclosure){
  const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  requestAnimationFrame(()=>disclosure.scrollIntoView({block:'start',behavior}));
}

$$('.workspace-disclosure').forEach(disclosure=>disclosure.addEventListener('toggle',()=>{
  if(!disclosure.open)return;
  $$('.workspace-disclosure').forEach(other=>{if(other!==disclosure)other.open=false});
  alignDisclosure(disclosure);
}));
```

For links that open a disclosure, call `alignDisclosure(target)` only after it is open. Do not move keyboard focus automatically.

- [ ] **Step 6: Remove obsolete dock styles and conflicting mobile score ordering**

Delete all `.score-dock` selectors and the mobile `.score-card { order: -1; }` rule. Ensure the support trigger retains its existing 44px bottom-right placement and no score element occupies that band.

- [ ] **Step 7: Run all tests and syntax checks and verify GREEN**

Run:

```bash
node --test apps/japan-pr-guide/tests/*.test.js
node --check apps/japan-pr-guide/app.js
node --check apps/japan-pr-guide/scoring.js
git diff --check
```

Expected: zero failures and zero syntax/diff errors.

- [ ] **Step 8: Commit Task 2**

```bash
git add apps/japan-pr-guide/app.js apps/japan-pr-guide/redesign.css apps/japan-pr-guide/tests/structure.test.js
git commit -m "fix: bound live score to calculator workflow"
```

### Task 3: Browser QA, correction loop, and release readiness

**Files:**
- Modify if QA finds a defect: `apps/japan-pr-guide/index.html`
- Modify if QA finds a defect: `apps/japan-pr-guide/app.js`
- Modify if QA finds a defect: `apps/japan-pr-guide/redesign.css`
- Modify if QA finds a defect: `apps/japan-pr-guide/tests/structure.test.js`

**Interfaces:**
- Consumes: the completed responsive score spine.
- Produces: validated local behavior at four target viewports and a release-ready branch.

- [ ] **Step 1: Run the full automated gate from a clean branch state**

```bash
node --test apps/japan-pr-guide/tests/*.test.js
node --check apps/japan-pr-guide/app.js
node --check apps/japan-pr-guide/scoring.js
git diff --check
```

Expected: all tests pass; all checks exit zero.

- [ ] **Step 2: Verify desktop at 1440x900 and 1024x768 in the in-app Browser**

For each viewport, verify:

- page identity and meaningful DOM;
- score spine remains coherent while degree, experience, age, income, and bonuses change;
- score spine has no internal vertical overflow;
- no duplicate/fixed score surface exists;
- scrolling beyond `#calculator` removes the sticky score presentation;
- Visa, PR, and Documents display updated static context;
- `Edit score` lands at `#coreFactors` below the header;
- no relevant console warning/error or page-level horizontal overflow.

- [ ] **Step 3: Verify tablet/mobile at 760x800 and 390x844 in the in-app Browser**

For each viewport, verify:

- activity selection precedes the compact score ribbon;
- ribbon height is between 56px and 64px;
- ribbon stays visible while calculator inputs scroll;
- ribbon stops at the calculator boundary and never overlays lower workflows;
- support action does not overlap the ribbon;
- focused inputs and 44px targets are unobscured;
- no relevant console warning/error, nested vertical scroll, or page-level horizontal overflow.

- [ ] **Step 4: Exercise disclosure anchoring and state updates**

Open Visa, then PR, then Documents. Confirm one disclosure remains open, each new heading aligns below the app header, current score context remains static, and changing the calculator score updates all three context rows.

- [ ] **Step 5: Fix each observed P0/P1/P2 defect with a failing regression assertion first**

For every defect, add the smallest structural assertion to `structure.test.js`, run it to observe RED, apply the minimal HTML/CSS/JS correction, and rerun the full gate to GREEN.

- [ ] **Step 6: Commit QA corrections if any**

```bash
git add apps/japan-pr-guide/index.html apps/japan-pr-guide/app.js apps/japan-pr-guide/redesign.css apps/japan-pr-guide/tests/structure.test.js
git commit -m "test: harden HSP score spine interactions"
```

If no correction is required, do not create an empty commit.

## Self-review

- Spec coverage: calculator boundary, desktop spine, mobile ribbon, static contexts, edit destination, disclosure anchoring, accessibility, four viewports, and release gates are each mapped to a task.
- Placeholder scan: no deferred implementation wording or unspecified error handling remains.
- Interface consistency: Task 1 creates every ID/class/function consumed by Task 2; Task 3 validates those same surfaces.
- Scope: three sequential tasks operate on one bounded UI subsystem and preserve the scoring engine and downstream business logic.
