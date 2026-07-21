# Design QA — thangldw.github.io

Tài liệu này là release gate cấp repository. Chi tiết từng chương trình học nằm trong:

- [JLPT N1 Design QA](apps/jlpt-n1/design-qa.md)
- [BJT Study Design QA](apps/bjt-study/design-qa.md)
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
