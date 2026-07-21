# JLPT N1 Design QA

- User reference: `/var/folders/sm/d8hb2_5s40965vv4h1zxl_xc0000gn/T/codex-clipboard-d15b4ca9-4b54-4e80-ab1a-4b6e56f78ed7.png`
- Final desktop evidence: `/tmp/jlpt-n1-bjt-refinement-qa/jlpt-n1-final.png`
- Final quiz evidence: `/tmp/jlpt-n1-bjt-refinement-qa/jlpt-n1-quiz.png`
- Final mobile evidence: `/tmp/jlpt-n1-bjt-refinement-qa/jlpt-n1-mobile.png`
- Combined reference comparison: `/tmp/jlpt-n1-bjt-refinement-qa/reference-vs-final.png`
- Cross-app sidebar comparison: `/tmp/jlpt-n1-bjt-refinement-qa/sidebar-consistency.png`
- Viewports: 1440 × 1024 desktop; 390 × 844 mobile
- State: dark theme, Vocabulary / Knowledge and active quiz feedback

## Findings

- No actionable P0, P1, or P2 differences remain.
- The former blue interaction color is replaced by the BJT orange system. Blue is limited to the shared `thang.` brand mark.
- The JLPT N1 sidebar now uses the same width, spacing, active-state indicator, row height, footer pattern, theme control, and mobile collapse behavior as BJT.
- The duplicate Vocabulary “Luyện theo dạng” support block and repeated exam row are removed. Each tab now owns its content without repetition.
- The Luyện đề header and action area now have one meaningful divider instead of two empty horizontal rules.
- The new quiz setup supports 5, 10, or 20 questions. Each question has a working 30-second timer, immediate feedback, and a Vietnamese explanation.
- At 390 px there is no horizontal overflow. The quiz rules, size controls, timer, answer buttons, and collapsed navigation remain readable and operable.
- Browser console logs were empty during desktop and mobile interaction checks.

## Interactions Tested

- Switched Vocabulary tabs and confirmed only the selected module group is rendered.
- Opened the Luyện đề view and confirmed the duplicate divider is removed.
- Selected 5 questions, started a quiz, chose an incorrect answer, and continued to the next question.
- Allowed a question to reach 0 seconds and confirmed automatic “Hết 30 giây” feedback.
- Opened the mobile layout at 390 × 844 and confirmed `scrollWidth === innerWidth`.

## Score Counter Follow-up

- Desktop before/after evidence: `/tmp/practice-score-count-qa/jlpt-before-after.png`
- Mobile evidence: `/tmp/practice-score-count-qa/jlpt-mobile.png`
- The active quiz now displays `Đúng {score} / {total}` and updates immediately after a correct answer.
- Verified the counter at 1440 px and 390 px with no overlap or horizontal overflow.
- Browser console logs remained empty. A separate focused-region capture was unnecessary because the counter is legible in the full-view comparison.

final result: passed
