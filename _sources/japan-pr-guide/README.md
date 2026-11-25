# Japan PR Guide source

React 19 and Vite source of the Japan permanent-residence planning tool published at
<https://thangldw.github.io/japan-pr-guide/>. The tool is a dated policy snapshot (review date 2026-10-05), not a live government feed, and gives guidance only.

## Layout

| Path | Purpose |
| --- | --- |
| `src/domain/` | Scoring engine (`scoring.js`), historical checkpoints (`historical.js`), eligibility policy (`policy.js`), suggestions (`suggestions.js`) |
| `src/components/` | UI; `ScoreCalculator.jsx` owns the five-step flow |
| `src/scoreDefinitions.js`, `src/data/innovativeAsia.js` | MOJ scoring definitions and the Innovative Asia partner-university list |
| `scripts/release-pages.mjs` | Copies the build into `../../japan-pr-guide/` with the portfolio shell |
| `scripts/prepare-sites-build.mjs`, `worker/`, `.openai/hosting.json`, `tests/sites-worker.test.mjs` | Optional Sites hosting packaging |
| `docs/japan-pr-guide-flow.html` | Diagram of the HSP-to-PR workflow |

## Commands

```sh
npm ci
npm run dev           # local dev server
npm test              # domain and UI tests (vitest)
npm run release:pages # tests, production build, Sites tests, then regenerate ../../japan-pr-guide/
```

After a release, from the repository root:

1. Re-add the Content Security Policy `<meta>` to `japan-pr-guide/index.html` (the release script does not emit it).
2. Run `node scripts/sync-shell.mjs` and `npm test`.
3. Check the route in a browser in both themes and at mobile width, then commit the source and generated output together.

The release script keeps the previous hashed bundles during propagation; delete stale ones once the new build is live.
See [DESIGN.md](DESIGN.md) for the product contract.
