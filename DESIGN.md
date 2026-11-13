---
version: alpha
colors:
  canvas: "#ffffff"
  text: "#23291f"
  muted: "#535e4b"
  accent: "#965025"
  border: "#d1d7c9"
  control: "#e9ede3"
  canvas-dark: "#11150e"
  text-dark: "#e5e6df"
  muted-dark: "#b9bdb5"
  accent-dark: "#e69d6b"
  border-dark: "#32382d"
  control-dark: "#20261c"
  support: "#b83a06"
typography:
  body: {fontFamily: "Inter", fontSize: "14px", lineHeight: "1.5"}
  prose: {fontFamily: "Inter", fontSize: "16px", lineHeight: "1.6"}
  caption: {fontFamily: "Inter", fontSize: "12px", lineHeight: "1.5"}
  logo: {fontFamily: "Inter", fontSize: "22px", lineHeight: "1"}
rounded:
  control: "6px"
  dialog: "12px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  logo: {typography: "logo"}
  icon-button: {height: "36px"}
  touch-button: {height: "44px"}
---

## Overview

Thang Luu's homepage is the visual reference for a multilingual Data/AI/FDE portfolio and its application catalog. The interface should feel restrained, readable, and deliberate. The signature is the `t:>` mark; the content carries the identity. Avoid ornamental gradients, decorative panels, and a competing visual system per route.

Official site design system (ownership model B): **`css/tokens.css` is the canonical runtime source**. This document mirrors accepted values and explains their purpose. `css/site-shell.css` owns reusable logo and control recipes. `css/support-dialog.css` owns the shared support overlay. Route CSS owns composition and responsive placement, and consumes tokens rather than another palette or type scale.

## Colors

The light and dark values above map respectively to `--color-canvas`, `--color-text`, `--color-text-body`, `--color-accent`, `--color-border`, and `--color-surface-subtle`. Light is the homepage default; dark is an explicit action. `--color-support` is a deliberately stable orange action with white text in both themes, distinct from the inline accent. Success, warning, danger, information, and data series retain their established semantic roles in the same file.

No route declares raw palette values. Root token specificity also protects the contract against historical tokens embedded in generated application CSS. Shared hover, active, focus-visible, selected, and disabled states use semantic control tokens.

## Typography

The self-hosted Inter family is declared once as `--font-family-ui`, with legacy font names adapting to it. Japanese and Simplified Chinese use `--font-jp-sans` and `--font-cn-sans` with explicit script-capable system fallbacks.

The complete scale lives under `--text-*`. Main portfolio body is 14px for compact desktop density; mobile prose is 16px. Caption is 12px; small supporting copy is 13px; titles use the registered 16–24px roles; display sizes use registered 26–56px roles. The application catalog uses the tokenized fluid page title. Domain-specific exam typography remains owned by its source application until that screen is migrated; the common shell and catalog already use shared recipes.

Family, size, line height, weight, and tracking are independent shared tokens. Use regular body, medium/semibold titles, and bold brand text. Text reflows naturally; do not shrink or clip essential copy just to suppress scrolling at zoom.

## Layout

Homepage: sidebar plus fluid main column, a growing frame on large screens, and vertical reflow on mobile. Content stays in normal flow at every viewport height; there is no fixed single-screen target, and the page scrolls. Side projects are a carousel over all `featured` projects from `js/projects-data.json`, shuffled once per page load (5 visible at ≥1200px, 3/2 below), auto-rotating every 7 s. At ≤720px the rail is a static stacked list of four projects with no rotation or carousel controls; “View all projects” leads to the catalog. Per WCAG 2.2.2 it has a visible pause/resume control, pauses on hover and focus, stops after manual prev/next, starts paused under `prefers-reduced-motion`, and keeps `aria-live` off while rotating. Apps: searchable grouped catalog whose rows add a status badge and tags, link as a whole row, and keep `?q=` and `?group=` in the URL.

The `--space-*` tokens preserve accepted spacing while removing local literals; semantic legacy spacing aliases remain supported. Dimensions that express a layout (column width, breakpoint, or frame maximum) can stay route-specific. Pages with a floating support action must keep the bottom-right safe area clear of essential links. Home (sidebar) and Apps (header) place the same trigger inline through `#supportSlot` instead, so they have no floating action. At ≤720px `js/support-dialog.js` moves the trigger on every route into normal flow after the footer (`.support-flow-trigger`), so it never covers content or crowds a header. Portfolio subpages, case studies, and product introductions use the opt-in `css/compact-footer.css` layout: a centered signature with the page or app name, the current year, and the English line “thang. crafted with care. stay steadfast, stay free”. Portfolio pages use the same floating support button as Japan PR Guide. Load the shared support stylesheet and script and let the script mount the button directly on the page body.

## Elevation & Depth

Content is flat and separated by restrained rules. The floating support dialog uses elevation. Reduced motion removes component transitions. Focus remains visible independently of elevation and color.

## Shapes

Controls use `--radius-control`; dialogs use `--radius-dialog`. The logo uses `--logo-radius`, with a 38px desktop mark and 32px mobile mark. Its text stays at 22px, with mark text at 15px/13px. No page invents a new logo size.

## Components

| Contract | Owner | Consumers |
| --- | --- | --- |
| Colors, type, spacing, shape, control/focus values | `css/tokens.css` | All public routes through the shared shell |
| Logo geometry and states | `.site-brand`, `.site-brand-mark` in `css/site-shell.css` | Home, Apps, generated Cert via the compatibility adapter |
| Site navigation (Apps · Community) | `.site-nav` in `css/site-shell.css`; labels and `aria-current` from `js/site-shell.js` | Apps, Community, product introductions, 404 |
| Standard and icon controls | `.ui-button`, `.ui-icon-button`, shared legacy selectors in `css/site-shell.css` | Theme, locale, contact, project carousel controls; reusable on subsequent screens |
| Floating support and overlay | `css/support-dialog.css`, `js/support-dialog.js` | Home and existing public route integrations |

The logo never adopts link underline or changes its geometry on hover. Controls have hover, pressed, focus-visible and disabled recipes; keyboard/ARIA semantics remain the responsibility of runtime behavior. Touch controls are at least 44px high. Navigation links retain link semantics. Every theme toggle is `#themeToggle.site-theme-toggle` with a Font Awesome moon/sun icon that `js/site-shell.js` swaps; routes do not render their own glyph.

Across the shared shell, language selectors, theme toggles and lesson pagination use neutral text on a transparent background in both themes. The selected language has a 1px underline. Hover and press add a neutral fill, and keyboard focus shows an outline.


Run `python3 scripts/validate_design_system.py` and `python3 scripts/validate_site.py` before release. The design gate checks token/document drift, route literal debt, integration, shared recipes, and contrast. Verify rendered Home/Apps in both themes and mobile as well.

## Do's and Don'ts

- Use semantic tokens and the existing shared shell. Change the owner once, then verify every consumer.
- Keep layouts appropriate to their content; use the homepage's visual language, not its exact sidebar everywhere.
- Keep names and domain identifiers intact across localization.
- Do not copy theme palettes, logo rules, or button states into a route stylesheet.
- Do not modify generated exam bundles or infer application state from a visual token.

## Mandatory inheritance contract

`css/site-shell.css` is the official public stylesheet entry point. It imports `css/tokens.css`, the sole owner of core design values. All public HTML pages load this entry point; route CSS consumes its custom properties and shared component classes through the CSS cascade. Do not copy the homepage stylesheet to create another design system, or import one route's layout into another route.

Authoring order is shared foundations and components, then route composition. A route may set columns, widths, breakpoints and content placement. It must not redefine core `--color-*`, typography, spacing, logo, radius, control-size or focus tokens. A new reusable visual variant must be added to the shared owner first. Legacy aliases may reference canonical tokens, but cannot become an independent source of core values.

The release validator rejects protected token definitions in every authored file under `css/`. Generated application assets retain their source ownership; migrate them in their source repository and preserve the shared integration adapter. Existing legacy route styles are compatibility debt, not an alternative approved standard; new or revised screens must use this contract.
