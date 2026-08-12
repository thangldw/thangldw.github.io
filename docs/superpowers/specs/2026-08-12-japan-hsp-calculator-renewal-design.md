# Japan HSP Calculator Renewal Design

## Goal

Renew `apps/japan-pr-guide/` into a calculator-first, bilingual HSP and permanent-residence planning tool that lets a user understand their current score, the 70/80 thresholds, and the corresponding PR residence-period route in one viewport.

## Selected visual target

- Desktop concept: `/Users/thang/Documents/Codex/2026-08-12/tham-kh-o-k-code-pine-2/work/design/hsp-calculator-desktop-concept.png`
- Mobile concept: `/Users/thang/Documents/Codex/2026-08-12/tham-kh-o-k-code-pine-2/work/design/hsp-calculator-mobile-concept.png`
- Expanded bonus state: `/Users/thang/Documents/Codex/2026-08-12/tham-kh-o-k-code-pine-2/work/design/hsp-calculator-bonuses-open-concept.png`

The calculator-first direction is selected over the wizard and evidence-cockpit directions because it minimizes clicks, keeps the legal category distinction visible, and preserves the current app's detailed evidence workflow.

## Product contract

1. The first scan answers: selected HSP activity, estimated points, distance from 70/80, and potential PR residence-period route.
2. The score is an estimate. It never states that immigration status or PR permission is granted.
3. HSP score eligibility and PR evidence readiness remain visibly distinct.
4. The HSP 70/80 residence-period shortcut does not suppress the conduct, livelihood, public-duty, status, public-health, guarantor, or evidence checks.
5. No user profile is uploaded. Evidence checklist progress stays in local browser storage.

## Official-source freshness

- HSP threshold: 70 points; 80 points is the one-year PR residence-period route.
- PR guideline source: ISA guideline revised 24 February 2026.
- HSP Q&A source: ISA Q&A current April 2026.
- HSP bonus-support list source: ISA innovation-support list current March 2026.
- University bonus source: ISA university list current January 2026.
- J-Skip online filing note: ISA online system revision January 2026.

The scoring table remains tied to the official table introduced 1 April 2023, while the app's source metadata must separately show when the current surrounding rules and bonus lists were checked. UI copy therefore says `Rules checked · April 2026`, not that all point values took effect in 2026.

## Information architecture

### Header

Compact HSP mark, product name, `Rules checked · April 2026`, and an `About HSP` link to official references.

### Calculator workspace

- Left: activity selection, core factors, contextual research/qualification factors, and a collapsed bonus disclosure.
- Right: live score, directly labeled 70/80 meter, status, potential PR route, point breakdown, privacy note, and CTA to PR requirements.
- The bonus disclosure groups existing inputs into Language & education, Employer & activity, and Qualifications & achievements without changing their scoring semantics.

### Downstream content

Keep the current HSP procedure guide, J-Skip summary, PR diagnosis, adaptive evidence checklist, and primary-source list. Reduce their visual weight so the calculator remains the product's dominant surface.

## Design system

- Background: true white `#ffffff`.
- Secondary surface: cool gray `#f7f8f8`.
- Ink: `#171918`; muted text: `#656b70`; border: `#d9dddf`.
- Accent: rust `#b63a12`; qualified: `#18763a`; review: `#9a6500`; blocked: `#a52b24`.
- Typography: existing self-hosted Be Vietnam Pro family; 14-16px controls/body; 30-40px desktop title.
- Geometry: 1px borders, 4-8px radii, almost no shadow, open rows rather than nested cards.
- Icons: existing Remix Icon family, consistent line style. Brand mark is the generated `assets/hsp-mark.png`.
- Motion: score/meter changes only; respect `prefers-reduced-motion`.

## Responsive behavior

- Desktop at 1440 x 1024: roughly 68/32 calculator/result split.
- Mobile at 390px: score summary precedes inputs, activity choices scroll horizontally or fit as three touch-safe columns, fields stack, and no sticky result overlay covers content.
- Native controls are at least 44px high; input font size is 16px on mobile; charts and threshold information remain directly labeled.

## Architecture

Keep the static GitHub Pages delivery model. Extract pure scoring logic to `scoring.js` with a browser global and CommonJS export so Node's built-in test runner can verify the exact calculator contract without adding a build system. `app.js` remains responsible for DOM, translation, diagnosis, evidence state, and interaction wiring.

## Error and uncertainty handling

- Remuneration below 3 million yen blocks HSP (i)(b)/(i)(c) even when nominal points reach 70.
- Overlapping Japanese-language bonuses do not stack; dependency warnings remain visible.
- Missing answers in PR diagnosis produce a review state; failed requirements produce a blocked state.
- Current-source labels include month/year and links to primary sources; no fake live indicator is used.

## Testing and release gates

- Node tests cover income/age bands, research caps, bonus overlap/dependency rules, 3-million-yen hard stop, and 70/80 route classification.
- Browser QA covers page identity, initial render, activity switching, score updates, bonus disclosure, PR CTA/diagnosis, document persistence, console health, desktop 1440 x 1024, and mobile 390 x 844.
- Design QA compares the accepted concept and rendered screenshots at matching states and must end with `final result: passed`.
- Release requires a clean commit, pushed branch, merged PR, GitHub Pages publication, and production URL verification at the released commit.

## Self-review

No placeholder requirements remain. Scope is limited to the existing app. The architecture preserves static hosting, source links, bilingual content, and current downstream workflows while making scoring testable and renewing the primary interaction.
