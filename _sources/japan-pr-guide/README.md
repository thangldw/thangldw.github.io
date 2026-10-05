# Japan PR Guide source

Recovered from the approved 2026-08-18 prototype. Before modification, the build reproduced production JS `index-DXYY2OyG.js` and CSS `index-D5wwRGgE.css` byte for byte.

The source is under `_sources`, excluded by GitHub Pages/Jekyll. Generated public assets live in `apps/japan-pr-guide`.

```sh
npm ci
npm run release:pages
```

The release command runs domain/UI tests, packaging tests and the production build before generating the Pages route with the portfolio support/analytics/font shell. Previous hashed bundles are retained during propagation. Preview the generated route with a static server at the repository root.

Policy review: 2026-10-05. See the portfolio `docs/japan-pr-guide/README.md` for provenance. This is a dated snapshot, not a live government feed.
