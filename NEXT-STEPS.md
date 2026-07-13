# Release completion checklist

Updated: 2026-07-13

## High priority

- [x] Fix Pipeline run history persistence. `runs.json` is committed by the refresh workflow; the locally refreshed dashboard contains two successful runs.
- [x] Verify the deployed GitHub Pages site after the latest deployment. Home, Apps, Data Copilot, Pipeline, Vocabulary Tabs, Prefix/Suffix, and canonical Japanese-app routes were checked.
- [x] Confirm every previous Japanese-app URL redirects to its canonical replacement on the public domain. All 10 mappings in `apps/URL-MIGRATION.md` passed.

## Performance and long pages

- [x] Add incremental rendering to Vocabulary Tabs: 96 cards initially, with an explicit load-more action.
- [x] Apply incremental rendering to Vocabulary Exams (96), Kanji Analysis (96), and Paraphrase Vocabulary (72).
- [x] Preserve the responsive grid rules: 4 columns desktop, 3 below 1180px, 2 below 840px, and 1 on mobile.

## Visual and interaction QA

- [x] Review every Vocabulary Tabs category after the URL/layout changes: Vocabulary, Set 1696, Adjectives, Adverbs, Compound Verbs, Body, and Prefixes/Suffixes.
- [x] Test Prefix/Suffix card expansion in light and dark themes, including long Vietnamese meanings and wide vocabulary tables.
- [x] Replace unrelated emoji-only tabs and audio controls in the primary Japanese vocabulary apps with named text controls.
- [x] Check all quiz states: initial, selected answer, correct, incorrect, explanation, next question, results, and reset.

## Responsive and accessibility

- [x] Test at 320px, 390px, 768px, 1024px, 1280px, and 1440px in the in-app browser; 36 route/viewport combinations had no horizontal overflow.
- [x] Test the 200% CSS-pixel equivalent at 720px; headers, filters, tables, and footers remain usable without horizontal overflow.
- [x] Complete a keyboard semantics pass for tabs, filters, search, quiz answers, theme toggle, expandable cards, and audio buttons.
- [x] Add or verify screen-reader names for generated cards, audio actions, tabs, and quiz controls.
- [x] Run a computed-style WCAG contrast check for Vocabulary Tabs and Vocabulary Exams in light and dark themes; 4,202 visible text/control samples passed.

## Content and SEO

- [x] Add canonical `<link>` tags to every new Japanese-app URL.
- [x] Update README and sitemap to use canonical URLs from `apps/URL-MIGRATION.md`; add `robots.txt`.
- [x] Review Vietnamese, English, and Japanese naming consistency in app descriptions and headings.

## Repository cleanup

- [x] Keep release audit screenshots versioned under `audit/release-2026-07-13/` as compact release evidence.
- [x] Keep obsolete redirect directories for bookmark compatibility; removal is intentionally deferred until traffic no longer requires them.
- [x] Run the final broken-link crawl and HTML validation: 32 HTML pages, 10 redirects, 18 sitemap URLs, and all local references passed.

## Reference files

- URL mapping: `apps/URL-MIGRATION.md`
- Japanese-app audit: `audit/japanese-apps/audit-report.md`
- Responsive audit: `audit/responsive/audit-report.md`
- Design QA: `design-qa.md`

## Post-release improvements

- [x] Redesign Home around a rotating spotlight and scalable collections, remove the timeline/Recent Updates treatment, and give AI, data, Japanese-learning, and future demos equal room to grow.
- [x] Redesign Apps as a searchable, URL-addressable catalog that can scale beyond the current 15 demos without making RAGOps the center of the portfolio.
- [x] Add validated social-sharing metadata to all 18 sitemap URLs: canonical, 60–170 character description, Open Graph title/description/URL/image, and Twitter large-image card.
- [x] Capture real 1200×630 website screenshots for Home and Apps social previews instead of using generated or placeholder artwork.
- [x] Extend the offline validator so missing, mismatched, or broken social metadata blocks future releases locally.
- [x] Make Apps category filters shareable and accessible with `?category=` deep links, browser back/forward support, `aria-pressed`, and a live result count.
- [x] Replace the Apps catalog emoji with a consistent Font Awesome icon system; expose mobile-menu state through ARIA, support Escape-to-close, and keep theme-toggle labels synchronized with the active theme.
