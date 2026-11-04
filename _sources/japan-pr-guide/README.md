# Japan PR Guide source

Recovered from the approved 2026-08-18 prototype. Before modification, the build reproduced production JS `index-DXYY2OyG.js` and CSS `index-D5wwRGgE.css` byte for byte.

The source is under `_sources`, excluded by GitHub Pages/Jekyll. Generated public assets live in `japan-pr-guide`.

```sh
npm ci
npm run release:pages
```

The release command runs domain/UI tests, packaging tests and the production build before generating the Pages route with the portfolio support/analytics/font shell. Previous hashed bundles are retained during propagation. Preview the generated route with a static server at the repository root.

Policy review: 2026-10-05. See the portfolio `docs/japan-pr-guide/README.md` for provenance. This is a dated snapshot, not a live government feed.

### Contextual support experiment

Optional support appears after claim review and in the application plan. Payment choices expand inline; results and checklists remain free. The existing Ko-fi destination and unchanged MB Bank QR are reused. The Pages release deliberately omits the global floating support dialog.

Umami events: `support_view` (50% of the panel visible, once per mount), `support_open`, `support_checkout` (outbound Ko-fi click only), and `support_qr_download`. Properties are limited to `project=japan-pr-guide` and `location=claims|application-plan`. No score, income, dates, checklist contents, or other application details are included. Collection depends on the existing tracker being available. These events do not confirm payment; reconcile receipts separately, and leave unattributed donations unattributed.

Run `npm run release:pages` and, from the portfolio root, `node scripts/smoke_japan_pr_guide.mjs`.
