# Learning

Production route: https://thangldw.github.io/learning/

## Build

Run `npm ci`, `npm run build:pages`, `node --test tests/bank-session.test.mjs tests/session-isolation.test.mjs`, and `npm run test:sites`.

`dist/pages/learning/` is the introductory directory and shared app asset owner. `dist/pages/<slug>/index.html` is a fixed-certification quick-practice workspace. Keep the dedicated PMP workspace unchanged. Before the first migration of a root certification entry, preserve its old index as `<slug>/classic.html`; subsequent releases must retain that file and existing legacy assets. Deploy only generated root index files and the learning/ directory, excluding mirrored learning/css/, learning/js/ and learning/assets/fonts/.

Production loads official root `/css/site-shell.css` and `/js/site-shell.js`. Route CSS owns content layout and extends the canonical Vietnamese optical-metrics rule. Local development uses `npm run dev -- --host 127.0.0.1 --port 8797 --strictPort`.

## Scope and boundaries

Vietnamese navigation and guidance; source-language questions remain unchanged. Guided lessons cover one AWS RDS topic and one Japanese negation-scope topic; chapter outlines are not complete courses. Question practice uses the existing controlled API at its approved production origin. PMP uses its existing separate workspace; HSK has no API question bank. No full-exam readiness or pass-probability claims.

Only question IDs, learner responses, position and result labels are persisted. Protected prompts, answer keys, explanations, rubric and tokens remain in memory. Canonical planning/storage/scoring owners are reused; no source-bank or API changes. Existing certification routes remain available.

18 additional five-question browser sessions completed (90 sampled questions), plus prior AWS/JLPT/AP checks. See bank-browser-coverage.json. Numeric/ordered/matching formats lack live source records and are not claimed verified. Theme control is bound by the canonical site-shell MutationObserver; the static auditor incorrectly flags its lack of inline onClick. Runtime theme verification is required on release.

## Practice insights

Today, Overview and Progress consume the same controlled index metadata and namespaced learner practice progress. History stores only the latest result, attempt count and session identity per stable question ID. Feedback reload does not add attempts; new queues preserve recorded history. Legacy migration recovers only the queue still stored, without inventing earlier attempts. Guided lesson demonstration results are excluded.

Index metadata is shared in bounded memory for five minutes, including in-flight requests; failed loads are evicted. Protected prompts, feedback and tokens are never persisted in that cache or learner storage. PMP remains in its dedicated workspace; HSK shows an empty-bank state.
