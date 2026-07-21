# JLPT N1 — Design QA

**Trạng thái:** đạt

**Lần xác nhận:** 2026-07-21

**Phạm vi:** hub JLPT N1, desktop 1440 × 1024, mobile 390 × 844, giao diện sáng và tối

## Kiến trúc nội dung

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"Inter, Arial, sans-serif","lineColor":"#667085","primaryTextColor":"#172B4D"}}}%%
flowchart LR
  Hub(["JLPT N1 Hub"]) --> Vocabulary["Từ vựng · 6 module"]
  Hub --> Grammar["Ngữ pháp · 4 module"]
  Hub --> Reading["Đọc hiểu · 2 module"]
  Hub --> Practice["Luyện tập 5 · 10 · 20"]

  Vocabulary --> Child["12 app con canonical"]
  Grammar --> Child
  Reading --> Child
  Practice --> Session["Phiên 30 giây / câu"]
  Session --> History["Lịch sử IndexedDB"]

  classDef yellow fill:#FFF2B2,stroke:#B7791F,color:#3B2F00,stroke-width:1px;
  classDef blue fill:#D9E8FF,stroke:#4262FF,color:#172B4D,stroke-width:1px;
  classDef green fill:#DDF5E7,stroke:#238653,color:#153B29,stroke-width:1px;
  classDef pink fill:#FFE0EC,stroke:#C94F7C,color:#4A1730,stroke-width:1px;
  class Hub yellow;
  class Vocabulary,Grammar,Reading,Practice blue;
  class Child pink;
  class Session,History green;
```

## Kết quả

| Khu vực | Tiêu chí | Kết quả |
|---|---|---|
| Sidebar | Cùng chiều rộng, spacing, active state và mobile pattern với BJT | Đạt |
| Màu sắc | Orange là interaction color; xanh chỉ dùng cho brand `thang.` | Đạt |
| Từ vựng | Mỗi tab sở hữu đúng module, không lặp block “Luyện theo dạng” | Đạt |
| Ngữ pháp | Knowledge, practice và đề thật được tách rõ | Đạt |
| Đọc hiểu | Hai module được truy cập trực tiếp từ hub | Đạt |
| Luyện đề | Không còn divider rỗng hoặc nội dung lặp | Đạt |
| Luyện tập | Chọn 5, 10 hoặc 20 câu; 30 giây mỗi câu | Đạt |
| Feedback | Bộ đếm đúng/tổng, đáp án và giải thích tiếng Việt cập nhật ngay | Đạt |
| Lịch sử | Lưu phiên, từng câu, thời lượng, mastery và export/import JSON | Đạt |
| Responsive | 390 px không tràn ngang; controls vẫn thao tác được | Đạt |
| Console | Không có lỗi trong các luồng đã kiểm tra | Đạt |

## Trạng thái dữ liệu

- Trạng thái hub và lịch sử luyện tập mới được lưu trong IndexedDB.
- `jlpt-n1-hub-v1` và `jlpt_wrong` cũ bị xóa một lần, không migration.
- `localStorage` của hub chỉ giữ `theme`.
- Mười hai app con vẫn có adapter tiến độ riêng; chúng chưa cùng ghi chi tiết vào lịch sử chung của hub.

## Checklist hồi quy

- [x] Chuyển toàn bộ tab ở Từ vựng, Ngữ pháp và Đọc hiểu.
- [x] Mở app con rồi trở lại hub; module mới vẫn được ghi nhận.
- [x] Chọn 5 câu, trả lời đúng/sai và kiểm tra timer.
- [x] Hoàn thành phiên và mở chi tiết từng câu trong Thống kê.
- [x] Tải lại trang và xác nhận tiến độ hub vẫn tồn tại.
- [x] Kiểm tra giao diện sáng/tối và mobile.
- [x] Xác nhận không có horizontal overflow.

## Giới hạn đã biết

- Quiz chung hiện tập trung vào ngữ pháp; scope từ vựng, đọc hiểu và mixed là bước mở rộng tiếp theo.
- Dữ liệu chi tiết từ 12 app con chưa được hợp nhất vào learning history chung.
- IndexedDB là local-first; chưa có đăng nhập hoặc đồng bộ đa thiết bị.

## Roadmap grid — 2026-07-22

- **Source visual truth path:** `https://thangldw.github.io/apps/jlpt-n1/#path` trước thay đổi; browser capture tạm không được commit.
- **Implementation screenshot path:** `http://127.0.0.1:4180/apps/jlpt-n1/#path`; browser capture tạm không được commit.
- **Viewport/state:** 1280 × 720 light/dark, 680 × 900 và 390 × 844; route `#path`, 0% và trạng thái chưa bắt đầu.
- **Primary interactions:** click thẻ `Từ vựng N1` chuyển đúng sang `#vocabulary`; theme toggle và mobile menu giữ nguyên.

### Full-view và focused-region comparison

- Source dùng ba hàng toàn chiều rộng; implementation chuyển thành lưới hai cột nhưng giữ nguyên header, sidebar, typography, accent, thứ tự 01–03 và nội dung module.
- Mỗi thẻ mới hiển thị rõ phần trăm, `Chưa bắt đầu`/`Đang học`/`Hoàn thành`, số module đã mở và progressbar semantic.
- Tại 680 px và 390 px lưới rơi về một cột; `scrollWidth` bằng viewport, một `h1` và toàn bộ ba thẻ vẫn thao tác được.
- Focused crop riêng không cần thiết vì title, state, count và progressbar đều đọc được trong full-view 1280 × 720; DOM xác nhận region `Các trụ cột học tập JLPT N1` có ba button.

### Comparison history

1. **P2 — roadmap dạng hàng chưa tận dụng chiều ngang:** ba trụ cột bị kéo dài, khoảng trống lớn và khó so sánh nhanh.
2. **Fix:** chuyển `.overview-list` sang grid hai cột, biến mỗi `.track-row` thành card có state và progressbar; giữ nguyên click target toàn thẻ.
3. **Post-fix evidence:** source live và implementation local được đặt trong cùng comparison input ở light mode; dark mode và responsive 390/680 cũng được kiểm tra sau sửa.

### Required fidelity surfaces

- **Fonts/typography:** giữ nguyên font sans/mono, scale, weight và line-height; tiêu đề dài wrap tự nhiên ở mobile.
- **Spacing/layout:** card cùng chiều cao, gap 12 px, radius/token hiện hữu; desktop hai cột, tablet/mobile một cột.
- **Colors/tokens:** chỉ dùng `--n1-*`; orange tiếp tục là active/progress, brand xanh không đổi.
- **Image quality:** không có image asset mới; icon tiếp tục dùng Font Awesome local.
- **Copy/content:** giữ nguyên nội dung Việt–Nhật và danh sách 12 module; chỉ bổ sung nhãn trạng thái rõ nghĩa.
- **Accessibility/behavior:** button toàn thẻ, region có accessible name, progress có label, không overflow và điều hướng hash hoạt động.

**Findings:** không còn P0, P1 hoặc P2 có thể hành động trong phạm vi roadmap grid.

**Follow-up polish:** P3 — có thể thử nghiệm A/B vị trí thẻ thứ ba ở desktop nếu sau này thêm trụ cột thứ tư.

**final result: passed**
