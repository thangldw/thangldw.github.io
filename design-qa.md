# Design QA — thangldw.github.io

Tài liệu này là release gate cấp repository. Chi tiết từng chương trình học nằm trong:

- [JLPT N1 Design QA](apps/jlpt-n1/design-qa.md)
- [BJT Study Design QA](apps/bjt-study/design-qa.md)
- [G検定 Study Design QA](apps/gkentei/design-qa.md)
- [Japanese Learning Apps Audit](japanese-app-audit.md)

## Mô hình QA

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Inter, Arial, sans-serif","lineColor":"#667085","primaryTextColor":"#172B4D"}}}%%
flowchart LR
  Change(["Thay đổi code / data"]) --> Static["Syntax & validator"]
  Static --> Visual["Desktop · mobile · theme"]
  Visual --> Interaction["Happy path · error · timeout"]
  Interaction --> Data["Persistence · reload · export"]
  Data --> Gate{"Không còn lỗi P0–P2?"}
  Gate -->|"Chưa"| Fix["Refactor và kiểm tra lại"]
  Fix --> Static
  Gate -->|"Đạt"| Diff["Đọc toàn bộ diff"]
  Diff --> Publish(["Commit · push · Pages"])

  classDef yellow fill:#FFF2B2,stroke:#B7791F,color:#3B2F00,stroke-width:1px;
  classDef blue fill:#D9E8FF,stroke:#4262FF,color:#172B4D,stroke-width:1px;
  classDef green fill:#DDF5E7,stroke:#238653,color:#153B29,stroke-width:1px;
  classDef pink fill:#FFE0EC,stroke:#C94F7C,color:#4A1730,stroke-width:1px;
  class Change yellow;
  class Static,Visual,Interaction,Data,Diff blue;
  class Gate,Fix pink;
  class Publish green;
```

## Trạng thái hiện tại

| Phạm vi | Desktop | Mobile | Dark mode | Dữ liệu | Kết quả |
|---|---:|---:|---:|---:|---|
| Trang chủ và catalog | Đạt | Đạt | Đạt | Không áp dụng | Đạt |
| JLPT N1 hub | Đạt | Đạt | Đạt | IndexedDB | Đạt |
| BJT Study | Đạt | Đạt | Đạt | IndexedDB | Đạt |
| G検定 Study | Đạt | Đạt | Đạt | IndexedDB · 900 câu | Đạt |
| 12 app JLPT con | Đạt | Đạt | Đạt | Adapter riêng | Đạt, cần hợp nhất lịch sử |
| Redirect compatibility | Đạt | Đạt | Không áp dụng | Không áp dụng | Đạt |

## Design contract dùng chung

- Canvas sáng là warm paper; canvas tối là warm charcoal.
- Orange biểu thị active/action trong learning apps; màu xanh chỉ giữ vai trò brand.
- Sidebar desktop và mobile dùng cùng thứ tự điều hướng, spacing và trạng thái focus.
- Answer, feedback và explanation không được quay về nền trắng lạnh trong dark mode.
- Nội dung từ vựng tách `Từ vựng`, `Cách đọc`, `Âm Hán Việt`, `Ý nghĩa`, `Ví dụ`.
- Nội dung ngữ pháp tách `Mẫu câu`, `Ý nghĩa`, `Giải thích tiếng Việt`, `Ví dụ`, `Bản dịch`.
- Luyện tập hiển thị câu hiện tại, đúng/tổng, timer và trạng thái hết giờ.
- Mọi control phải có focus-visible, nhãn truy cập được và không phụ thuộc duy nhất vào màu.

## Release checklist

### Code và repository

- [ ] Không còn code chết, duplicate module hoặc debug log.
- [ ] Không commit cache, file tạm, ảnh bằng chứng ngoài repository hoặc secret.
- [ ] File mới có consumer rõ ràng; asset cũ không còn dùng phải được xóa.
- [ ] `git diff --check` không báo lỗi.
- [ ] `git status --short` chỉ chứa thay đổi thuộc phạm vi release.

### Chức năng

- [ ] Happy path hoàn tất từ điểm vào đến kết quả.
- [ ] Empty, wrong-answer, timeout và reload state hoạt động.
- [ ] Dữ liệu mới tồn tại sau reload.
- [ ] Export/import được kiểm tra khi schema thay đổi.

### Giao diện

- [ ] Desktop và mobile không có horizontal overflow.
- [ ] Light/dark theme có độ tương phản và surface nhất quán.
- [ ] Text Nhật–Việt không bị cắt, tràn hoặc lẫn trường dữ liệu.
- [ ] Keyboard focus và reduced-motion vẫn hoạt động.

### Phát hành

- [ ] Chạy `python3 scripts/validate_site.py`.
- [ ] Chạy syntax check cho JavaScript đã thay đổi.
- [ ] Đọc toàn bộ diff trước commit.
- [ ] GitHub Pages deployment hoàn tất thành công.
- [ ] Kiểm tra URL live tải đúng version asset mới.

## Chính sách bằng chứng

- Không ghi đường dẫn `/tmp`, clipboard hoặc ảnh nằm ngoài repository vào báo cáo dài hạn.
- Ảnh tạm chỉ dùng trong phiên QA và có thể xóa sau khi kết luận.
- Báo cáo giữ lại viewport, state, bước tái hiện, kết quả và giới hạn kiểm tra.
- Nếu cần bằng chứng lâu dài, asset phải được đặt trong thư mục tài liệu của repository và có liên kết tương đối.

## Mức độ lỗi

| Mức | Ý nghĩa | Release gate |
|---|---|---|
| P0 | Mất dữ liệu, không mở được app hoặc lỗi bảo mật nghiêm trọng | Chặn release |
| P1 | Luồng chính không hoàn thành hoặc sai kết quả | Chặn release |
| P2 | Lỗi responsive, accessibility hoặc state quan trọng | Chặn release |
| P3 | Khác biệt polish không làm hỏng tác vụ | Ghi nhận và lên lịch |

## Kiểm tra hồi quy sidebar theme — 2026-07-21

- **Source visual truth:** ba ảnh sidebar JLPT N1 và BJT do người dùng cung cấp trong task hiện tại; ảnh nguồn không được lưu vào repository theo chính sách bằng chứng.
- **Implementation screenshot:** browser capture tạm thời của [`/apps/jlpt-n1/`](https://thangldw.github.io/apps/jlpt-n1/) và [`/apps/bjt-study/`](https://thangldw.github.io/apps/bjt-study/); ảnh kiểm thử không được commit.
- **Viewport:** 1280 × 800 và 390 × 844, device pixel ratio 2; đối chiếu tập trung vào sidebar desktop 240 px và header mobile.
- **State:** light và dark; theme toggle đã được kích hoạt theo cả hai chiều.
- **Primary interactions tested:** light → dark, dark → light, cập nhật icon, nhãn truy cập và lưu theme dùng chung.
- **Console:** không có warning hoặc error trên hai route.

### Full-view và focused-region comparison

- Full view giữ nguyên cấu trúc, typography, khoảng cách, icon, active state và nội dung hiện có.
- Focused region xác nhận sidebar light, canvas, workspace và nút theme cùng nhận `rgb(251, 250, 246)` (`#fbfaf6`).
- Dark mode vẫn dùng các token charcoal riêng; không bị `#fbfaf6` hoặc selector light ghi đè.
- Mỗi sidebar chỉ còn một nút theme 38 × 38 px cạnh logo, không có text hiển thị; icon và `aria-label` diễn đạt theme đích.
- Không có image asset mới; logo và icon tiếp tục dùng asset/font icon hiện hữu.

### Comparison history

1. **P1 — nền sidebar không đồng nhất:** JLPT pha `--n1-bg` với black; BJT dùng `--bjt-rail: #ebe7de`. Đã đổi JLPT sang `var(--n1-bg)` và BJT light rail sang `#fbfaf6`.
2. **P2 — điều khiển theme trùng chức năng:** mỗi sidebar có hai nút kèm chữ. Đã hợp nhất thành một icon button, xóa selector và listener `data-theme-choice` cũ.
3. **Post-fix evidence:** computed styles của `html`, `body`, sidebar, workspace và theme button đã được đọc sau cascade; light đồng nhất `rgb(251, 250, 246)`, dark giữ đúng token riêng, legacy control count bằng 0.
4. **P2 — theme button cách xa nhận diện thương hiệu:** control từng nằm dưới footer. Đã chuyển vào `.sidebar-head`, đặt cạnh `thang.`, đồng thời nhóm với mobile menu bằng `.sidebar-actions`.
5. **Post-move evidence:** desktop xác nhận button nằm trọn trong header, cao hơn footer và không gây overflow; mobile xác nhận theme button và menu cùng hiển thị, cách nhau 8 px, không chồng lấn.

### Required fidelity surfaces

- **Fonts and typography:** không thay đổi; không phát sinh wrap hoặc clipping mới.
- **Spacing and layout rhythm:** footer thoáng hơn; control 38 px nằm ở mép phải header, cạnh logo và cách mobile menu 8 px.
- **Colors and visual tokens:** light background thống nhất `#fbfaf6`; dark token không đổi.
- **Image quality and asset fidelity:** không thêm hoặc thay image asset.
- **Copy and content:** bỏ chữ Sáng/Tối khỏi bề mặt; giữ nhãn tiếng Việt cho assistive technology.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi thay đổi.

**Follow-up polish:** không có.

**final result: passed**

## Roadmap grid — G検定 và JLPT N1 — 2026-07-22

- **Source visual truth:** bản live trước thay đổi tại `/apps/gkentei/` và `/apps/jlpt-n1/#path`; source và implementation local được capture trong cùng comparison input.
- **Implementation:** G検定 có 11 thẻ syllabus; JLPT N1 có ba thẻ trụ cột. Desktop dùng hai cột, 820 px trở xuống dùng một cột.
- **Viewport/state:** 1280 × 720 light/dark, 680 × 900 và 390 × 844; state chưa học và đang học; sidebar desktop/mobile.
- **Focused evidence:** mỗi card giữ số thứ tự, title, trạng thái, count và progressbar; native full-view đủ rõ nên không cần crop bổ sung.
- **Responsive evidence:** ở 390 và 680 px, computed grid là một cột và document `scrollWidth` bằng viewport cho cả hai app.
- **Interaction evidence:** G検定 card 01 mở đúng `出題分野`; JLPT card `Từ vựng N1` chuyển đúng `#vocabulary`; dark/light không đổi token.
- **Static gates:** UI Standard 1.1, site validator, JavaScript syntax và whitespace diff là release gate.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi roadmap grid.

**Follow-up polish:** P3 — theo dõi mật độ khi JLPT bổ sung trụ cột thứ tư.

**final result: passed**

## G検定 Study Program — 2026-07-22

- **Source visual truth:** màn hình luyện tập của `/apps/jlpt-n1/`, ảnh lỗi do người dùng cung cấp và `JDLA_G検定シラバス2024_v1.4.pdf`; ảnh tạm không được commit.
- **Implementation:** route `/apps/gkentei/`, catalog và sitemap; chi tiết tại [G検定 Design QA](apps/gkentei/design-qa.md).
- **Viewport/state:** 390, 680, 1280 và 1440 px; light/dark; desktop/mobile; roadmap, topic guide, example quiz, feedback, timeout, statistics và mock exam 145 câu/120 phút.
- **Interaction evidence:** 11 topic dùng thuật ngữ Nhật, difficulty là `基礎`/`標準`/`応用`; mở例題, trả lời và quay lại topic đúng; giải thích chỉ hiện song ngữ Nhật–Việt sau lựa chọn.
- **Focused fixes:** bỏ border lồng trong search; thay ngân hàng câu hỏi bằng topic/điểm cần nhớ/keyword/例題; Nhật hóa toàn UI; đặt metric, CTA và focus accent thành `var(--accent, #c84d24)`.
- **Data evidence:** 900 record, 495 keyword, 11 category và ba difficulty đạt audit schema/consistency tự động; không phát hiện duplicate xung đột.
- **Static gates:** UI Standard 1.1, site validator, JavaScript syntax và whitespace diff đều đạt.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động.

**Follow-up polish:** P3 — factual review thủ công toàn bộ ngân hàng câu hỏi bởi chuyên gia JDLA nằm ngoài phạm vi kiểm tra tự động hiện tại.

**final result: passed**

## Touch targets và UI Standard 1.1 — 2026-07-22

- **VI:** Rà lại toàn bộ 22 route canonical và trang 404 sau các lỗi control nhỏ, cascade và CSS trùng.
- **EN:** Re-audited all 22 canonical routes plus the 404 page after fixing undersized controls, cascade conflicts and duplicate CSS.
- **JA:** 小さすぎる操作部品、cascade の競合、重複 CSS を修正後、22 canonical route と 404 ページを再監査。
- **Source visual truth:** ảnh mobile trước sửa của Vocabulary Paraphrase, Grammar Exams và KakeFlow từ vòng regression audit ngay trước thay đổi.
- **Viewport matrix:** 390, 680, 1280 và 1440 px; light và dark cho mọi route hỗ trợ theme. KakeFlow giữ light-only theo ngoại lệ standalone đã ghi trong ledger.

### Findings and fixes / Kết quả / 結果

1. Vocabulary Paraphrase: 72 nút `Nghe` từ 19.5 px lên 34 px, radius 8 px; bỏ style/event inline ở component và thêm accessible name theo từng từ.
2. Grammar Exams: toàn bộ year filter từ 27.1 px lên 34 px; giữ layout wrap và active state hiện có.
3. KakeFlow: mobile menu từ 31 px lên 34 px; không đổi bố cục hoặc visual hierarchy.
4. Header mobile, Apps catalog theme control, home project carousel và Leaflet zoom đều đạt ngưỡng compact 34 px.
5. Vocabulary Tabs đã hợp nhất ba định nghĩa PTU lặp thành một nguồn CSS duy nhất.
6. UI Standard nâng lên 1.1; ledger cục bộ chặn tăng `<style>`, `style=`, inline event handler và button thiếu `type` trên trang cũ, đồng thời đặt ngân sách bằng 0 cho trang mới.

### Verification / Xác minh / 検証

- 184 browser checks: 23 pages × 4 viewport × 2 theme; zero horizontal overflow, zero broken images, zero visible control dưới 34 px và zero theme mismatch ngoài ngoại lệ KakeFlow.
- Focused computed styles: speech control 34 px / 8 px radius; Grammar year button 34 px / 8 px radius; KakeFlow menu 34 px / 8 px radius.
- Before/after screenshots were compared together at the same 390 × 844 viewport; hierarchy, typography, colors and responsive flow remained stable while the target areas became easier to operate.
- Runtime console: không có warning hoặc error trong phiên QA cuối.
- Static gates: UI standards 23/23 pages, site validator 37 HTML pages / 14 redirects / 22 sitemap URLs, JavaScript syntax và `git diff --check` đều đạt.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi audit này.

**Follow-up polish:** legacy debt đã được đóng băng trong ledger và chỉ được phép giảm ở các lần chỉnh sửa sau.

**final result: passed**

## Làm sáng nhóm Động từ ghép — 2026-07-22

- **Source visual truth:** ảnh chụp tab `Động từ ghép` do người dùng cung cấp trong task hiện tại; ảnh nguồn không được lưu vào repository.
- **Implementation screenshot:** browser capture tạm thời sau sửa; ảnh kiểm thử không được commit.
- **Viewport:** 2048 × 982, cùng kích thước với ảnh nguồn.
- **State:** tab `Động từ ghép`, light và dark theme; 22 nhóm dữ liệu đã render.
- **Primary interactions tested:** chuyển tab, mở nhóm bằng click, đóng nhóm bằng phím Enter và đổi theme.

### Full-view và focused-region comparison

- Màu nền navy cũ `#1e2240` trong light mode đã được thay bằng accent surface `#eef0ff`; chữ chính dùng `#4657d8`, mô tả dùng body token và badge dùng lớp nền có độ tương phản nhẹ.
- Dark mode dùng `--portfolio-accent-soft` riêng (`#202844`), không nhận màu light và không quay lại hard-coded navy.
- Kích thước hàng 58 px, radius 12 px, khoảng cách nội dung và chiều rộng danh sách được giữ nguyên; trang không phát sinh horizontal overflow.
- Markup render động đã bỏ inline color/style cho header và bảng, chuyển sang các class `dtg-*` để CSS theme kiểm soát nhất quán.

### Comparison history

1. **P2 — surface quá tối trong light mode:** 22 accordion header dùng trực tiếp `#1e2240`, tạo khối màu nặng hơn phần còn lại của trang.
2. **Fix:** chuyển header sang design tokens, dùng nền indigo nhạt, chữ accent và count pill cùng hệ màu.
3. **Post-fix evidence:** computed light background `rgb(238, 240, 255)`; dark background `rgb(32, 40, 68)`; radius 12 px; không overflow.
4. **Interaction evidence:** click đổi `aria-expanded` thành `true` và hiển thị bảng; Enter đổi lại `false` và đóng bảng.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi thay màu nhóm Động từ ghép.

**Follow-up polish:** không có.

**final result: passed**

## Chuẩn hóa bo góc button học tiếng Nhật — 2026-07-22

- **Source visual truth:** `/Users/thang/Desktop/Screenshot 2026-07-22 at 0.09.09.png` (light) và `/Users/thang/Desktop/Screenshot 2026-07-22 at 0.09.15.png` (dark).
- **Implementation screenshots:** `/Users/thang/.codex/visualizations/2026/07/21/019f8268-aa28-7a12-8266-e5c88cfbd36c/japanese-button-radius-2026-07-22/`.
- **Viewport:** 390 × 844 cho JLPT/BJT mobile; 1440 × 900 cho app JLPT độc lập.
- **State:** light và dark; menu đóng/mở; quiz setup; quiz có bốn đáp án.
- **Primary interactions tested:** đổi theme, mở menu mobile, chuyển sang Luyện tập, bắt đầu lượt 10 câu và render answer choices.
- **Console:** không có warning hoặc error trong luồng JLPT/BJT sau thay đổi.

### Full-view và focused-region comparison

- Hai ảnh nguồn tập trung vào silhouette của icon button: khối vuông bo góc vừa phải, viền mảnh, nền theo theme và không có chữ.
- JLPT/BJT sau sửa dùng theme button 38 × 38 px với radius 10 px; app JLPT độc lập dùng shared theme button 34 × 34 px với radius 8 px. Tỷ lệ bo góc, border và icon placement khớp visual intent của ảnh nguồn.
- Full view của JLPT/BJT ở 390 × 844 xác nhận header, CTA và đáp án không bị lệch hoặc tràn ngang.
- Full view Grammar Exams ở 1440 × 900 xác nhận tab, period/year filters, speech controls và answer options đều nhận radius tối thiểu 8 px.
- Focused comparison không cần crop bổ sung: ảnh nguồn chỉ chứa component theme button và component này hiển thị rõ ở native viewport trong capture JLPT/BJT; computed style xác nhận chính xác kích thước và radius.

### Comparison history

1. **P1 — control language không đồng nhất:** JLPT/BJT có nhiều button radius 0 hoặc 4 px trong khi shared header đã bo 8 px. Đã thêm token control 8 px, option 10 px và icon control 10 px.
2. **P2 — app JLPT con vẫn bị rule legacy ép vuông:** shared design system có các override 0–4 px. Đã thêm lớp override cuối trong `language-app-readable.css`, đồng thời tách các nút Sentence Ordering khỏi grid sát cạnh để radius hiển thị đúng.
3. **Post-fix evidence:** audit 14 route học tiếng Nhật, từ 1 đến 124 visible buttons mỗi route; radius nhỏ nhất là 8 px, không còn visible button dưới 7.5 px và không route nào horizontal overflow.
4. **Post-fix interaction evidence:** JLPT quiz size/answer lần lượt 10 px/10 px; BJT practice size/answer 10 px/10 px; primary action của cả hai là 8 px.

### Required fidelity surfaces

- **Fonts and typography:** không thay đổi family, weight, line-height hoặc wrapping.
- **Spacing and layout rhythm:** giữ nguyên kích thước/tap target; chỉ Sentence Ordering thêm gap 8 px để button bo góc không dính nhau.
- **Colors and visual tokens:** giữ nguyên warm paper, charcoal, orange active và semantic success/error.
- **Image quality and asset fidelity:** không có image asset mới; icon hiện hữu được giữ nguyên.
- **Copy and content:** không thay đổi nội dung học tập hoặc nhãn truy cập.
- **Responsiveness and accessibility:** 14 route không tràn ngang ở 390 px; focus-visible và semantics button giữ nguyên.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi bo góc button.

**Follow-up polish:** P3 — có thể chuẩn hóa radius của card không tương tác trong một vòng thiết kế riêng; không thuộc yêu cầu button hiện tại.

**final result: passed**

## Full HTML/CSS governance audit — 2026-07-22

- **VI:** Rà soát toàn bộ 22 route canonical và trang 404; kiểm tra HTML source, DOM sau render, CSS cascade, theme, overflow, control và tab semantics.
- **EN:** Audited all 22 canonical routes plus the 404 page across source HTML, rendered DOM, CSS cascade, themes, overflow, controls and tab semantics.
- **JA:** 22 の canonical route と 404 ページを対象に、HTML、描画後 DOM、CSS cascade、theme、overflow、control、tab semantics を監査。

### Findings and fixes / Kết quả / 結果

1. Added exactly one semantic `main` to ten legacy learning pages without changing their nested layout.
2. Replaced two visual title wrappers with real `h1` elements and added no-script `h1` fallbacks to the JLPT/BJT dynamic hubs.
3. Completed tab semantics for Data Copilot, JLPT, BJT, Vocabulary Tabs and Paraphrase: named tablists, selected state, controls/panel linkage, keyboard navigation and roving tabindex.
4. Added accessible names to Data Copilot's icon query action and SQL/plain-language inputs.
5. Established [UI Standard 1.0](UI-STANDARDS.md) and a release-blocking local audit at `scripts/audit_ui_standards.py`; `scripts/validate_site.py` invokes the same contract.

### Evidence / Bằng chứng / 証跡

- In-app browser viewport: 1280 × 720, device pixel ratio 2.
- No document-level horizontal overflow on any canonical route.
- Every route renders one `main` and one `h1`; all role-based tabs expose complete `aria-selected`, `aria-controls` and `aria-labelledby` linkage after render.
- Source screenshots were captured during this QA run but remain temporary and are not committed under the repository evidence policy.
- Automated gate: 23 public pages pass UI Standard 1.0.

**Evidence limits:** the audit validates semantics, DOM/computed CSS and representative visual states; it does not replace manual VoiceOver testing on physical devices.

**final result: passed**

## Audit control, typography và responsive toàn project — 2026-07-22

- **Phạm vi:** 21 route chính trong sitemap, gồm catalog, JLPT/BJT, 12 app học tiếng Nhật và các app dữ liệu/kỹ thuật.
- **Bằng chứng tạm:** `/Users/thang/.codex/visualizations/2026/07/21/019f8268-aa28-7a12-8266-e5c88cfbd36c/project-ui-audit-2026-07-22/`.
- **Viewport:** 1440 × 900 và 390 × 844.
- **State:** light và dark; kiểm tra computed cascade cho nền, chữ, border và active state.
- **Tương tác chính:** đổi theme, mở JLPT/BJT subject, chuyển tab, mở lịch sử và render danh sách từ vựng.

### Kết quả và thay đổi

1. **P2 — tab active dùng underline cũ:** `n1-vocabulary-tabs`, JLPT và BJT trộn underline với button bo góc. Đã chuyển thành bordered tab 8 px, bỏ margin âm và pseudo underline.
2. **P2 — module link và icon còn vuông:** hàng module JLPT/BJT đã trở thành surface tương tác 10 px; icon bên trong cũng dùng 10 px.
3. **P2 — “Tiến bộ BJT” siết dấu tiếng Việt:** heading lịch sử dùng tracking `-.055em` và line-height `.98`. Đã cố định system sans, tracking `-.025em`, line-height `1.05` và weight 700.
4. **P3 — control 0–7 px rải rác:** input, select, CTA, filter và theme control trong app dữ liệu, NamiQuant và Kakeflow đã thống nhất tối thiểu 8 px; answer option giữ 10 px.
5. **P3 — Leaflet zoom nhìn vuông:** wrapper zoom dùng radius 8 px và `overflow: hidden`; đường phân cách giữa hai nút vẫn giữ để thể hiện segmented control.

### Verification

- 21/21 route không có horizontal document overflow ở cả hai viewport.
- Không còn decorated control độc lập dưới 8 px; cạnh trong của segmented Leaflet zoom là ngoại lệ có chủ đích, wrapper ngoài 8 px.
- Dark state của Vocabulary Tabs: body `rgb(17, 19, 15)`, card `rgb(25, 27, 23)`, active tab radius 8 px; không có màu light ghi đè.
- Mobile JLPT: tab 8 px, module row/icon 10 px, không clipping hoặc overflow.
- `python3 scripts/validate_site.py`: 37 HTML pages, 14 redirects, 22 sitemap URLs và toàn bộ local references hợp lệ.

**Evidence limits:** screenshot không chứng minh đầy đủ WCAG; semantics, focus-visible và kích thước control được kiểm tra từ DOM/computed style, nhưng screen reader thực tế chưa được chạy.

**final result: passed**
