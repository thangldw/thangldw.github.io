# Japan PR Guide route-specific historical recalculation contract

## Approved reference

- Primary desktop: `references/approved-historical-recalculation.png` (1488 x 1058 raster; 1440 x 1024 CSS target).
- The calculator-first screen remains the required entry step, but this reference supersedes the prior result, requirements, and evidence layouts.
- Product flow: `docs/japan-pr-guide-flow.html`.

## Locked product flow

1. Calculate HSP score.
2. Review score claims and proof coverage.
3. Recalculate the score at the route-specific historical checkpoint.
4. Confirm PR requirements.
5. Prepare the application plan and evidence checklist.

## Locked scoring meaning

- The app shows one official estimated score per reference date. It never derives an evidence-backed score.
- Proof is coverage only: documented claim count over active point claims.
- The HSP total is uncapped; 100 is a route-comparison reference, not a calculation ceiling.
- A current 70-79 result selects the potential three-year route and recalculates at 18 August 2023 with a 70-point threshold.
- A current 80+ result selects the potential one-year route and recalculates at 18 August 2025 with an 80-point threshold.
- Historical age, experience, remuneration, qualifications, and additions are independently editable and scored through the same MOJ engine.
- Every applicable scoring item is always visible in a table with criterion, selected value, maximum points, current points, historical value, historical points, proof, and overlap/dependency notes.
- Innovative Asia university eligibility is selected through search over the official partner list; search by English name, Japanese name, or country.
- University-category additions are capped at 10 points.
- The multiple-degree addition requires an eligible advanced degree in more than one field.
- JICA training adds 5 points alongside Japanese-university graduation only when the training did not use Japanese university or graduate-school classes. Otherwise, the overlap removes the JICA addition.

## Locked desktop composition

- Compact brand header with Official sources and a five-step horizontal progress rail. No language toggle or Save plan action.
- Summary row: title, current score, selected route, required checkpoint, proof coverage.
- Route selector and reference-date explanation.
- Wide current-versus-historical scoring table with a narrow route checklist rail.
- MOJ source strip and guidance-only footer.

## Visual system

- True white background `#ffffff`.
- Ink `#0c1d40`; muted text `#667085`; cool rule `#d8dee8`.
- Verified teal `#006b62`; current-date teal header `#006c62`.
- Historical blue `#0b56b3`; warning amber `#d96800`; CTA vermilion `#d92d0b`.
- Inter Variable; readable 14-16px product text; 22-28px page title.
- Functional radii 6-8px; almost no shadow; no gradients, glass, or nested card grids.
- Phosphor icons, regular or bold variants, 16-22px.

## Ownership and persistence

- `src/domain/scoring.js`: MOJ score math and itemized point breakdown.
- `src/domain/historical.js`: route checkpoint, reference date, and historical factor defaults.
- React: workflow step, activity, current and historical factors, proof coverage, PR confirmations, and application checklist.
- State is session-only React state. No `localStorage`, URL state, or remote persistence.

## Responsive contract

- Desktop retains the comparison table and sticky route rail.
- Mobile converts the table into aligned current/historical claim rows without hiding any scoring category.
- 44px minimum interactive targets, no hover-only evidence, no horizontal page overflow.
- Reduced motion removes smooth scrolling and nonessential transitions.
