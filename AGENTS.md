# Repository agent contract

Áp dụng cho toàn bộ repository. Mục tiêu là giữ một hệ thiết kế duy nhất, repository gọn và dữ liệu học tập an toàn.

## 1. Phân loại page trước khi sửa

- `content`: page nội dung, utility, tài liệu, dashboard hoặc công cụ thông thường; không phải trang giới thiệu sản phẩm/solution. Đây là mặc định.
- `product`: landing page hoặc case study giới thiệu sản phẩm/solution; được phép có bố cục riêng nhưng vẫn dùng semantic color token.
- `exam`: chương trình học, luyện thi, câu hỏi, đáp án và lịch sử học; ưu tiên bảo toàn dữ liệu và hành vi.

Nếu yêu cầu không nói rõ, dùng loại `content`. Không tạo thêm design system riêng.

## 2. Contract bắt buộc cho content page

Content page mới phải dùng đúng shared shell:

```html
<link rel="stylesheet" href="/css/reset.css">
<link rel="stylesheet" href="/css/tokens.css?v=YYYYMMDD">
<!-- CSS riêng, nếu thực sự cần, đặt ở đây -->
<link rel="stylesheet" href="/css/app-footer.css?v=YYYYMMDD">
<link rel="stylesheet" href="/css/app-design-system.css?v=YYYYMMDD">
```

```html
<body class="portfolio-app content-page" data-page-kind="content">
  <a class="skip-link" href="#main">Skip to content</a>
  <main class="content-shell" id="main">
    <header class="content-hero">
      <span class="content-eyebrow">Category</span>
      <h1>Page title</h1>
      <p class="content-lead">One concise description.</p>
    </header>
    <section class="content-section" aria-labelledby="section-title">
      <h2 id="section-title">Section title</h2>
      <div class="content-grid">
        <article class="content-card">
          <h3>Card title</h3>
          <p>Card content.</p>
        </article>
      </div>
    </section>
  </main>
  <footer class="site-foot">Crafted with care © 2026</footer>
  <script defer src="/js/analytics.js"></script>
  <script src="/js/site-header-v2.js?v=YYYYMMDD"></script>
</body>
```

Không đổi tên các class shell trên. Mở rộng bằng component nhỏ, không copy nguyên CSS từ page khác.

## 3. Visual và component rules

- Màu chỉ lấy từ `css/tokens.css`; component dùng alias trong `css/app-design-system.css`.
- Accent toàn site là rust/orange. Không hard-code palette xanh cũ hoặc tạo accent riêng cho chrome chung.
- Header luôn dùng `js/site-header-v2.js`; không viết header/theme toggle riêng.
- Primary action: `.btn.btn-primary`, nền accent và `--color-on-accent`.
- Secondary action: `.btn` hoặc `.btn-ghost`, surface trung tính.
- Selected tab/filter: accent-soft + accent text; không dùng màu primary filled cho trạng thái selected.
- Radius control 8 px, target thường tối thiểu 40 px, compact control tối thiểu 34 px.
- Light/dark phải dùng cùng semantic role; không định nghĩa palette theme thứ hai trong page CSS.
- Không shadow trang trí. Dùng border và surface để tạo phân cấp.

## 4. HTML và code rules

- Một `main`, một source `h1`, heading tuần tự.
- Có `lang`, charset, viewport, title, description, canonical, Open Graph và Twitter metadata.
- Control có accessible name, `type="button"` khi không submit, keyboard và `:focus-visible`.
- Không thêm `<style>`, `style=`, inline event handler hoặc raw color vào content page.
- Không thêm framework, package manager, build step hay CDN mới nếu static HTML/CSS/JS hiện tại đáp ứng được.
- CSS riêng chỉ chứa layout/component đặc thù và phải load trước `app-footer.css` + `app-design-system.css`.

## 5. Data và exam safety

- Không xoá, rút gọn, format hàng loạt hoặc tái sinh dữ liệu câu hỏi, đáp án, từ vựng, ngữ pháp, reading hay exam nếu yêu cầu không chỉ đích danh tập dữ liệu.
- Giữ nguyên ID, thứ tự, schema và liên kết giữa UI với data.
- Trước và sau thay đổi exam, chạy các audit dữ liệu liên quan và learning smoke test.
- Snapshot nghiệp vụ đang được app hiện hành dùng không phải file rác.

## 6. Repository hygiene

- Chỉ duy trì `README.md` và `AGENTS.md` làm tài liệu gốc. Không commit QA diary, migration history, screenshot report hoặc Markdown tạm.
- Không giữ redirect legacy, backup, archive, `.DS_Store`, cache, build output cũ hoặc file không còn reference.
- Không tạo ledger để hợp thức hoá code cũ. Khi chạm vào legacy code, sửa tại nguồn trong phạm vi an toàn.
- Asset hoặc script chỉ được xoá sau khi xác nhận không còn route/runtime nào tham chiếu.

## 7. Definition of done

Chạy tối thiểu:

```bash
python3 scripts/audit_ui_standards.py
python3 scripts/validate_site.py
node scripts/smoke_learning_apps.mjs
node scripts/qa_jlpt_n1.mjs
git diff --check
```

Content page phải được kiểm tra ở 390, 680, 1280 và 1440 px, light/dark, không overflow và không console error.
