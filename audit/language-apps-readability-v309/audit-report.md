# Language app readability audit — v3.0.9

## Scope

- Surfaces: the 12 canonical Language app routes under `/apps/`.
- Fixed references: Home, the `/apps/` catalog, and the three Technical apps were not modified.
- Goal: make each app readable at desktop and mobile sizes while preserving its data, visual identity, and task flow.
- Viewports: 1440 × 900 desktop and 390 × 844 mobile.

## Findings

1. Four reference-style apps used four dense desktop columns, leaving descriptions, readings, examples, and supporting labels at roughly 9–13px.
2. Six quiz and reading apps had acceptable primary question text but undersized metadata, badges, controls, or explanation copy.
3. Grammar Flashcards inherited a 12px root from `reset.css`, shrinking its entire token-based type scale. Sentence Ordering also contained repeated sub-12px labels.
4. Grammar Flashcards attempted to bind `onclick` to a removed `flipBtn`, throwing a runtime exception before the card interaction was registered.

## Changes

- Added one shared, route-scoped readability layer: `css/language-app-readable.css`.
- Reduced Kanji Analysis, Vocabulary Tabs, Vocabulary Exams, and Vocabulary Paraphrase from four to three desktop columns, then two columns below 1000px and one below 680px.
- Established a 16px root and body baseline, with supporting labels at 12.5–13px and primary descriptions, answers, and explanations at 14px or larger.
- Increased the reading measure of quiz and reading apps without changing their content or behavior.
- Restored the token-based grammar app root scales and enlarged their controls.
- Removed the stale `flipBtn` binding so clicking a Grammar Flashcard works again.

## Measured results

| Route | Visible text below 12px before | After | Mobile overflow |
|---|---:|---:|---:|
| Kanji & Collocations | 6 | 0 | 0px |
| Kanji Analysis | 97 | 0 | 0px |
| Vocabulary Tabs | 708 | 0 | 0px |
| Vocabulary Exams | 843 | 0 | 0px |
| Vocabulary Context | 0 | 0 | 0px |
| Vocabulary Paraphrase | 431 | 0 | 0px |
| Grammar Flashcards | 10 | 0 | 0px |
| Grammar Exams | 11 | 0 | 0px |
| Grammar Sentence Order | 21 | 0 | 0px |
| Grammar Sentence Order Drill | 0 | 0 | 0px |
| Reading 75 | 0 | 0 | 0px |
| Reading Mondai 9 | 5 | 0 | 0px |

All counts exclude the shared global header and footer. Labels intentionally remain smaller than body copy, but none render below 12px in a visible app state.

## Interaction and validation

- One primary interaction passed on every route: quiz answer, filter, tab, flashcard flip, set selection, or reading choice as appropriate.
- No runtime exceptions remained in the 12-route interaction pass.
- All 12 pages remained exactly 390px wide in a 390px viewport.
- Static validation passed 32 HTML pages, 10 redirects, 18 sitemap URLs, social metadata, and all local references.
- `git diff --check` passed.

## Visual evidence

- `01-before-contact-sheet.jpg`
- `02-after-contact-sheet.jpg`
- `03-before-after-comparison.jpg`
- Individual captures are stored in `before/` and `after/`.

## Outcome

The Language collection now uses a consistent readable baseline inside every individual app, not only in the Apps catalog. Home and Technical surfaces remain unchanged.
