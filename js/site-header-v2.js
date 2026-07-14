/* ============================================================
   site-header.js — the single, self-contained site header.
   Injected into every SUB-PAGE (apps hub + each app) so the top
   bar is identical everywhere without copy-pasting markup.

   Self-contained on purpose: it ships its own CSS (baked light/dark
   palette, not borrowed from tokens.css) and an inline-SVG theme
   toggle, so it renders the same even on pages that don't load the
   site's design system or FontAwesome (e.g. the standalone N1 apps).

   The landing page keeps its own hand-written header — this mirrors
   it. Root-relative links (/, /apps/, /ja/) resolve from any page
   because the site is served at the domain root.
   ============================================================ */
(function () {
  "use strict";

  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';

  var CSS = [
    ".tw-header{position:relative;z-index:1;width:100%;align-self:stretch;flex:0 0 auto;",
    "background:rgba(13,17,23,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);",
    "border-bottom:1px solid #1f2733;font-family:'Space Grotesk','Noto Sans JP',system-ui,sans-serif;}",
    "html[data-theme='light'] .tw-header{background:rgba(250,251,252,.92);border-bottom-color:#e6e9ee;}",
    ".tw-header *{box-sizing:border-box;}",
    ".tw-header .tw-wrap{width:100%;padding:0 56px;height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px;}",
    ".tw-header .tw-brand{font-family:'Space Grotesk','Noto Sans JP',sans-serif;font-weight:700;font-size:24px;letter-spacing:-.05em;color:#f2f5f9;text-decoration:none;display:inline-flex;align-items:center;}",
    "html[data-theme='light'] .tw-header .tw-brand{color:#14171d;}",
    ".tw-header .tw-brand .tw-dot{color:#7c9cff;}",
    "html[data-theme='light'] .tw-header .tw-brand .tw-dot{color:#3a5bd9;}",
    ".tw-header .tw-nav{display:flex;align-items:center;gap:38px;}",
    ".tw-header .tw-nav a{color:#9aa6b4;text-decoration:none;font-family:'Space Grotesk','Noto Sans JP',sans-serif;font-size:15px;font-weight:500;line-height:1;transition:color .2s;}",
    ".tw-header .tw-nav a:hover,.tw-header .tw-nav a.tw-active{color:#eef1f6;}",
    "html[data-theme='light'] .tw-header .tw-nav a{color:#525a68;}",
    "html[data-theme='light'] .tw-header .tw-nav a:hover,html[data-theme='light'] .tw-header .tw-nav a.tw-active{color:#14171d;}",
    ".tw-header .tw-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:1px solid #262c38;background:#151922;color:#eef1f6;cursor:pointer;padding:0;transition:color .2s,border-color .2s;}",
    ".tw-header .tw-toggle:hover{color:#7c9cff;border-color:#7c9cff;}",
    "html[data-theme='light'] .tw-header .tw-toggle{border-color:#e4e7ee;color:#14171d;background:#ffffff;}",
    ".tw-header .tw-toggle svg{width:17px;height:17px;}",
    "@media(max-width:680px){.tw-header .tw-wrap{height:65px;padding:0 16px}.tw-header .tw-brand{font-size:22px}.tw-header .tw-nav{gap:8px}.tw-header .tw-nav a{font-size:12.5px}.tw-header .tw-toggle{width:32px;height:32px;}}",
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
      f.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(f);
    }

    var theme = currentTheme();
    var header = document.createElement("header");
    header.className = "tw-header";
    header.id = "tw-header";
    header.innerHTML =
      '<div class="tw-wrap">' +
      '<a href="/" class="tw-brand">thang<span class="tw-dot">.</span></a>' +
      '<nav class="tw-nav" aria-label="Theme controls">' +
      '<button class="tw-toggle" id="tw-toggle" aria-label="Toggle color theme" title="Toggle theme">' + iconFor(theme) + "</button>" +
      "</nav></div>";

    var skipLink = document.body.firstElementChild;
    if (skipLink && skipLink.matches(".skip-link, .skip")) skipLink.insertAdjacentHTML("afterend", header.outerHTML);
    else document.body.insertAdjacentHTML("afterbegin", header.outerHTML);

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
