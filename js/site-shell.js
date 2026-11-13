(function () {
  "use strict";

  var root = document.documentElement;

  function preferredTheme() {
    try {
      var saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      // Use the default light theme when storage is unavailable.
    }
    return "light";
  }

  function syncThemeButton(button) {
    if (!button) return;
    var dark = root.dataset.theme === "dark";
    var labels = {
      en: ["Switch to dark theme", "Switch to light theme"],
      vi: ["Chuyển sang giao diện tối", "Chuyển sang giao diện sáng"],
      ja: ["ダークテーマに切り替える", "ライトテーマに切り替える"],
      zh: ["切换深色主题", "切换浅色主题"]
    };
    var language = root.lang.split("-")[0];
    var copy = labels[language] || labels.en;
    button.setAttribute("aria-label", copy[dark ? 1 : 0]);
    var icon = button.querySelector("i");
    if (icon) icon.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  var navLabels = {
    en: { apps: "Apps", community: "Community", contact: "Contact", nav: "Site" },
    vi: { apps: "Ứng dụng", community: "Cộng đồng", contact: "Liên hệ", nav: "Điều hướng trang" },
    ja: { apps: "アプリ", community: "コミュニティ", contact: "お問い合わせ", nav: "サイト内ナビゲーション" },
    zh: { apps: "应用", community: "社区", contact: "联系", nav: "站点导航" }
  };

  function syncSiteNav() {
    var copy = navLabels[root.lang.split("-")[0]] || navLabels.en;
    var path = location.pathname.replace(/index\.html$/, "");
    document.querySelectorAll(".site-nav").forEach(function (nav) {
      if (nav.getAttribute("aria-label") !== copy.nav) nav.setAttribute("aria-label", copy.nav);
    });
    document.querySelectorAll(".site-nav [data-site-nav]").forEach(function (link) {
      var label = copy[link.dataset.siteNav];
      // Write only on change: this runs from a subtree MutationObserver.
      if (label && link.textContent !== label) link.textContent = label;
      var current = link.getAttribute("href") === path;
      if (current !== (link.getAttribute("aria-current") === "page")) {
        if (current) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
  }

  function setTheme(theme, button) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Theme selection remains active for the current page.
    }
    syncThemeButton(button);
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  function bindThemeControl() {
    syncSiteNav();
    var button = document.getElementById("themeToggle");
    if (!button) return;
    syncThemeButton(button);
    if (button.dataset.siteShellBound === "true") return;
    button.dataset.siteShellBound = "true";
    button.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark", button);
    });
  }

  function observeThemeControl() {
    if (!document.body || typeof MutationObserver === "undefined") return;
    new MutationObserver(bindThemeControl).observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["lang"]
    });
  }

  function initializeShell() {
    var footerYear = document.querySelector(".footer-signature [data-footer-year]");
    if (footerYear) footerYear.textContent = String(new Date().getFullYear());
    bindThemeControl();
    observeThemeControl();
  }

  root.dataset.theme = root.dataset.theme === "dark" || root.dataset.theme === "light"
    ? root.dataset.theme
    : preferredTheme();

  if (document.body) initializeShell();
  else document.addEventListener("DOMContentLoaded", initializeShell);
})();
