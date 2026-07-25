/* ============================================================
   Shared sub-page header.

   The layout remains self-contained, while every color comes from
   the canonical semantic token contract. Fallbacks keep the header
   usable on standalone pages before their stylesheets finish loading.
   ============================================================ */
(function () {
  "use strict";

  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';

  var CSS = [
    ".tw-header{position:relative;z-index:1;width:100%;align-self:stretch;flex:0 0 auto;",
    "border-bottom:1px solid var(--color-border,#d9d5cb);",
    "background:color-mix(in srgb,var(--color-canvas,#fbfaf6) 94%,transparent);",
    "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);",
    "color:var(--color-text,#1d211e);font-family:var(--font-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif);}",
    ".tw-header *{box-sizing:border-box;}",
    ".tw-header .tw-wrap{width:min(var(--portfolio-content,var(--content-width,1180px)),calc(100% - 112px));height:72px;margin-inline:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;}",
    ".tw-header .tw-brand{font-family:var(--font-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif);font-weight:700;font-size:22px;letter-spacing:-.04em;color:var(--color-text,#1d211e);text-decoration:none;display:inline-flex;align-items:center;gap:10px;min-height:38px;}",
    ".tw-header .tw-mark{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;border:2px solid var(--color-accent,#a83a00);border-radius:12px 4px;color:var(--color-accent,#a83a00);font:650 15px/1 var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace);letter-spacing:-.08em;transition:border-color .2s,color .2s,transform .2s;}",
    ".tw-header .tw-brand:hover .tw-mark{border-color:color-mix(in srgb,var(--color-accent,#a83a00) 72%,white);color:color-mix(in srgb,var(--color-accent,#a83a00) 72%,white);transform:translateY(-1px);}",
    ".tw-header .tw-brand:focus-visible{outline:2px solid var(--color-accent,#a83a00);outline-offset:4px;border-radius:7px;}",
    ".tw-header .tw-dot{color:var(--color-accent,#a83a00);}",
    ".tw-header .tw-nav{display:flex;align-items:center;gap:38px;}",
    ".tw-header .tw-nav a{color:var(--color-text-body,#505750);text-decoration:none;font-family:var(--font-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif);font-size:15px;font-weight:500;line-height:1;transition:color .2s;}",
    ".tw-header .tw-nav a:hover,.tw-header .tw-nav a.tw-active{color:var(--color-accent,#a83a00);}",
    ".tw-header .tw-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px!important;border:1px solid var(--color-border,#d9d5cb);background:var(--color-surface-raised,#fff);color:var(--color-text,#1d211e);cursor:pointer;padding:0;transition:color .2s,border-color .2s,background-color .2s;}",
    ".tw-header .tw-toggle:hover{border-color:var(--color-accent,#a83a00);background:var(--color-accent-soft,#fff2e8);color:var(--color-accent,#a83a00);}",
    ".tw-header .tw-toggle svg{width:17px;height:17px;}",
    "@media(max-width:680px){.tw-header .tw-wrap{width:calc(100% - 32px);height:64px}.tw-header .tw-brand{font-size:20px;gap:8px}.tw-header .tw-mark{width:32px;height:32px;border-radius:10px 4px;font-size:13px}.tw-header .tw-nav{gap:8px}.tw-header .tw-nav a{font-size:12.5px}.tw-header .tw-toggle{width:34px;height:34px;}}",
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

    var theme = currentTheme();
    var header = document.createElement("header");
    header.className = "tw-header";
    header.id = "tw-header";
    header.innerHTML =
      '<div class="tw-wrap">' +
      '<a href="/" class="tw-brand" aria-label="Thang Luu home"><span class="tw-mark" aria-hidden="true">t:&gt;</span><span class="tw-name">thang<span class="tw-dot">.</span></span></a>' +
      '<nav class="tw-nav" aria-label="Theme controls">' +
      '<button type="button" class="tw-toggle" id="tw-toggle" aria-label="Toggle color theme" title="Toggle theme">' + iconFor(theme) + "</button>" +
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
