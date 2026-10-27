# Design QA — Japan PR Guide historical recalculation workflow

## Evidence

- Approved source: `references/approved-historical-recalculation.png` — 1488 × 1058 px.
- Additional approved references: `references/approved-desktop.png`, `references/approved-score-form.png`, and `references/approved-mobile.png`.
- Product-flow specification: `docs/japan-pr-guide-flow.html`.
- Compared state: Step 3 active, Specialized / technical activity, 75 points today, 70 points on 18 Aug 2023, 3 of 5 active claims documented.

## Visible comparison

1. Header, five-step workflow, summary hierarchy, route selector, historical explanation, comparison table, checklist rail, and vermilion actions match the approved composition.
2. The implementation preserves the approved current-date teal and historical-date blue column grouping, compact rules, Inter typography, low-radius controls, and flat white surfaces.
3. The current and historical totals retain one score per reference date. Proof appears only as claim coverage and status.
4. The implementation intentionally keeps all applicable MOJ scoring rows visible. Active and zero-point categories can be inspected without opening a disclosure.
5. Every row exposes the criterion, Vietnamese helper, selected value, maximum, awarded points, proof requirement, historical value, historical points, and dependency note.
6. The Innovative Asia category uses searchable official-list selection and displays the chosen university with source metadata.
7. At 390 px, the page itself has no horizontal overflow. The five-step rail and historical table use contained horizontal scrolling rather than hiding content.

## Interaction verification

- Default technical scenario computes 75 points today and 70 points at the three-year checkpoint.
- Selecting a ¥10M remuneration band moves the route to the one-year checkpoint on 18 Aug 2025 with an 80+ requirement.
- Innovative Asia search returns Hanoi University of Science and Technology and keeps the university-category award at 10 points.
- Review claims advances to historical verification; historical verification advances to PR requirements; PR requirements advance to the application plan.
- Checking good conduct updates the PR progress to 1 of 6 confirmed.
- The header contains Official sources only; there is no language toggle or Save plan action.
- State is intentionally session-only and is not persisted.
- Browser console contained no errors or warnings.

## Automated verification

- `npm test`: 37 tests passed.
- `npm run build`: production build passed.
- `npm run test:sites`: 4 packaging tests passed.
- Diagram self-check: passed.

## Intentional deviations

- The approved mock shows only five active claims in the comparison table. The implementation shows all applicable categories because the user explicitly requested clear visibility of every scoring item.
- Mobile is a responsive interpretation because no mobile source was provided.
- Historical values are editable controls rather than static display values so users can independently reconstruct the reference-date score.

## Severity gate

- P0 blockers: none.
- P1 functional or responsive defects: none.
- P2 visible fidelity defects: none remaining after paired comparison.

final result: passed
