# BJT Study Design QA

- Desktop Vocabulary evidence: `/tmp/jlpt-n1-bjt-refinement-qa/bjt-vocabulary.png`
- Desktop quiz evidence: `/tmp/jlpt-n1-bjt-refinement-qa/bjt-quiz.png`
- Mobile setup evidence: `/tmp/jlpt-n1-bjt-refinement-qa/bjt-mobile.png`
- Cross-app sidebar comparison: `/tmp/jlpt-n1-bjt-refinement-qa/sidebar-consistency.png`
- Viewports: 1440 × 1024 desktop; 390 × 844 mobile

## Findings

- No actionable P0, P1, or P2 differences remain.
- Vocabulary and Grammar now share the JLPT N1 information architecture: Học kiến thức, Luyện theo dạng, and Luyện tập.
- The existing full vocabulary and grammar databases remain available through the Knowledge module and retain search, meaning groups, Kanji analysis, Vietnamese explanations, examples, and single-item practice.
- All BJT wording now describes this flow as practice, not an official exam or exam simulation.
- Practice can be scoped to Vocabulary, Grammar, or a mixed set and supports 5, 10, or 20 questions.
- The 30-second timer auto-submits an unanswered question, records it for review, and shows the existing detailed explanation.
- Desktop and mobile sidebars follow the same component pattern as JLPT N1. At 390 px there is no horizontal overflow.
- Browser console logs were empty during desktop and mobile interaction checks.

## Interactions Tested

- Opened Vocabulary and Grammar subject hubs and switched all three tabs.
- Opened the existing database from the Knowledge module and returned to the subject hub.
- Opened Grammar practice, selected 5 questions, and started the timed session.
- Allowed a mixed BJT question to reach 0 seconds and confirmed it was marked “Hết 30 giây” and added to review.
- Opened and closed the mobile navigation and confirmed `scrollWidth === innerWidth`.

## Score Counter Follow-up

- Desktop before/after evidence: `/tmp/practice-score-count-qa/bjt-before-after.png`
- Mobile evidence: `/tmp/practice-score-count-qa/bjt-mobile.png`
- The practice header now displays `Đúng {score} / {total}` beside the review count and updates immediately after a correct answer.
- The completion summary also reports `{score} / {total}` as the number of correct answers.
- Verified the counter at 1440 px and 390 px with no overlap or horizontal overflow.
- Browser console logs remained empty. A separate focused-region capture was unnecessary because the counter is legible in the full-view comparison.

final result: passed
