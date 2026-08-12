# Japan HSP Calculator Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a tested, responsive, calculator-first renewal of the Japan HSP and permanent-residence planning app.

**Architecture:** Preserve static GitHub Pages. Move pure HSP arithmetic and route classification into a UMD-style `scoring.js` consumed by the browser and Node tests; keep DOM/translation/diagnosis/evidence behavior in `app.js`; implement the accepted visual target through existing HTML and CSS.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node built-in test runner, in-app Browser, GitHub Pages.

## Global Constraints

- Keep English/Vietnamese bilingual copy and all existing HSP, J-Skip, PR diagnosis, evidence, and official-source functionality.
- Show `Rules checked · April 2026`; do not misrepresent the 1 April 2023 point table as a 2026 scoring change.
- Use the accepted desktop, mobile, and expanded-bonus concepts as visual truth.
- No new framework, backend, analytics surface, or user-data upload.
- Release only after tests, Browser QA, design QA, PR merge, deployment, and production verification.

---

### Task 1: Pure scoring contract

**Files:**
- Create: `apps/japan-pr-guide/scoring.js`
- Create: `apps/japan-pr-guide/tests/scoring.test.js`
- Modify: `apps/japan-pr-guide/index.html`
- Modify: `apps/japan-pr-guide/app.js`

**Interfaces:**
- Produces: `HSPScoring.incomePoints(activity, incomeMillions, age)`, `agePoints(activity, age)`, `researchPoints(activity, count)`, `specialAdditionPoints(input)`, `calculateScore(input)`, and `classifyScore(score, activity, incomeMillions)`.
- Consumes: plain scoring input object from the existing form state.

- [ ] **Step 1: Write failing Node tests** for every activity's core ranges, age-dependent remuneration, research caps, N1/N2 overlap, innovation dependency, JICA/Japanese-university overlap warning, the 3-million-yen hard stop, and route bands below 70, 70-79, and 80+.
- [ ] **Step 2: Run `node --test apps/japan-pr-guide/tests/scoring.test.js`** and confirm failure because `scoring.js` is missing.
- [ ] **Step 3: Implement the minimum pure scoring module** with browser-global and CommonJS exports.
- [ ] **Step 4: Run the scoring tests** and confirm zero failures.
- [ ] **Step 5: Load `scoring.js` before `app.js` and replace duplicated arithmetic in `calculate()`** with the tested module.
- [ ] **Step 6: Run the scoring tests again and commit** with message `test: lock HSP scoring contract`.

### Task 2: Calculator-first structure and source freshness

**Files:**
- Modify: `apps/japan-pr-guide/index.html`
- Modify: `apps/japan-pr-guide/app.js`
- Modify: `apps/japan-pr-guide/redesign.css`
- Add: `apps/japan-pr-guide/assets/hsp-mark.png`
- Test: `apps/japan-pr-guide/tests/scoring.test.js`

**Interfaces:**
- Consumes: `HSPScoring.calculateScore()` result.
- Produces: existing DOM IDs plus `#appHeader`, `#scoreSummary`, `#scoreRoute`, `#bonusDisclosure`, and grouped bonus sections.

- [ ] **Step 1: Add failing structural assertions** that load `index.html` as text and require the header freshness copy, brand asset, bonus disclosure, privacy copy, directly labeled 70/80 text, and scoring script order.
- [ ] **Step 2: Run `node --test apps/japan-pr-guide/tests/*.test.js`** and confirm the new assertions fail.
- [ ] **Step 3: Implement the accepted HTML structure** while preserving all existing IDs required by `app.js`.
- [ ] **Step 4: Update bilingual copy and primary-source metadata** for February-April 2026 freshness without changing the legal scoring table date.
- [ ] **Step 5: Implement desktop and expanded-bonus CSS** from the accepted concept, using Be Vietnam Pro and Remix Icon.
- [ ] **Step 6: Run all Node tests** and confirm zero failures.

### Task 3: Responsive and interaction behavior

**Files:**
- Modify: `apps/japan-pr-guide/app.js`
- Modify: `apps/japan-pr-guide/redesign.css`
- Test: `apps/japan-pr-guide/tests/scoring.test.js`

**Interfaces:**
- Consumes: existing activity, form, diagnosis, and document state.
- Produces: mobile-first result order, accessible bonus disclosure, current score/route text, and unchanged local evidence persistence.

- [ ] **Step 1: Add failing tests** for classification text/state and all warning arrays returned by the pure module.
- [ ] **Step 2: Run tests and confirm the expected failures.**
- [ ] **Step 3: Wire score status, route summary, breakdown, warnings, and mobile score to the pure result.**
- [ ] **Step 4: Implement 390px responsive CSS** with result-first ordering, 44px controls, 16px inputs, scroll-safe activity choices, and no horizontal overflow.
- [ ] **Step 5: Add reduced-motion behavior and verify focus-visible styling.**
- [ ] **Step 6: Run all Node tests** and commit with message `feat: renew Japan HSP calculator experience`.

### Task 4: Browser and design QA

**Files:**
- Create: `design-qa.md`
- Do not commit temporary screenshots.

**Interfaces:**
- Consumes: local HTTP preview and accepted concept images.
- Produces: browser-rendered screenshots, mismatch ledger, and `design-qa.md` with `final result: passed`.

- [ ] **Step 1: Start a local static server** from the repository root and open `/apps/japan-pr-guide/` in the in-app Browser.
- [ ] **Step 2: Verify page identity, meaningful DOM, no overlay, and zero relevant console errors/warnings.**
- [ ] **Step 3: Exercise activity selection, populated core values, bonus open/selection, score/route update, PR CTA, diagnosis, evidence checkbox persistence, and reset.**
- [ ] **Step 4: Capture desktop 1440 x 1024 and mobile 390 x 844 screenshots at matching concept states.**
- [ ] **Step 5: Put source and implementation images into same-image comparisons; inspect typography, spacing, tokens, icons/assets, copy, controls, and responsive behavior.**
- [ ] **Step 6: Fix all P0/P1/P2 findings and repeat capture/comparison until `design-qa.md` says `final result: passed`.**
- [ ] **Step 7: Run `node --test apps/japan-pr-guide/tests/*.test.js`, HTML/script syntax checks, link checks, and `git diff --check`.**

### Task 5: GitHub Pages release

**Files:**
- Modify only if required by deployment evidence: release metadata in the changed app files.

**Interfaces:**
- Consumes: verified branch head.
- Produces: merged `master`, deployed GitHub Pages URL, and production Browser evidence.

- [ ] **Step 1: Review `git diff`, confirm no temporary QA artifacts, and commit the final QA report/fixes.**
- [ ] **Step 2: Push `codex/japan-pr-guide-renewal-20260812`, create a PR, and wait for checks.**
- [ ] **Step 3: Refresh exact PR head/checks; merge only when clean.**
- [ ] **Step 4: Wait for GitHub Pages deployment of the merged commit.**
- [ ] **Step 5: Open the production URL in the in-app Browser, verify the released commit's UI copy and primary score interaction, and check console health.**
- [ ] **Step 6: Record release URL, merged commit, deployment result, source freshness, tests, and remaining limitations.**

## Self-review

- Spec coverage: calculator, legal-source freshness, pure scoring, responsive interaction, evidence workflow, Browser QA, design QA, and release are mapped to tasks.
- Placeholder scan: no placeholder implementation steps remain.
- Interface consistency: every browser consumer uses the `HSPScoring` module defined in Task 1; all later checks target the same existing app route.
