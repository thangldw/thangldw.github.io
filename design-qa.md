# Design QA — About hierarchy and resume-label refinement

- Original visual direction: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/source-option-3.png`
- User annotation truth: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/user-about-annotation.png`
- Same-viewport baseline: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-before.png`
- Implementation screenshot: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-annotation-desktop.png`
- Full-view comparison evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-annotation-comparison-full.jpg`
- Focused comparison evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-annotation-comparison-focused.jpg`
- Mobile evidence: `/Users/thang/Documents/thangldw.github.io/audit/resume-v3/about-annotation-mobile-390.png`
- Viewport: 1440 × 1024 desktop; 390 × 844 mobile
- State: home page, light theme

## Findings

- No remaining P0, P1, or P2 issues.
- The duplicated `Split profile resume` kicker and six-tag profile row were removed as annotated.
- The sidebar labels now read `What I Do` and `Working Languages`; the project heading now reads `Selected Work`, which is clearer and more portfolio-appropriate than `Roles`, `Languages`, and `Past Projects`.
- The language list contains English, 日本語, Tiếng Việt, and 中文 without inventing proficiency levels.
- The About section now uses one narrative flow plus three non-duplicative dimensions: industries, delivery scope, and maintainability.

## Required fidelity surfaces

- Fonts and typography: existing Space Grotesk and IBM Plex Mono hierarchy is preserved. The mobile headline was reduced to 36px and its hidden line-break whitespace was corrected so words never merge.
- Spacing and layout rhythm: removing the repeated tags reduces the About height while keeping `How I Work` and both selected-work rows visible in the desktop viewport. Sidebar dividers and section rhythm remain aligned.
- Colors and visual tokens: existing neutral surfaces, indigo accent, orange secondary accent, and light/dark tokens are unchanged.
- Image quality and asset fidelity: this screen uses no photographic assets; Font Awesome icons remain sharp and consistent with the selected direction.
- Copy and content: all repeated role/location/language tags were removed. Added copy describes delivery scope and working principles already supported by the resume content.

## Interaction and implementation checks

- Desktop and 390px mobile render without horizontal overflow.
- Theme and navigation implementation were not changed.
- Browser console errors: none.
- Static validation: all 32 HTML pages, 10 redirects, 18 sitemap URLs, social metadata, and local references pass.

## Comparison history

1. Baseline annotation: the top profile kicker and horizontal tag row duplicated sidebar content; generic section labels did not communicate portfolio intent.
2. Draft pass: replaced the tag row with a profile snapshot, then rejected it because it still repeated sidebar information.
3. Final fix: removed the duplicate snapshot entirely, kept only non-duplicative About context, renamed the three annotated headings, and expanded the working-language list.
4. Post-fix evidence: the same 1440 × 1024 comparison shows clearer hierarchy, lower density, and no layout regression. Mobile verification confirms no overflow or merged headline text.

## Follow-up polish

- No P3 follow-up is required for the annotated scope.

final result: passed
