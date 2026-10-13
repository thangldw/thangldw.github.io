# Learning

Production route: https://thangldw.github.io/learning/

## Build

Run `npm ci`, `npm run build:pages`, `node --test tests/bank-session.test.mjs tests/session-isolation.test.mjs`, and `npm run test:sites`. Copy `dist/client/` to the repository `learning/` directory, excluding mirrored `css/`, `js/` and `assets/fonts/`. The production shell loads official root `/css/site-shell.css` and `/js/site-shell.js` directly. Route CSS owns content layout only. Local development uses `npm run dev -- --host 127.0.0.1 --port 8797 --strictPort`.

## Scope and boundaries

Vietnamese navigation and guidance; source-language questions remain unchanged. Guided lessons cover one AWS RDS topic and one Japanese negation-scope topic; chapter outlines are not complete courses. Question practice uses the existing controlled API at its approved production origin. PMP uses its existing separate workspace; HSK has no API question bank. No full-exam readiness or pass-probability claims.

Only question IDs, learner responses, position and result labels are persisted. Protected prompts, answer keys, explanations, rubric and tokens remain in memory. Canonical planning/storage/scoring owners are reused; no source-bank or API changes. Existing certification routes remain available.

18 additional five-question browser sessions completed (90 sampled questions), plus prior AWS/JLPT/AP checks. See bank-browser-coverage.json. Numeric/ordered/matching formats lack live source records and are not claimed verified. Theme control is bound by the canonical site-shell MutationObserver; the static auditor incorrectly flags its lack of inline onClick. Runtime theme verification is required on release.
