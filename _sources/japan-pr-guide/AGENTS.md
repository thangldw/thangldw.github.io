# Agent instructions

- Build the UI in `src/`. Run the dev server yourself and check the result in a browser; do not hand the user start-up steps.
- Scoring logic lives in `src/domain/`. Follow [DESIGN.md](DESIGN.md) for the product contract and do not change scoring semantics without an explicit request.
- Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` intact. Before a Sites handoff run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`.
- Release to GitHub Pages only through `npm run release:pages`, then follow the steps in [README.md](README.md).
- Record durable user design decisions in [DESIGN.md](DESIGN.md).
