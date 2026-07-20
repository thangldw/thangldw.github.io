# Japanese learning apps — design audit 2026-07-21

## Scope and method

- Audited 13 Japanese-learning apps: BJT Study plus 12 JLPT N1 apps.
- Opened every app in the local browser with dark mode active.
- Exercised answer states in Grammar Exams, Kanji & Collocations, Reading 75, Reading 問題9, and Context Vocabulary.
- Reviewed BJT Path, semantic vocabulary filters, expanded vocabulary insight, practice, and speaker control.
- Applied the existing repository design system and the targeted-upgrade approach from Leonxlnx/taste-skill's `redesign-existing-projects` guidance.

## Learning flow

1. **Choose a learning area — healthy.** BJT now opens on Lộ trình; the duplicate Hôm nay destination and practice rail are removed.
2. **Narrow the vocabulary set — healthy.** Vocabulary is divided into 14 meaning-led groups plus a transparent catch-all group. Search works inside the selected group and exposes the result count.
3. **Inspect a term — healthy.** Available records show Kanji components, Hán Việt, On/Kun readings, confusion notes, reading traps, collocations, and synonyms through inline progressive disclosure.
4. **Practice — healthy.** The speaker control sits beside the term as a real speaker icon. Answer selection, correct/wrong feedback, structured meaning, and examples remain on one focused column.
5. **Review errors — healthy.** Incorrect items still enter Ôn sai; completing a session returns to the originating area.

## App coverage

| App | Initial dark state | Answer/detail state | Result |
| --- | --- | --- | --- |
| BJT Study | checked | checked | passed |
| N1 Grammar Exams | checked | checked | passed |
| N1 Grammar Flashcards | checked | flip surface reviewed | passed |
| N1 Grammar Sentence Order Drill | checked | choice surface reviewed | passed |
| N1 Grammar Sentence Order | checked | set menu reviewed | passed |
| N1 Kanji Analysis | checked | expanded reference pattern reviewed | passed |
| N1 Kanji & Collocations | checked | checked | passed |
| N1 Reading 75 | checked | checked | passed |
| N1 Reading 問題9 | checked | checked | passed |
| N1 Context Vocabulary | checked | checked | passed |
| N1 Vocabulary Exams | checked | dense reference grid reviewed | passed |
| N1 Vocabulary Paraphrase | checked | reference grid reviewed | passed |
| N1 Vocabulary Tabs | checked | reference grid reviewed | passed |

## Strengths

- Warm charcoal replaces pure black and every tested answer/detail state keeps the same dark surface language.
- Strong Japanese/Vietnamese typographic contrast makes scanning efficient without adding decorative noise.
- Correct, incorrect, active, hover, and focus states retain distinct meanings.
- Dense reference apps use constrained multi-column grids while quiz apps use a calmer single-task width.
- BJT progressive disclosure adds study depth without forcing every vocabulary row to become tall.

## Risks and follow-up

- The legacy apps intentionally retain different local layouts, so the suite is coherent in color and interaction but is not a single component system.
- 777 of 1,565 BJT terms receive at least partial Kanji-component data from the existing N1 source; 26 exact/normalized matches receive the full traps, collocations, and synonyms package. Missing records are not fabricated.
- Automated meaning rules place every term in a group, but 933 uncommon or highly abstract terms remain in `Khái niệm khác`. A future editorial pass can manually distribute these edge cases.
- Several legacy apps still use emoji inside old instructional copy. Replacing every emoji with one licensed icon family would improve suite-level icon consistency.

## Accessibility and evidence limits

- Keyboard focus styling, semantic buttons/headings, aria labels on the BJT speaker control, reduced-motion support, and dark-theme contrast were inspected.
- This was a visual and interaction audit, not a formal WCAG conformance certification or assistive-technology lab test.
- Speech output depends on the browser's Web Speech implementation and installed Japanese voices.

## Screenshot evidence

- BJT path: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-full-audit-20260721/bjt-path.png`
- BJT semantic groups: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-full-audit-20260721/bjt-vocab-groups-dark.png`
- BJT vocabulary insight: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-full-audit-20260721/bjt-vocab-insight-dark-detail.png`
- BJT speaker control: `/Users/thang/.codex/visualizations/2026/07/20/019f8080-13b9-77e0-bbce-852076c1b701/japanese-full-audit-20260721/bjt-practice-speaker-dark-final.png`
- Per-app initial and selected-answer screenshots are stored in the same audit directory.

final result: passed
