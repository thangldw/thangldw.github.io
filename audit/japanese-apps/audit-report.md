# Japanese study apps — UI audit

## Scope

Representative screens from Grammar, Kanji Analysis, Reading, and Sentence Ordering. Goal: improve cross-app readability and visual consistency without changing learning behavior.

## Findings

1. Typography varied between Inter, JetBrains Mono, browser defaults, Vietnamese text, and Japanese glyph fallbacks. This produced visibly uneven character weight and line height.
2. Header typography, spacing, and navigation did not match the current portfolio Home page. Obsolete Approach and Contact links were still present.
3. Small control text and dense filter rows were readable but visually fragile, particularly where Japanese and Vietnamese appear together.
4. Focus visibility depended on each app, so keyboard users did not receive a consistent interaction cue.
5. The legacy script could inject a secondary “Built by Thang Luu · Tokyo” footer, conflicting with the shared portfolio footer.

## Changes applied

- Standardized the shared stack to Space Grotesk + Noto Sans JP, with IBM Plex Mono for footer/brand labels.
- Set a 15px readable body baseline, 1.65 line height, consistent heading rhythm, and a 14px minimum for form controls.
- Added consistent accent-colored focus rings and selection color.
- Aligned the shared app header with Home: About, Apps, Stack, 75px desktop height, 65px mobile height, matching gutters and indigo accent.
- Removed the legacy footer-injection code and retained only the shared Home footer.

## Evidence limits

Screenshots support visual hierarchy, density, color, and obvious contrast observations. Full WCAG compliance, keyboard order, screen-reader output, and every quiz state require a separate interaction-level accessibility test.
