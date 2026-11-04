import { useEffect, useRef } from "react";

export function ProjectSupport({ location }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.umami?.track("support_view", { project: "japan-pr-guide", location });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(panel.current);
    return () => observer.disconnect();
  }, [location]);
  return (
    <aside className="project-support" ref={panel} aria-labelledby={`support-title-${location}`}>
      <h2 id={`support-title-${location}`}>Help keep Japan PR Guide free</h2>
      <p>If this guide helped you plan your next steps, a one-time contribution helps maintain the calculator, checklists and source updates.</p>
      <p lang="vi">Nếu công cụ hữu ích cho việc chuẩn bị hồ sơ, bạn có thể ủng hộ một lần để hỗ trợ duy trì công cụ tính điểm, checklist và cập nhật nguồn thông tin.</p>
      <details onToggle={(event) => { if (event.currentTarget.open) window.umami?.track("support_open", { project: "japan-pr-guide", location }); }}>
        <summary>Support once · <span lang="vi">Ủng hộ một lần</span></summary>
        <div className="project-support-options">
          <section aria-label="International contribution">
            <h3>International · Ko-fi</h3>
            <p>Choose a one-time contribution on Ko-fi. You will review the amount before paying.</p>
            <a className="ui-button ui-button-primary primary-button" href="https://ko-fi.com/F4N224DDUV" target="_blank" rel="noopener noreferrer" data-analytics-event="support_checkout" data-analytics-project="japan-pr-guide" data-analytics-location={location}>Continue on Ko-fi ↗</a>
            <p lang="vi">Chọn ủng hộ một lần và kiểm tra số tiền trên Ko-fi trước khi thanh toán.</p>
          </section>
          <section aria-label="Vietnam bank transfer">
            <h3>Việt Nam · Chuyển khoản</h3>
            <p lang="vi">Quét hoặc tải mã QR để mở trong ứng dụng ngân hàng. Tự chọn số tiền và kiểm tra người nhận trước khi chuyển.</p>
            <img src="/assets/support-vietqr-mb.jpg" width="845" height="1151" loading="lazy" alt="MB Bank VietQR — Luu Duc Thang" />
            <a href="/assets/support-vietqr-mb.jpg" download="japan-pr-guide-vietqr.jpg" data-analytics-event="support_qr_download" data-analytics-project="japan-pr-guide" data-analytics-location={location}>Download QR · Tải mã QR</a>
          </section>
        </div>
      </details>
      <p className="project-support-note">Optional. All results and checklists remain free. A contribution does not affect any immigration decision.<br /><span lang="vi">Hoàn toàn tự nguyện. Kết quả và checklist luôn miễn phí. Việc ủng hộ không ảnh hưởng đến quyết định xét duyệt hồ sơ.</span></p>
    </aside>
  );
}
