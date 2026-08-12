# Japan HSP Score Spine Design

## Goal

Keep the live HSP score visible while the user edits calculator inputs, without leaking a floating score control into the Visa, permanent-residence, document, or source workflows.

## Evidence and root cause

Current production combines three incompatible patterns:

- a desktop score rail about 1,114px tall inside roughly 836px of usable viewport;
- a mobile score report about 788px tall before the first calculator control;
- a page-global fixed `#scoreDock` triggered only by visibility of the score numeral.

The rail therefore cannot remain coherent as a sticky unit. The dock appears while pieces of the rail are still visible, remains over unrelated lower workflows, competes with the support button on mobile, and sends users thousands of pixels backward when they want to edit inputs.

## Selected interaction model

Use one score model with responsive presentations, bounded to the calculator.

### Desktop: score spine

At viewport widths of 1024px or wider:

- Keep a right-hand score spine within the calculator grid.
- The sticky content must fit in `100dvh` below the application header without internal scrolling.
- Persistent content is limited to score, eligibility state, 70/80 threshold meter, route summary, and the points required for the next threshold.
- Point breakdown, evidence progress, trust copy, copy action, and PR CTA remain available in normal flow but are not part of the sticky payload.
- The score spine stops at the calculator boundary.

### Tablet and mobile: calculator score ribbon

Below 1024px:

- Activity selection is the task entry; the full zero-score report does not consume the first viewport.
- A compact score ribbon appears in normal calculator flow after activity selection and becomes sticky below the app header while calculator inputs are being edited.
- The ribbon remains part of layout, is at most 64px high, and shows score plus one concise state line.
- It stops naturally at the calculator boundary and never becomes a bottom overlay.
- The support control remains independent and cannot overlap the score ribbon.

## Lower-workflow score context

Remove the global `#scoreDock`. Visa, PR diagnosis, and document workflows receive a static context row in their section header:

`Calculated HSP: 70 · Potential 3-year route · Edit score`

Rules:

- The row updates when calculator values change.
- It is not sticky or fixed.
- `Edit score` targets `#coreFactors`, not the top of the score report.
- The Sources section receives no score context because it is reference material, not a score-dependent workflow.
- Copy remains probabilistic: `potential route`, never an immigration approval claim.

## Information architecture

Within the calculator:

1. Product purpose and activity selection.
2. Compact live score presentation.
3. Core factors.
4. Activity-specific research or qualification inputs.
5. Special additions.
6. Non-sticky detailed result content and transition to PR requirements.

Below the calculator:

1. HSP Visa guide with static calculated-score context.
2. PR diagnosis with static calculated-score context.
3. Evidence checklist with static calculated-score context.
4. Primary sources without score context.

## Scroll and disclosure behavior

- Opening a lower workflow closes the previously opened workflow.
- After the layout settles, the newly opened summary is aligned below the sticky app header.
- Hash navigation and `Edit score` use `scroll-margin-top` and respect `prefers-reduced-motion`.
- No component other than the document page itself creates vertical scroll.
- Horizontal activity scrolling remains allowed only on narrow viewports and must not create page-level horizontal overflow.

## Accessibility

- Use one consolidated score announcement with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
- Do not give both detailed score and compact score separate live regions.
- `Edit score` is a textual control with a minimum 44px target and visible focus.
- Sticky content must not obscure focused inputs at 200% zoom or narrow mobile widths.
- Reduced-motion users receive immediate anchor positioning without smooth scrolling.

## Implementation boundaries

- Preserve static GitHub Pages delivery, vanilla JavaScript, bilingual English/Vietnamese content, existing scoring logic, PR diagnosis, document persistence, and official sources.
- Reuse the existing design tokens, Be Vietnam Pro typography, Remix Icons, and rust/teal visual language.
- Do not add a framework, dependency, backend, new route, or new user-data persistence.
- Do not add an internal scroll container to the score spine.

## Acceptance criteria

Desktop 1440x900 and 1024x768:

- The compact score spine is fully visible and coherent while editing the calculator.
- It has no internal vertical overflow.
- No duplicate floating score surface appears.
- It disappears when the calculator ends.

Mobile 390x844 and tablet 760x800:

- Activity selection appears before the detailed score report.
- The score ribbon remains visible while editing inputs and is no more than 64px high.
- It is not visible over Visa, PR, Documents, or Sources.
- It does not overlap the support control or focused inputs.

All viewports:

- Visa, PR, and Documents show current static score context with a working `Edit score` control.
- Opening a workflow leaves its heading below the sticky header without a multi-thousand-pixel context jump.
- No nested vertical scroll, relevant console error/warning, or page-level horizontal overflow exists.
- Existing scoring and structure regression tests remain green, with new tests covering score boundaries and context rows.

## Self-review

- Placeholder scan: no `TBD`, `TODO`, or deferred decision remains.
- Consistency: one score state feeds the desktop spine, mobile ribbon, and static lower context; only the calculator presentation is sticky.
- Scope: limited to score presentation, calculator ordering, workflow context, and scroll anchoring in the existing app.
- Ambiguity: the 1024px breakpoint, 64px ribbon cap, context destinations, and sections receiving score context are explicit.
