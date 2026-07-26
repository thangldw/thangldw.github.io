(function () {
  "use strict";

  var root = document.documentElement;
  var scheduled = false;

  function syncButton(button) {
    var dark = root.dataset.theme === "dark";
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    button.querySelector("i").className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  function createButton() {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "site-theme-toggle";
    button.id = "themeToggle";
    button.dataset.siteShellBound = "true";
    button.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    syncButton(button);
    button.addEventListener("click", function () {
      var theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Keep the selected theme active for the current page.
      }
      syncButton(button);
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
    });
    return button;
  }

  function mountButton() {
    scheduled = false;
    var target = document.querySelector(".topbar") || document.querySelector(".certification-hub");
    if (!target) return;
    var button = document.getElementById("themeToggle") || createButton();
    if (button.parentElement !== target) target.appendChild(button);
    syncButton(button);
  }

  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(mountButton);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleMount, { once: true });
  } else {
    scheduleMount();
  }

  new MutationObserver(scheduleMount).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
