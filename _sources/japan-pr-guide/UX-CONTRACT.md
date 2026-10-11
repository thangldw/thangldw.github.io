# Canonical UI ownership

- Date: native date-only input. Browser-owned picker geometry and keyboard behavior are accepted; validation belongs to domain/policy.js.
- Select/Listbox: native select for enumerated scoring factors. University search remains the existing authored accessible combobox.
- Theme: portfolio js/site-shell.js owns theme persistence and switching. CalculatorHeader subscribes to themechange and only synchronizes its icon.
- Scoring: existing domain/scoring.js and domain/historical.js remain canonical. Proof coverage never adjusts a point score.
- State: session-only React state; no upload, submission, or persistent application plan.
- Navigation: five assessment steps; future steps remain unavailable until reached.
- Language: retain the existing English/Vietnamese product content in this visual preview. Full Japanese/Chinese product translation is not yet implemented.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Date | Native input | domain/policy.js | Browser-owned date picker | App filing-date test |
| Select/Listbox | Native select | components/ScoreCalculator.jsx | Existing university combobox | App activity and university tests |
| Theme | Shared site shell | /js/site-shell.js | React icon synchronization | Browser theme switch |
| Scoring | Domain engine | domain/scoring.js | Three activity types | Domain tests |
| Historical checkpoint | Domain engine | domain/historical.js | Route-specific date | Historical and App tests |
| Proof coverage | ClaimsScreen | components/ScoreCalculator.jsx | Session checklist | App flow tests |
