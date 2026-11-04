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
      <div className="project-support-copy">
        <h2 id={`support-title-${location}`}>Help keep Japan PR Guide free</h2>
        <p lang="vi">Hữu ích với bạn? Ủng hộ một lần để duy trì công cụ.</p>
      </div>
      <a className="project-support-kofi" href="https://ko-fi.com/F4N224DDUV" target="_blank" rel="noopener noreferrer" data-analytics-event="support_checkout" data-analytics-project="japan-pr-guide" data-analytics-location={location}>Ko-fi ↗</a>
      <details onToggle={(event) => { if (event.currentTarget.open) window.umami?.track("support_open", { project: "japan-pr-guide", location }); }}>
        <summary>Bank transfer · <span lang="vi">Chuyển khoản</span></summary>
        <div className="project-support-bank">
          <img src="/assets/support-vietqr-mb.jpg" width="845" height="1151" loading="lazy" alt="MB Bank VietQR — Luu Duc Thang" />
          <a href="/assets/support-vietqr-mb.jpg" download="japan-pr-guide-vietqr.jpg" data-analytics-event="support_qr_download" data-analytics-project="japan-pr-guide" data-analytics-location={location}>Download QR · Tải mã QR</a>
        </div>
      </details>
    </aside>
  );
}
