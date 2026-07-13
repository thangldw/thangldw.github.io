# Apps catalog readability audit — v3.0.8

## Audit scope

- Surface: `/apps/` only. Home is the fixed design reference and was not modified.
- User goal: scan 15 projects, understand each app quickly, and open the right destination without struggling with small type.
- Evidence: user-provided screenshot, current production Home and Apps captures, revised All/Language states, and a compact responsive capture.

## Strengths

- The Apps page already shares Home's Space Grotesk / IBM Plex Mono pairing, neutral background, indigo accent, borders, theme control, and 75% header/footer inner measure.
- Technical and Language provide a durable information architecture, and the whole-card links keep the catalog easy to operate.
- Filter counts and URL-addressable category states make the collection understandable and shareable.

## Findings and fixes

1. **P1 — Card descriptions were undersized for the available card area.**
   - Evidence: descriptions rendered at about 13px inside wide three-column cards, creating weak hierarchy and difficult scanning.
   - Fix: descriptions now use 15px with 1.55 line-height; titles use 19px/1.3.
2. **P2 — Supporting text was consistently too small.**
   - Evidence: status/tag text was about 11.5px and card CTAs about 13px.
   - Fix: status and tags now use 12px with more internal padding; CTAs use 14px; filter labels use 13px.
3. **P2 — Mobile Apps navigation drifted from Home and could be clipped.**
   - Evidence: the previous compact capture showed both navigation links and the theme control competing for one narrow row.
   - Fix: Apps now follows Home's mobile Menu/Close pattern, including `aria-expanded`, close-on-link, and Escape-to-close behavior.
4. **P2 — Card density did not match the enlarged typography.**
   - Fix: card padding increases from 24px to 28px, icons return to 44px, and minimum height increases from 280px to 300px so all card types retain a consistent rhythm.

## Accessibility notes

- Larger body, label, and CTA type improves perceivability and scanability.
- Whole-card links retain accessible names; focus-within now receives a visible 2px accent outline.
- Mobile menu state is exposed through `aria-expanded` and keyboard Escape behavior.
- Screenshot review cannot establish full WCAG compliance; semantic and static validation are documented separately.

## Evidence

- `00-user-small-type-report.png`
- `01-home-reference.png`
- `02-apps-before.png`
- `03-apps-after-all.png`
- `04-apps-after-language.png`
- `05-apps-after-compact-640.png`
- `05-apps-menu-open-640.png`
- `05-apps-after-mobile-390.png`
- `06-readability-before-after.jpg`
- `07-home-apps-system-comparison.jpg`
- `08-card-type-focused-comparison.jpg`

## Outcome

All 15 cards inherit the same readable typography and interaction system. No Home files were changed.

Interaction verification confirmed zero horizontal overflow at 640px and 390px, Menu/Close state changes, Escape-to-close, 12 visible Language cards with synchronized URL/ARIA state, theme-label updates, and zero browser error events. At 390px the filters reflow to a two-column row plus a full-width Language button, avoiding clipped labels and horizontal scrolling.
