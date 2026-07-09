/* ============================================================
   site-header.js — the single, self-contained site header.
   Injected into every SUB-PAGE (apps hub + each app) so the top
   bar is identical everywhere without copy-pasting markup.

   Self-contained on purpose: it ships its own CSS (baked light/dark
   palette, not borrowed from tokens.css) and an inline-SVG theme
   toggle, so it renders the same even on pages that don't load the
   site's design system or FontAwesome (e.g. the standalone N1 apps).

   The landing page keeps its own hand-written header — this mirrors
   it. Root-relative links (/, /#about, /apps/) resolve from any page
   because the site is served at the domain root.
   ============================================================ */
(function () {
  "use strict";

  var LINKS = [
    { href: "/#about", label: "About", section: true },
    { href: "/#approach", label: "Approach", section: true },
    { href: "/#skills", label: "Stack", section: true },
    { href: "/apps/", label: "Apps" },
    { href: "/#contact", label: "Contact", section: true },
  ];

  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';

  var CSS = [
    ".tw-header{position:sticky;top:0;z-index:1000;width:100%;align-self:stretch;flex:0 0 auto;",
    "background:rgba(11,12,15,.82);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);",
    "border-bottom:1px solid #262c38;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;}",
    "html[data-theme='light'] .tw-header{background:rgba(247,248,250,.9);border-bottom-color:#e4e7ee;}",
    ".tw-header *{box-sizing:border-box;}",
    ".tw-header .tw-wrap{width:min(72rem,100% - 2.5rem);margin-inline:auto;height:60px;display:flex;align-items:center;justify-content:space-between;gap:1rem;}",
    ".tw-header .tw-brand{font-family:'Space Grotesk','Inter',system-ui,sans-serif;font-weight:700;font-size:1.25rem;letter-spacing:-.01em;color:#eef1f6;text-decoration:none;display:inline-flex;align-items:center;}",
    "html[data-theme='light'] .tw-header .tw-brand{color:#14171d;}",
    ".tw-header .tw-brand .tw-dot{color:#7c9cff;}",
    "html[data-theme='light'] .tw-header .tw-brand .tw-dot{color:#3a5bd9;}",
    ".tw-header .tw-nav{display:flex;align-items:center;gap:1.35rem;}",
    ".tw-header .tw-nav a{color:#9aa3b2;text-decoration:none;font-size:.9rem;font-weight:500;line-height:1;transition:color .2s;}",
    ".tw-header .tw-nav a:hover,.tw-header .tw-nav a.tw-active{color:#7c9cff;}",
    "html[data-theme='light'] .tw-header .tw-nav a{color:#525a68;}",
    "html[data-theme='light'] .tw-header .tw-nav a:hover,html[data-theme='light'] .tw-header .tw-nav a.tw-active{color:#3a5bd9;}",
    ".tw-header .tw-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid #262c38;background:transparent;color:#9aa3b2;cursor:pointer;padding:0;transition:color .2s,border-color .2s;}",
    ".tw-header .tw-toggle:hover{color:#7c9cff;border-color:#333a49;}",
    "html[data-theme='light'] .tw-header .tw-toggle{border-color:#e4e7ee;color:#525a68;}",
    ".tw-header .tw-toggle svg{width:16px;height:16px;}",
    "@media(max-width:560px){.tw-header .tw-nav{gap:1rem;}.tw-header .tw-nav a.tw-section{display:none;}}",
  ].join("");

  /* ---- resolve current theme (mirror the tokens.css pre-paint logic) ---- */
  function currentTheme() {
    var root = document.documentElement;
    var t = root.getAttribute("data-theme");
    if (t) return t;
    var saved = localStorage.getItem("theme");
    t = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    root.setAttribute("data-theme", t);
    return t;
  }

  function iconFor(theme) {
    // show the icon of the theme you'd switch TO
    return theme === "dark" ? SUN : MOON;
  }

  function build() {
    if (document.getElementById("tw-header")) return; // guard against double-inject

    var style = document.createElement("style");
    style.id = "tw-header-style";
    style.textContent = CSS;
    document.head.appendChild(style);

    // Make sure the brand font is available even on pages that don't link it.
    if (!document.querySelector("link[href*='fonts.googleapis.com']")) {
      var f = document.createElement("link");
      f.rel = "stylesheet";
      f.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap";
      document.head.appendChild(f);
    }

    var theme = currentTheme();
    var onApps = location.pathname.replace(/\/index\.html$/, "/").indexOf("/apps/") === 0
      || /^\/apps\//.test(location.pathname);

    var nav = LINKS.map(function (l) {
      var cls = [];
      if (l.section) cls.push("tw-section");
      if (l.label === "Apps" && onApps) cls.push("tw-active");
      return '<a href="' + l.href + '"' + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + l.label + "</a>";
    }).join("");

    var header = document.createElement("header");
    header.className = "tw-header";
    header.id = "tw-header";
    header.innerHTML =
      '<div class="tw-wrap">' +
      '<a href="/" class="tw-brand">thang<span class="tw-dot">.</span></a>' +
      '<nav class="tw-nav" aria-label="Primary">' + nav +
      '<button class="tw-toggle" id="tw-toggle" aria-label="Toggle color theme" title="Toggle theme">' + iconFor(theme) + "</button>" +
      "</nav></div>";

    document.body.insertAdjacentHTML("afterbegin", header.outerHTML);

    document.getElementById("tw-toggle").addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      this.innerHTML = iconFor(next);
      // let theme-aware pages (e.g. Data Copilot's chart) react
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
    });
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
