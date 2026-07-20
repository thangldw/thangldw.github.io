# BJT Study Design QA

- Source visual truth: `/Users/thang/.codex/generated_images/019f8080-13b9-77e0-bbce-852076c1b701/exec-360589a5-0e0c-4d3a-af45-45dc7981665c.png`
- Implementation screenshot: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-app-audit/bjt-structured-light-final.png`
- Home light-theme screenshot: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-app-audit/home-paper-light-final.png`
- Mobile evidence: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/bjt-qa-mobile-1.png`
- Viewport: desktop 1440 × 1024; mobile 390 × 844
- State: light-theme daily lesson, first question, no answer selected

## Full-view comparison evidence

The source and updated implementation were opened together in the same visual comparison input. The implementation preserves the source's 240px navigation rail, warm editorial canvas, orange active state, large mixed Vietnamese/Japanese lesson heading, single focused learning column, four bordered answer rows, black primary action language, and narrow three-step session rail. The major-region proportions, above-the-fold task, and responsive hierarchy are aligned.

## Focused region comparison evidence

The lesson heading and question region were checked at original resolution because typography, wrapping, answer density, and column width are the fidelity-critical surfaces. The Japanese heading scale was reduced to 90% of the Vietnamese display size so the combined title stays on one line at 1440px, matching the source composition. The answer rows retain the source's spacing and visual order while accommodating longer real dataset definitions.

## Findings

No actionable P0, P1, or P2 mismatches remain.

- P3: The local Font Awesome subset uses slightly heavier filled icons than the source's outline icon language. This is acceptable because it avoids a new external dependency and remains consistent with the rest of the portfolio.
- P3: Real Quizlet definitions vary in length, so some choices wrap to two lines while the mock uses uniformly short answers. The rows expand without clipping or horizontal overflow.
- P3: The implementation screenshot is captured lower in the same lesson so the new structured answer fields can be inspected; the shell proportions still align with the source.

## Required fidelity surfaces

- Fonts and typography: passed. System sans and Japanese Mincho fallbacks match the source's editorial sans/serif contrast; weights, line heights, antialiasing, and wrapping are stable.
- Spacing and layout rhythm: passed. Rail widths, main-column padding, dividers, answer spacing, session-step rhythm, and subtle square radii match the reference closely.
- Colors and visual tokens: passed. The light canvas is now warm paper (`#f3f0e8`) instead of cold white, and the dark canvas is warm charcoal (`#11130f`). Neutral rail, ink, rules, orange accent, success, and error states remain legible in both themes.
- Image quality and asset fidelity: passed. The reference contains no photographic or illustrative assets. The implementation uses the existing licensed local icon font and does not substitute source imagery with CSS drawings or placeholders.
- Copy and content: passed. Vocabulary feedback now separates term, reading, Sino-Vietnamese reading, meaning, and example. Grammar feedback separates pattern, meaning, Vietnamese explanation, Japanese example, and Vietnamese translation. Dataset-scale claims match the supplied files: 84 grammar patterns and 1,565 vocabulary terms.

## Interaction and responsive verification

- Selected an answer, checked it, and observed correct/incorrect feedback.
- Opened vocabulary, searched for `契約`, and confirmed filtered results.
- Switched to dark mode and back to light mode.
- Verified dark body and card surfaces on the legacy N1 Vocabulary Exams app.
- Verified `苦情` and `Vる・Vない＋ことにしている` through the full answer-and-feedback flow.
- Opened the mobile navigation at 390px.
- Confirmed mobile `scrollWidth` equals `clientWidth` (390px), with no horizontal overflow.
- Checked browser console warnings and errors: none.

## Comparison history

1. Initial P2: the title sat too low and the Japanese subtitle wrapped because the context label occupied a separate row and both scripts used the same 55px display size.
2. Fix: merged the BJT context into the date row, reduced the display maximum to 48px, and set the Japanese title to 90% of the Vietnamese size.
3. Post-fix evidence: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/bjt-qa-desktop-final.png`; the title now matches the source's single-line hierarchy and the lesson content begins at the same visual depth.

## Implementation checklist

- [x] Desktop source fidelity
- [x] Mobile responsive behavior
- [x] Primary learning flow
- [x] Search and review states
- [x] Light and dark themes
- [x] Structured vocabulary and grammar feedback
- [x] Warm-paper home theme
- [x] Console and site validation

## Follow-up polish

- Consider adding a lighter outline icon set to the shared portfolio assets in a future design-system pass.
- Consider editorial cleanup of unusually long imported definitions without changing their meaning.

final result: passed
