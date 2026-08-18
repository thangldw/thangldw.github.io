# Restore HSP Scoring Parity Implementation Plan

> Historical implementation record. The current product contract is `DESIGN_CONTRACT.md`; Save plan and local persistence were removed on 19 August 2026.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the approved calculator-first React UI while restoring the activity-specific HSP scoring behavior and regression coverage from the pre-redesign calculator.

**Architecture:** Move all legal point rules into a pure `src/domain/scoring.js` module whose input matches the former engine. Keep React responsible only for input state and rendering. Activity-specific form configuration supplies raw ages and remuneration bands, while the engine computes points, eligibility gates, warnings, and threshold progress.

**Tech Stack:** React 19, Vite 6, Vitest 4, Testing Library.

**Spec:** User request in this task plus MOJ Points Calculation Table `https://www.moj.go.jp/isa/content/001398882.pdf`.

## Global Constraints

- Preserve the approved calculator-first composition and responsive visual hierarchy.
- Do not derive legal results by summing UI option values.
- Support HSP activities 1号イ, 1号ロ, and 1号ハ with activity-specific tables.
- Preserve the old engine's dependency, overlap, hard-stop, research-cap, and threshold behavior.
- Use cautious route wording: points establish a potential assessment route, not PR eligibility.
- Write and observe failing tests before production edits.

---

### Task 1: Pure scoring engine and MOJ parity suite

**Files:**
- Create: `src/domain/scoring.test.js`
- Create: `src/domain/scoring.js`

**Interfaces:**
- Consumes: `calculateScore(input)`, where `input` contains activity code, degree points, career points, raw age, raw annual remuneration in millions of yen, and bonus claims.
- Produces: `{score, parts, warnings, eligible, route, hardStops}` plus `incomePoints`, `agePoints`, `researchPoints`, `specialAdditionPoints`, `classifyScore`, and `nextThresholdProgress`.

- [x] **Step 1: Write the failing parity tests**

Port all 15 historical domain cases and add explicit academic 85-point and management 60-point fixtures that match the current MOJ table.

- [x] **Step 2: Run the tests to verify RED**

Run: `npm test -- src/domain/scoring.test.js`
Expected: FAIL because `src/domain/scoring.js` does not exist.

- [x] **Step 3: Implement the pure engine**

Port the former activity-specific salary matrix, age points, research caps, bonus dependencies, minimum salary gate, and route classification as named ES module exports.

- [x] **Step 4: Run the parity suite to verify GREEN**

Run: `npm test -- src/domain/scoring.test.js`
Expected: all parity fixtures pass.

### Task 2: React form integration

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/ScoreCalculator.jsx`
- Modify: `src/styles.css`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `calculateScore(factors)` and activity-specific factor definitions.
- Produces: activity-aware selects, computed per-row points, visible hard stops/warnings, and potential-route messaging.

- [x] **Step 1: Write failing interaction tests**

Cover initial 65-point scenario, income recalculation to 85, business-management form switching, the former business false-positive case returning 60, minimum-remuneration hard stop, and saved classification.

- [x] **Step 2: Run the interaction tests to verify RED**

Run: `npm test -- src/App.test.jsx`
Expected: failures on activity-specific fields and official score expectations.

- [x] **Step 3: Integrate the engine and activity configurations**

Replace direct summation with `calculateScore`, render activity-specific fields, expose historical bonus inputs behind the existing disclosure, and update inspector wording without changing the approved layout.

- [x] **Step 4: Run all tests to verify GREEN**

Run: `npm test`
Expected: domain and interaction suites pass.

### Task 3: Build and rendered QA

**Files:**
- Verify only: generated `dist/client/*`

**Interfaces:**
- Consumes: integrated React application.
- Produces: verified static build for `/apps/japan-pr-guide/`.

- [x] **Step 1: Run packaging gates**

Run: `npm run test:sites && npm run build`
Expected: both commands exit 0.

- [x] **Step 2: Exercise the target flow in Browser**

Flow: academic default 65 -> remuneration ¥10M+ -> 85/potential one-year route -> switch to business -> age removed and position added -> reproduce former 80-point false-positive as 60/no route.

- [x] **Step 3: Verify rendered health**

Check page identity, nonblank DOM, no framework overlay, no console errors/warnings, desktop screenshot, and one mobile viewport.

- [x] **Step 4: Record the handoff state**

Report changed files, test counts, browser evidence, and whether deployment remains pending.
