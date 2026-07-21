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

- **Source visual truth:** hai ảnh sidebar JLPT N1 và BJT do người dùng cung cấp trong task hiện tại; ảnh nguồn không được lưu vào repository theo chính sách bằng chứng.
- **Implementation screenshot:** browser capture tạm thời của [`/apps/jlpt-n1/`](https://thangldw.github.io/apps/jlpt-n1/) và [`/apps/bjt-study/`](https://thangldw.github.io/apps/bjt-study/); ảnh kiểm thử không được commit.
- **Viewport:** 1280 × 800, device pixel ratio 2; đối chiếu tập trung vào sidebar desktop 240 px.
- **State:** light và dark; theme toggle đã được kích hoạt theo cả hai chiều.
- **Primary interactions tested:** light → dark, dark → light, cập nhật icon, nhãn truy cập và lưu theme dùng chung.
- **Console:** không có warning hoặc error trên hai route.

### Full-view và focused-region comparison

- Full view giữ nguyên cấu trúc, typography, khoảng cách, icon, active state và nội dung hiện có.
- Focused region xác nhận sidebar light, canvas, workspace và nút theme cùng nhận `rgb(251, 250, 246)` (`#fbfaf6`).
- Dark mode vẫn dùng các token charcoal riêng; không bị `#fbfaf6` hoặc selector light ghi đè.
- Mỗi sidebar chỉ còn một nút theme 44 × 44 px, không có text hiển thị; icon và `aria-label` diễn đạt theme đích.
- Không có image asset mới; logo và icon tiếp tục dùng asset/font icon hiện hữu.

### Comparison history

1. **P1 — nền sidebar không đồng nhất:** JLPT pha `--n1-bg` với black; BJT dùng `--bjt-rail: #ebe7de`. Đã đổi JLPT sang `var(--n1-bg)` và BJT light rail sang `#fbfaf6`.
2. **P2 — điều khiển theme trùng chức năng:** mỗi sidebar có hai nút kèm chữ. Đã hợp nhất thành một icon button, xóa selector và listener `data-theme-choice` cũ.
3. **Post-fix evidence:** computed styles của `html`, `body`, sidebar, workspace và theme button đã được đọc sau cascade; light đồng nhất `rgb(251, 250, 246)`, dark giữ đúng token riêng, legacy control count bằng 0.

### Required fidelity surfaces

- **Fonts and typography:** không thay đổi; không phát sinh wrap hoặc clipping mới.
- **Spacing and layout rhythm:** footer giữ nguyên nhịp; control mới thu về 44 px và canh phải.
- **Colors and visual tokens:** light background thống nhất `#fbfaf6`; dark token không đổi.
- **Image quality and asset fidelity:** không thêm hoặc thay image asset.
- **Copy and content:** bỏ chữ Sáng/Tối khỏi bề mặt; giữ nhãn tiếng Việt cho assistive technology.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi thay đổi.

**Follow-up polish:** không có.

**final result: passed**
