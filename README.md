# thangldw.github.io

Personal portfolio and application catalog of Thang Luu, served as a static site by GitHub Pages.
There is no build step and no runtime dependency. Node scripts only check and synchronize files.

- Production: <https://thangldw.github.io/>
- Branch: `master`, published from the repository root by GitHub Pages (`_config.yml` keeps sources, scripts, tests and Markdown out of the published tree)

## Routes

| Route | Content | Source |
| --- | --- | --- |
| `/` | Profile, hero graph, areas of work, contact | `index.html`, `js/homepage.js`, `js/hero-graph.mjs` |
| `/apps/` | Project cards grouped by purpose, filterable with `?group=` | `apps/index.html`, `js/projects-data.json` |
| `/community/` | Merged open-source pull requests per upstream repository | `community/index.html`, `js/community-section.mjs` |
| `/japan-pr-guide/` | Standalone Japan permanent-residence planning tool (generated) | `_sources/japan-pr-guide/` |
| `/404.html` | Terminal-style not-found page that lists the real routes and suggests the closest one | `404.html`, `css/404.css`, `js/not-found.mjs` |

Other apps (Igo, Bizroll, JetRise, Neon Glider, Kakeflow, Macinity) live in their own repositories under the same origin.
The 404 page lists their routes; the Cloudflare Workers study apps are linked from the catalog.
Redirect stub pages are not allowed: link to the canonical route. Old `/#apps` and `/#community`
links are forwarded by `js/homepage.js`, and `js/legacy-route-redirect.js` forwards retired `/cert/` routes from the 404 page.

## Repository layout

```text
.
├── index.html, apps/, community/, 404.html     Pages that carry the shared shell
├── japan-pr-guide/                             Generated Japan PR Guide (do not edit by hand)
├── _sources/japan-pr-guide/                    React/Vite source of the Japan PR Guide
├── css/                                        tokens.css, site-shell.css, support-dialog.css, route styles
├── js/                                         Shared behaviour, locales, project data
├── shared/shell.mjs                            Canonical header and footer markup
├── scripts/sync-shell.mjs                      Shell sync and asset version stamping
├── tests/site.test.mjs                         Structural tests (node:test)
├── assets/                                     Social images, QR images, self-hosted fonts and licenses
├── DESIGN.md                                   Design system contract
├── _config.yml                                 Jekyll excludes for the published tree
└── robots.txt, sitemap.xml
```

## Shared shell

`shared/shell.mjs` holds the single copy of the header and footer. `scripts/sync-shell.mjs` writes it into every
page listed in `shellPages` (`localized` variant on Home, Apps and Community; `plain` on 404 and Japan PR Guide)
and appends a content-hash `?v=` to every `/css` and `/js` reference, including module imports, so a changed file
always gets a new URL.

```sh
node scripts/sync-shell.mjs          # write changes
node scripts/sync-shell.mjs --check  # fail if anything would change (used by npm test and CI)
```

Run it after editing `shared/shell.mjs`, any file under `css/` or `js/`, or after rebuilding the Japan PR Guide.

## Development and verification

Requirements: Node 22 and any static server. Serve over HTTP because the catalog loads JSON at runtime.

```sh
python3 -m http.server 4173
npm test
```

`npm test` runs `tests/site.test.mjs`: shell and version sync, local `href`/`src` resolution, sitemap entries,
detection of unreferenced CSS/JS, CSP compliance (no inline styles or scripts), catalog schema and the 404 suggestions.
`.github/workflows/check.yml` runs the same command on every push and pull request to `master`.
Before pushing, also open Home, Apps, Community and any changed route in light and dark themes and at mobile width.


## Project catalog

`js/projects-data.json` is the only source of project metadata. `js/projects-data.js` validates it and exposes
`portfolioProjectsReady`; the Apps page renders after that promise resolves.

1. Keep `id` unique and stable.
2. Fill every required field and use an `https://` or root-relative destination.
3. Add translations for the card in `js/project-translations.mjs` (vi, ja, zh).
4. Run `npm test` and check `/apps/` locally.

## Localization

Home, Apps and Community support EN, VI, JA and ZH through `js/site-locale.mjs`, `js/home-locales.mjs`,
`js/community-locales/` and `js/project-translations.mjs`. Product names and identifiers stay untranslated.

## Support dialog

`js/support-dialog.js` and `css/support-dialog.css` provide one shared dialog with a Ko-fi QR (global) and a ShopeePay QR
(Vietnam). Pages with `<div id="supportSlot">` in the header get an inline trigger; on narrow screens it becomes a compact
icon button. Pages without a slot get a floating button. Payment destinations must not change without the owner's approval.

## Japan PR Guide

Source, tests and release instructions are in [`_sources/japan-pr-guide/README.md`](_sources/japan-pr-guide/README.md).
The generated route in `japan-pr-guide/` is produced by `npm run release:pages` in that directory.

## Security and privacy

- Content Security Policy: `style-src 'self'`; no inline styles or inline scripts on public pages.
- No secrets, credentials or private datasets in the repository. Fonts and assets are self-hosted.
- Catalog text is inserted with `textContent` or escaped before it reaches HTML.
- Analytics is the single shared `js/analytics.js`; it runs only on the production host.
- Jekyll (`_config.yml`) excludes `_sources/`, scripts, tests and Markdown from the published site. Nothing in the repository is private: the source is public on GitHub.

## Deployment and rollback

Push to `master`; GitHub Pages publishes the root. Verify production HTML and the changed routes once the Pages build
is `built`. To roll back, revert the focused commit and push.

## License

Apache License 2.0; see `LICENSE` and `NOTICE`. Fonts and icons keep their own licenses under `assets/fonts/licenses/`.
