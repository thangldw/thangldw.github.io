# Proofline landing page design QA

Final result: passed for release of the native landing page.

Selected reference: third displayed Product Design image, four-stage horizontal story. Compared with rendered 1440px desktop screenshot. The shared logo, controls, Inter, type scale, #F6F5F1 palette and spacing follow DESIGN.md and canonical CSS ownership. Route CSS defines composition, not another token owner. Native HTML architecture retained without adding a frontend runtime.

Intentional content correction: the generated image used a SQLite/PostgreSQL example. The implemented story uses the actual synthetic requirement change in proofline/stale_decision_demo.py: acknowledged work must not be lost → may be lost during a process crash, lines 42–48. Excerpts and states are explicitly illustrative, not recorded CLI output. No customer usage, benchmark or source-truth claims. Main inspected at 264fb00; latest published release is v2.0.2.

Verification executed:
- scripts/validate_site.py: 94 pages and local references passed.
- scripts/validate_design_system.py: canonical design ownership passed.
- node --check js/proofline.mjs: passed.
- Browser: source installation commands; example verification invocation; keyboard details toggle; EN/VI/JA/ZH with no empty translated labels; light/dark; Copy success; 390px viewport without horizontal overflow; console errors empty.
- Typography, spacing, colors, source excerpts and vector connector appearance reviewed against selected image and Awesome Maintainer Defense sibling.

Premium static audit: full-repository scan stopped after 2m29s; scoped route scan completed. It reports 13 actionless-button errors because the static parser does not follow external addEventListener handlers. These controls have handlers and were exercised in-browser. The strict audit did not pass; these are documented static false positives, with no inline handler or audit exclusion workaround.

Limits: local Chromium verification, not physical-device or full cross-browser certification. Package installation and demo CLI were not executed for this landing-page release. The source excerpts were checked against project implementation and release documentation. Desktop artifacts remain experimental, and the product scope remains one local user.
