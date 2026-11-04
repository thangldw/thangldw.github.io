(function () {
  "use strict";

  function normalizedPath() {
    var path = window.location.pathname.replace(/index\.html$/, "");
    return path.endsWith("/") ? path : path + "/";
  }

  function shouldShowSupport() {
    return true;
  }

  function dialogMarkup(linksOnly) {
    return '<dialog class="support-dialog" id="supportDialog" aria-labelledby="supportDialogTitle" aria-describedby="supportDialogIntro">' +
      '<div class="support-dialog-shell">' +
        '<button class="support-dialog-close" id="supportClose" type="button" aria-label="Close support options">&times;</button>' +
        '<header class="support-dialog-heading"><h2 id="supportDialogTitle">Support my work</h2>' +
          '<p id="supportDialogIntro">Help me maintain these free tools. Support is optional.</p></header>' +
        '<div class="support-options">' +
          '<section class="support-international" aria-label="International support options">' +
            '<article class="support-github"><h3>GitHub Sponsors</h3>' +
              (linksOnly ?
              '<a class="support-primary" href="https://github.com/sponsors/thangldw" target="_blank" rel="noopener noreferrer">Continue on GitHub ↗</a>' :
              '<form class="sponsor-form" action="https://github.com/sponsors/thangldw/sponsorships" method="get" target="_blank" rel="noopener noreferrer">' +
                '<fieldset class="sponsor-frequency"><legend class="sr-only">Contribution type</legend>' +
                  '<input class="sponsor-frequency-input" type="radio" name="frequency" id="sharedSponsorOneTime" value="one-time" checked><label for="sharedSponsorOneTime">One-time</label>' +
                  '<input class="sponsor-frequency-input" type="radio" name="frequency" id="sharedSponsorMonthly" value="recurring"><label for="sharedSponsorMonthly">Monthly</label></fieldset>' +
                '<div class="sponsor-presets" role="group" aria-label="Amount in USD">' +
                  '<button type="button" data-amount="3" aria-pressed="false">$3</button>' +
                  '<button type="button" data-amount="5" aria-pressed="true">$5</button>' +
                  '<button type="button" data-amount="10" aria-pressed="false">$10</button>' +
                  '<button type="button" data-amount="other" aria-pressed="false">Other</button></div>' +
                '<div class="sponsor-custom" hidden><label for="sharedSponsorAmount">Amount (USD)</label>' +
                  '<input id="sharedSponsorAmount" name="amount" type="number" min="1" max="12000" step="1" inputmode="numeric" value="5" required></div>' +
                '<button class="support-primary" type="submit">Continue on GitHub ↗</button>' +
                '<p class="sponsor-help">Review before confirming on GitHub.</p></form>') +
            '</article>' +
            '<article class="support-kofi"><a class="support-kofi-button" href="https://ko-fi.com/F4N224DDUV" target="_blank" rel="noopener noreferrer">Support via Ko-fi ↗</a></article>' +
          '</section>' +
          '<article class="support-option support-bank"><details id="supportBankDetails" open>' +
            '<summary>ShopeePay <span>Vietnam</span></summary>' +
            '<figure><img src="/assets/support-shopeepay.jpg" width="1096" height="1096" alt="ShopeePay QR for voluntary support"></figure>' +
            '<p class="support-bank-account">Scan with ShopeePay.</p>' +
            '<div class="support-bank-actions">' +
              '<a href="/assets/support-shopeepay.jpg" download="thang-shopeepay.jpg">Download QR</a></div>' +
          '</details></article>' +
        '</div></div></dialog>';
  }

  function initializeSupport() {
    var customTriggers = document.body.hasAttribute("data-support-shared") ? Array.from(document.querySelectorAll("[data-support-open]")) : [];
    if (!shouldShowSupport() || document.getElementById("supportDialog") || document.querySelector(".support-work") || (document.querySelector("[data-support-open]") && !customTriggers.length)) return;

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "support-floating-trigger";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", "supportDialog");
    trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 4h15v3H5a1 1 0 0 0 0 2h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm12 9v4h6v-4h-6Zm2 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg><span>Support my work</span>';

    var slot = document.getElementById('supportSlot');
    // Restricted study pages must not request third-party images or submit forms.
    var linksOnly = document.body.hasAttribute('data-support-links') ||
      (slot && document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
    document.body.insertAdjacentHTML("beforeend", dialogMarkup(linksOnly));
    if (customTriggers.length) {
      customTriggers.forEach(function (button) { button.setAttribute("aria-haspopup", "dialog"); button.setAttribute("aria-controls", "supportDialog"); });
    } else if (slot) {
      trigger.classList.add('support-inline-trigger');
      slot.appendChild(trigger);
      var hostSelector = slot.getAttribute('data-support-host');
      if (hostSelector) {
        function placeSupport() {
          var host = document.querySelector(hostSelector);
          slot.hidden = !host;
          if (host && slot.parentElement !== host) host.appendChild(slot);
        }
        placeSupport();
        new MutationObserver(placeSupport).observe(document.body, { childList: true, subtree: true });
      }

    } else {
      document.body.appendChild(trigger);
    }

    var dialog = document.getElementById("supportDialog");
    var closeButton = document.getElementById("supportClose");
    if (!dialog || typeof dialog.showModal !== "function") return;

    var amount = dialog.querySelector('#sharedSponsorAmount');
    dialog.querySelectorAll('[data-amount]').forEach(function (button) {
      button.addEventListener('click', function () {
        var custom = button.dataset.amount === 'other';
        dialog.querySelectorAll('[data-amount]').forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === button));
        });
        dialog.querySelector('.sponsor-custom').hidden = !custom;
        amount.value = custom ? '' : button.dataset.amount;
        if (custom) amount.focus();
      });
    });
    function openSupport() {
      dialog.querySelector('#supportBankDetails').open = !window.matchMedia('(max-width: 680px)').matches;
      dialog.showModal();
      document.body.classList.add('support-dialog-open');
    }
    (customTriggers.length ? customTriggers : [trigger]).forEach(function (button) {
      button.addEventListener("click", function () {
        openSupport();
      });
    });
    if (customTriggers.length && window.location.hash === "#support") {
      openSupport();
    }
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      document.body.classList.remove("support-dialog-open");
    });
  }

  if (document.body) initializeSupport();
  else document.addEventListener("DOMContentLoaded", initializeSupport);
})();
