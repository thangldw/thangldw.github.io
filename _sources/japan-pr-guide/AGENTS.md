# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Approved design contract

- Current source of truth: `references/approved-historical-recalculation.png`.
- Superseding decision: on 2026-08-18 the user selected the route-specific historical recalculation workspace.
- Preserve the five-step flow: Calculate score, Review claims, Verify historical score, PR requirements, Application plan.
- Keep exactly one HSP score for each reference date. Evidence is shown as proof coverage and must never be presented as a second or adjusted score.
- For a 70-79 result, recalculate the full score at the three-year reference date and require 70+. For an 80+ result, recalculate at the one-year reference date and require 80+.
- Show every applicable scoring item explicitly with its MOJ criterion, selected value, maximum points, current points, historical value, historical points, required proof, and overlap/dependency note. Do not hide scoring items behind a generic disclosure.
- Restore searchable Innovative Asia partner-university selection from the official list instead of asking the user to self-certify with Yes/No.
- `src/domain/scoring.js` owns all point calculations, activity-specific rules, overlap warnings, and eligibility gates. React owns input state and renders the engine result; UI option values must never be summed directly.
- The three activity types must expose their own degree, experience, remuneration, age/position, research, qualification, and bonus rules from the current MOJ table.
- Mobile is a responsive interpretation because no replacement mobile source was provided.
- Do not add unsupported legal claims. Every route label must say potential route or assessment path until PR requirements are confirmed.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
