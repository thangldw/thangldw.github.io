# Japan PR Guide design and product contract

Visual tokens, shell and theme come from the portfolio (`/css/site-shell.css`, `/js/site-shell.js`). This document covers only
what is specific to the tool.

## Product flow

1. Calculate the HSP score.
2. Review score claims and proof coverage.
3. Recalculate the score at the route-specific historical checkpoint.
4. Confirm PR requirements.
5. Prepare the application plan and evidence checklist.

Future steps stay unavailable until reached. State is session-only React state: no `localStorage`, URL state, upload or remote
persistence.

## Scoring rules

- One estimated HSP score per reference date. Evidence is shown as proof coverage (documented claims over active point claims) and never produces a second or adjusted score.
- The total is uncapped; 100 is a route-comparison reference, not a ceiling.
- A current 70-79 result selects the potential three-year route and recalculates at 18 August 2023 with a 70-point threshold. A current 80+ result selects the potential one-year route and recalculates at 18 August 2025 with an 80-point threshold.
- Historical age, experience, remuneration, qualifications and additions are independently editable and scored by the same engine.
- Every applicable item is always visible with criterion, selected value, maximum points, current points, historical value, historical points, required proof and overlap or dependency note.
- Each of the three activity types exposes its own degree, experience, remuneration, age or position, research, qualification and bonus rules from the current MOJ table.
- Innovative Asia partner universities are chosen through search over the official list (English name, Japanese name or country), not a Yes/No self-certification. University additions are capped at 10 points; the multiple-degree addition needs an eligible advanced degree in more than one field.
- JICA training adds 5 points alongside Japanese-university graduation only when the training did not use Japanese university or graduate-school classes; otherwise the overlap removes the JICA addition.
- Age is a manual field per reference date. Do not add date-of-birth input or DOB-based age calculation.
- Do not make unsupported legal claims. Route labels say potential route or assessment path until requirements are confirmed.

## Ownership

| Capability | Owner |
| --- | --- |
| Point math, itemized breakdown, overlap warnings, eligibility gates | `src/domain/scoring.js` |
| Route checkpoint, reference date, historical defaults | `src/domain/historical.js` |
| Date validation | `src/domain/policy.js`; the input is a native date-only field |
| Enumerated factors | Native `select`; university search is an authored accessible combobox |
| Theme persistence | Portfolio `js/site-shell.js`; `CalculatorHeader` only syncs its icon on `themechange` |
| Proof coverage | `ClaimsScreen` in `src/components/ScoreCalculator.jsx` |

React owns input state and renders engine results. UI option values are never summed directly.

## Layout and visuals

- Desktop (1440 x 1024 target): compact header with Official sources and a horizontal five-step rail; summary row with current score, selected route, required checkpoint and proof coverage; route selector; wide current-versus-historical table beside a narrow route checklist; MOJ source strip and guidance-only footer. No language toggle or Save plan action.
- Mobile: the table becomes aligned current and historical rows without hiding any category; 44px minimum targets; no hover-only evidence; no horizontal page overflow.
- Inter Variable at 14-16px, 22-28px page title; radii 6-8px; almost no shadow; no gradients, glass or nested card grids; Phosphor icons at 16-22px.
- Reduced motion removes smooth scrolling and nonessential transitions.
- Content is English and Vietnamese; Japanese and Chinese product translations are not implemented.
- Keep the shared floating Support dialog. Do not show an "Explore more apps" link below the source notes.
