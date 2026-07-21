# JLPT N1 — Design QA

**Trạng thái:** đạt

**Xác nhận gần nhất:** 2026-07-22

**Phạm vi:** 390, 680 và 1280 px; light/dark; hub và roadmap

## Kiến trúc nội dung

```mermaid
%%{init: {"theme":"base","flowchart":{"curve":"linear","nodeSpacing":34,"rankSpacing":44},"themeVariables":{"fontFamily":"Inter, Arial, sans-serif","fontSize":"14px","lineColor":"#5F6B7A","primaryTextColor":"#1F2937","clusterBkg":"#FFFFFF","clusterBorder":"#CBD5E1"}}}%%
flowchart LR
  Hub(["JLPT N1 Hub"]) --> Vocabulary["Từ vựng · 6 module"]
  Hub --> Grammar["Ngữ pháp · 4 module"]
  Hub --> Reading["Đọc hiểu · 2 module"]
  Vocabulary --> Apps["12 app canonical"]
  Grammar --> Apps
  Reading --> Apps
  Hub --> Practice["Luyện tập · 5 · 10 · 20"]
  Practice --> Session["30 giây / câu"]
  Session --> History[("IndexedDB")]

  classDef stickyYellow fill:#FFF3B0,stroke:#C99700,color:#3D2F00,stroke-width:1.5px;
  classDef stickyBlue fill:#DCEBFF,stroke:#4C6FFF,color:#172B4D,stroke-width:1.5px;
  classDef stickyPink fill:#FFE1EC,stroke:#D65A87,color:#4A1730,stroke-width:1.5px;
  classDef stickyGreen fill:#DFF5E8,stroke:#2D9D62,color:#153B29,stroke-width:1.5px;
  class Hub stickyYellow;
  class Vocabulary,Grammar,Reading,Practice stickyBlue;
  class Apps,Session stickyPink;
  class History stickyGreen;
  linkStyle default stroke:#5F6B7A,stroke-width:1.5px;
```

## Coverage

| Khu vực | Điều đã xác nhận | Kết quả |
|---|---|---|
| Sidebar | Cùng spacing, active state và mobile pattern với BJT | Đạt |
| Màu sắc | Cam cho interaction; xanh chỉ dùng cho brand `thang.` | Đạt |
| Từ vựng | Sáu module, không lặp block luyện theo dạng | Đạt |
| Ngữ pháp | Knowledge, practice và đề thật được tách rõ | Đạt |
| Đọc hiểu | Hai module truy cập trực tiếp từ hub | Đạt |
| Luyện tập | Chọn 5, 10 hoặc 20 câu; 30 giây mỗi câu | Đạt |
| Feedback | Bộ đếm đúng/tổng, đáp án và giải thích cập nhật ngay | Đạt |
| Lịch sử | Phiên, từng câu, thời lượng, mastery và backup JSON | Đạt |
| Responsive | Không tràn ngang; control vẫn thao tác được | Đạt |
| Runtime | Không có lỗi console trong các luồng đã kiểm tra | Đạt |

## Roadmap grid

- Ba trụ cột `Từ vựng N1`, `Ngữ pháp N1` và `Đọc hiểu N1` dùng card grid.
- Desktop ≥1181 px hiển thị ba cột; 821–1180 px hai cột; ≤820 px một cột.
- Mỗi card giữ số thứ tự, trạng thái, số module đã mở và progressbar có accessible label.
- Click toàn card điều hướng đúng hash; theme toggle và mobile menu giữ nguyên.
- Tại 390 và 680 px, ba card xếp một cột và `scrollWidth` bằng viewport.

## Dữ liệu và persistence

- Trạng thái hub và lịch sử luyện tập được lưu trong IndexedDB.
- `jlpt-n1-hub-v1` và `jlpt_wrong` cũ bị xóa một lần, không migration.
- `localStorage` của hub chỉ giữ `theme`.
- Mười hai app con vẫn có progress adapter riêng và chưa ghi toàn bộ chi tiết vào history chung.

## Hồi quy đã kiểm tra

- [x] Chuyển các tab Từ vựng, Ngữ pháp và Đọc hiểu.
- [x] Mở app con rồi quay lại hub; module đã mở vẫn được ghi nhận.
- [x] Chạy phiên 5 câu, gồm đúng, sai và timeout.
- [x] Mở chi tiết từng câu trong Thống kê sau khi hoàn thành.
- [x] Tải lại trang và xác nhận tiến độ vẫn tồn tại.
- [x] Kiểm tra light/dark, menu mobile và horizontal overflow.
- [x] Click roadmap card và xác nhận hash đích.

## Giới hạn

- Quiz chung hiện tập trung vào ngữ pháp; scope từ vựng, đọc hiểu và mixed là bước mở rộng tiếp theo.
- Dữ liệu chi tiết từ 12 app con chưa hợp nhất vào learning history chung.
- IndexedDB là local-first; chưa có đăng nhập hoặc đồng bộ nhiều thiết bị.

Không còn finding P0, P1 hoặc P2 trong phạm vi đã kiểm tra.

**final result: passed**
