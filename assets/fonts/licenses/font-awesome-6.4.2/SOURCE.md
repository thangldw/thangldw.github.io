# Font Awesome subset source

| Field | Value |
| --- | --- |
| Product | Font Awesome Free 6.4.2 |
| Files | `../../fa-solid-subset.woff2`, `../../fa-brands-subset.woff2` |
| Upstream release | <https://github.com/FortAwesome/Font-Awesome/tree/6.4.2> |
| License summary | <https://fontawesome.com/license/free> |
| Fonts | SIL Open Font License 1.1 |
| Icons | Creative Commons Attribution 4.0 International |
| CSS/code | MIT |
| Local use | Self-hosted subset declared by `css/icons.css` |
| Subsetting recipe | Solid: `fontTools.subset` over upstream `fa-solid-900.woff2` (npm `@fortawesome/fontawesome-free@6.4.2`) with the code points declared in `css/icons.css`, no layout features, WOFF2 output. Brands: not present in the repository; provenance is partial |

Local file hashes:

| File | SHA-256 |
| --- | --- |
| `fa-solid-subset.woff2` | `628ec62d92059067543feda70a4e14a97da1fd894ab82219820db56c5cf9d773` |
| `fa-brands-subset.woff2` | `cb0823497afcbe1795d269b1bbb189889136eddce9d69f6bef1e37de526372b7` |

`OFL.txt` preserves the font license and reserved font name. `LICENSE.txt`
preserves the upstream component-level license summary, including the CC BY
4.0 terms for icon artwork and the MIT terms for code.
