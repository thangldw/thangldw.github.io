# JLPT N1 Design QA

- Source visual truth: `/Users/thang/.codex/generated_images/019f8080-13b9-77e0-bbce-852076c1b701/exec-4170e22f-8283-470b-9c68-c469aaba4090.png`
- Final implementation screenshot: `/tmp/jlpt-n1-design-qa/implementation-desktop-c.png`
- Combined comparison evidence: `/tmp/jlpt-n1-design-qa/source-vs-implementation-final.png`
- Mobile evidence: `/tmp/jlpt-n1-design-qa/implementation-mobile-final.png`
- Viewport: 1440 × 1024 desktop; 390 × 844 mobile
- State: dark theme, Vocabulary / Học kiến thức, two modules opened, Kanji Analysis current

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Typography: the implementation uses the existing system Japanese/Vietnamese font stack with comparable weight, size, line height, and editorial hierarchy. The title, mono eyebrow, navigation, and module labels preserve the source hierarchy without clipping.
- Spacing and layout: the fixed sidebar, split header, tabs, three module rows, support links, and exam row match the source composition. Thin dividers and flat surfaces are retained; no extra card nesting or elevation was introduced.
- Colors and tokens: the implementation maps the source to the repository's dark palette (`#11130f`, `#191b17`, `#30342d`, `#8e9cff`) and provides the existing warm light theme without pure-white panels.
- Image quality: the target contains no raster illustrations or photography. The thang. wordmark remains text as in the existing product, and all UI symbols use the repository's Font Awesome subset; no placeholder, inline SVG, emoji, or CSS illustration was substituted.
- Copy and content: all twelve existing N1 tools are represented under Vocabulary (6), Grammar (4), and Reading (2). Labels and descriptions are written for Vietnamese learners and existing routes remain unchanged.
- Responsive and accessibility: the 390 px viewport has no horizontal overflow, navigation labels do not wrap, the menu opens with a synchronized `aria-expanded` state, focus styles remain visible, and interactive rows use semantic links or buttons.

**Comparison History**

1. Initial implementation evidence: `/tmp/jlpt-n1-design-qa/implementation-desktop-b.png`.
   - [P2] The current module row lacked the explicit “Học tiếp” action visible in the source.
   - [P2] The primary header action stretched wider than the source, and the lead line was too long.
2. Fixes applied:
   - Added the visible current-module action while retaining the whole-row link target.
   - Constrained the primary action to 280 px on desktop and restored full width on mobile.
   - Reduced the lead measure to reproduce the source's readable wrap.
3. Post-fix evidence: `/tmp/jlpt-n1-design-qa/implementation-desktop-c.png` and combined comparison `/tmp/jlpt-n1-design-qa/source-vs-implementation-final.png`.
   - Earlier P2 findings are resolved.

**Primary Interactions Tested**

- Switched between Vocabulary, Grammar, and Roadmap views.
- Switched Grammar to the practice tab and confirmed two module rows.
- Opened legacy module routes and confirmed hub progress updates after returning.
- Switched light/dark themes and confirmed warm light background and dark default.
- Opened the mobile navigation and confirmed 390 px layout without horizontal overflow.
- Checked browser logs on the JLPT N1 page and Learning Programs catalog: no errors.

**Follow-up Polish**

- [P3] Hub progress intentionally measures modules opened rather than attempting to merge incompatible legacy score formats. A later data-normalization pass can provide item-level cross-module accuracy.
- [P3] The Learning Programs grid intentionally keeps a third desktop column available for G検定, AWS Cloud, or FP3級.

**Implementation Checklist**

- [x] Match selected dark visual direction.
- [x] Preserve all twelve legacy routes.
- [x] Provide working navigation, tabs, theme controls, and mobile menu.
- [x] Consolidate the Apps catalog to one JLPT N1 program entry.
- [x] Verify desktop and mobile in the browser.

final result: passed
