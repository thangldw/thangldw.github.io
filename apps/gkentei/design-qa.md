# Design QA — G検定 Study Program

## Phạm vi và nguồn đối chiếu

- **Source visual truth:** luồng học của `/apps/jlpt-n1/`, các ảnh lỗi do người dùng cung cấp trong task này và `JDLA_G検定シラバス2024_v1.4.pdf`. Ảnh tạm không được commit theo chính sách bằng chứng.
- **Implementation:** `/apps/gkentei/` với 900 câu hỏi, 495 keyword, 11 phân野 và ba mức độ khó.
- **Viewport/state:** 390 × 844, 680 × 900, 1280 × 900 và 1440 × 900; light/dark; desktop/mobile; roadmap, topic guide, example quiz, practice, mock exam và learning history.
- **Primary interactions:** lọc theo phân野/難易度, tìm keyword, mở例題, chọn đáp án, xem giải thích song ngữ, quay lại topic, chạy mock exam 145 câu/120 phút, đổi theme và đọc lịch sử.

## Full-view và focused-region comparison

- Khung desktop giữ sidebar 240 px, warm-paper canvas, typography system sans/mono, đường chia và nhịp khoảng trắng của JLPT N1.
- Màn `出題分野` được tổ chức thành 11 topic card. Mỗi card có mục tiêu cần nhớ, keyword Nhật và câu hỏi minh họa; bộ lọc chỉ hiển thị thuật ngữ Nhật.
- Toàn bộ UI và câu hỏi hiển thị bằng tiếng Nhật. Tiếng Việt chỉ xuất hiện sau khi trả lời, cạnh phần `解説（日本語）`.
- Mobile chuyển sidebar thành header/menu, topic card xếp một cột, giải thích song ngữ xếp dọc và không phát sinh horizontal overflow.
- Search chỉ còn một border ngoài; input con không có border, outline hoặc background riêng.
- Accent route là `var(--accent, #c84d24)`; metric, CTA, active state và focus-visible dùng cùng sắc cam.
- `G検定ロードマップ` dùng lưới hai cột ở desktop và một cột từ 820 px trở xuống. Mỗi thẻ giữ số syllabus, tên phân野, trạng thái `未学習`/`学習中`/`習得済み`, số câu đã học và progressbar semantic.

## Comparison history

1. **P2 — search có hai khung lồng nhau:** native/shared input style còn border và background riêng. Đã khóa input về border/outline 0, transparent và chuyển focus sang wrapper.
2. **P1 — question bank chưa hỗ trợ ôn theo syllabus:** đã thay bằng 11 chủ đề, mỗi chủ đề có `この分野で覚えること`, `重要キーワード` và `例題`.
3. **P2 — nhãn topic và difficulty dùng tiếng Việt:** đã đổi sang thuật ngữ Nhật theo syllabus; difficulty là `基礎`, `標準`, `応用`.
4. **P2 — UI lẫn tiếng Việt:** đã Nhật hóa navigation, heading, filter, setup, quiz, result, review, history và lỗi tải dữ liệu. Chỉ phần giải thích giữ Nhật/Việt theo yêu cầu.
5. **P2 — metric và action dùng màu xanh:** đã đặt `--accent: #c84d24`; computed color xác nhận `rgb(200, 77, 36)`. Focus ring bị shared stylesheet ghi đè cũng đã được khóa về cùng accent.
6. **P1 — câu minh họa chưa sát chủ đề và thoát quiz về sai màn:** đã thêm relevance scoring theo title/keyword và lưu `returnView` để quay lại `出題分野`.
7. **Post-fix evidence:** kiểm tra lại light/dark, 390/680/1280/1440, một `main`, một `h1`, không overflow; DOM xác nhận giải thích Nhật/Việt chỉ xuất hiện sau khi chọn đáp án.
8. **P2 — roadmap dạng hàng khó quét khi có 11 phân野:** source live `/apps/gkentei/` dùng danh sách một cột nên chỉ thấy hai mục trong viewport desktop. Đã chuyển sang card grid hai cột, giữ thứ tự 01–11 và bổ sung trạng thái cùng thanh tiến độ từng thẻ.
9. **Post-grid evidence:** source live và implementation local được đặt trong cùng comparison input ở light mode 1280 × 720; dark mode cũng được chụp. 390 × 844 và 680 × 900 đều render một cột, `scrollWidth` bằng viewport, 11 card và một `h1`; click card 01 mở đúng `出題分野`.

## Required fidelity surfaces

- **Fonts and typography:** system sans cho heading/body, mono cho eyebrow/metric; tài liệu đặt `lang="ja"`; không clipping.
- **Spacing and layout:** sidebar, header, filter row, card grid và info rail bám nhịp JLPT; responsive không phá hierarchy.
- **Colors and tokens:** warm paper/charcoal dùng shared token; accent tương tác của G検定 dùng `var(--accent, #c84d24)`.
- **Copy and content:** UI/câu hỏi Nhật; explanation Nhật–Việt sau lựa chọn; 11 heading syllabus được đối chiếu với PDF v1.4.
- **Icons:** dùng Font Awesome local qua `/css/icons.css`; không tạo asset giả hoặc SVG tự vẽ.
- **States and behavior:** loading/error, filters, selected/correct/wrong, timeout, empty review, mobile menu, theme, persistence và mock exam hoạt động.
- **Accessibility:** một `main`, một `h1`, skip link, semantic controls, accessible labels, `aria-pressed`, progress/time, focus-visible, reduced-motion và tap target tối thiểu 34 px.
- **Focused roadmap region:** không cần crop riêng vì số thứ tự, title, state, count và progress đều đọc được ở native 1280 × 720; DOM xác nhận region có accessible name và 11 progressbar được gắn nhãn theo phân野.

## Dữ liệu và kiểm thử kỹ thuật

- 900/900 record đạt schema; đáp án thuộc A–D; option trong cùng câu không trùng; category và difficulty hợp lệ.
- Audit tự động không phát hiện exact duplicate hoặc near-duplicate có đáp án xung đột; 765 câu nguồn và 135 câu bổ sung bao phủ 495 keyword.
- Kiểm tra consistency giữa đáp án, giải thích Nhật–Việt, placeholder và technical token không phát hiện lỗi chặn phát hành.
- Giới hạn: đây là kiểm tra schema, consistency và UI; không thay thế thẩm định thủ công 900/900 câu bởi chuyên gia JDLA.
- UI Standard 1.1, site validator, JavaScript syntax và `git diff --check` là release gate của route.

## Findings

Không còn P0, P1 hoặc P2 có thể hành động trong phạm vi triển khai này.

## Follow-up polish

P3 — có thể bổ sung vòng chuyên gia độc lập để chấm factual accuracy từng câu và đo coverage thực tế sau các lần thi thử.

**final result: passed**
