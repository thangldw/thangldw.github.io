---
version: alpha
colors:
  canvas: "#f6f5f1"
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

The complete scale lives under `--text-*`. Main portfolio body is 14px for the approved single-screen desktop density; mobile prose is 16px. Caption is 12px; small supporting copy is 13px; titles use the registered 16–24px roles; display sizes use registered 26–56px roles. The application catalog uses the tokenized fluid page title. Domain-specific exam typography remains owned by its source application until that screen is migrated; the common shell and catalog already use shared recipes.

Family, size, line height, weight, and tracking are independent shared tokens. Use regular body, medium/semibold titles, and bold brand text. Text reflows naturally; do not shrink or clip essential copy just to suppress scrolling at zoom.

## Layout

Homepage: sidebar plus fluid main column, 1280 × 720 compact desktop target across EN/VN/JP/CN, growing frame on large screens, vertical reflow on mobile. Apps: searchable grouped catalog. Cert: its existing learning application layout.

The `--space-*` tokens preserve accepted spacing while removing local literals; semantic legacy spacing aliases remain supported. Dimensions that express a layout (column width, breakpoint, or frame maximum) can stay route-specific. A shared fixed support action occupies the bottom-right safe area; page composition must keep it clear of essential links.

## Elevation & Depth

Content is flat and separated by restrained rules. Elevation is reserved for support and contact overlays. Reduced motion removes component transitions. Focus remains visible independently of elevation and color.

## Shapes

Controls use `--radius-control`; dialogs use `--radius-dialog`. The logo uses `--logo-radius`, with a 38px desktop mark and 32px mobile mark. Its text stays at 22px, with mark text at 15px/13px. No page invents a new logo size.

## Components

| Contract | Owner | Consumers |
| --- | --- | --- |
| Colors, type, spacing, shape, control/focus values | `css/tokens.css` | All public routes through the shared shell |
| Logo geometry and states | `.site-brand`, `.site-brand-mark` in `css/site-shell.css` | Home, Apps, generated Cert via the compatibility adapter |
| Standard and icon controls | `.ui-button`, `.ui-icon-button`, shared legacy selectors in `css/site-shell.css` | Theme, carousel, locale, contact; reusable on subsequent screens |
| Floating support and overlay | `css/support-dialog.css`, `js/support-dialog.js` | Home and existing public route integrations |
| Cert catalog aliases | Scoped compatibility adapter in `css/site-shell.css` | Existing generated `.certification-hub` shell |

The logo never adopts link underline or changes its geometry on hover. Controls have hover, pressed, focus-visible and disabled recipes; keyboard/ARIA semantics remain the responsibility of runtime behavior. Touch controls are at least 44px high. Navigation links retain link semantics.

The generated Cert bundle is not hand-edited. Its learning/assessment internals can be migrated in the source repository later without introducing another token source. This release establishes shared foundation and shell consistency, rather than changing exam workflows.

Run `python3 scripts/validate_design_system.py` and `python3 scripts/validate_site.py` before release. The design gate checks token/document drift, route literal debt, integration, shared recipes, and contrast. Verify rendered Home/Apps/Cert in both themes and mobile as well.

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
