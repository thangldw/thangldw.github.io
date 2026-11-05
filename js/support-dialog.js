(function () {
  "use strict";

  function normalizedPath() {
    var path = window.location.pathname.replace(/index\.html$/, "");
    return path.endsWith("/") ? path : path + "/";
  }

  function shouldShowSupport() {
    return true;
  }

  function dialogMarkup() {
    return '<dialog class="support-dialog" id="supportDialog" aria-labelledby="supportDialogTitle" aria-describedby="supportDialogIntro">' +
      '<div class="support-dialog-shell">' +
        '<button class="support-dialog-close" id="supportClose" type="button" aria-label="Close support options">&times;</button>' +
        '<header class="support-dialog-heading"><h2 id="supportDialogTitle">Found this useful? Fuel my next build.</h2>' +
          '<p id="supportDialogIntro">Help cover AI credits and hosting so I can keep improving these free apps.</p></header>' +
        '<div class="support-options">' +
          '<section class="support-international" aria-label="International support options">' +
            '<article class="support-kofi">' +
              '<h3>Global</h3><figure><span class="support-qr-crop"><img src="/assets/support-kofi.png" width="820" height="820" alt="QR code to support Thang Luu on Ko-fi"></span></figure>' +
            '</article>' +
          '</section>' +
          '<article class="support-option support-bank">' +
            '<h3>Vietnam</h3>' +
            '<figure><img src="/assets/support-shopeepay.jpg" width="1096" height="1096" alt="ShopeePay QR for voluntary support"></figure>' +
          '</article>' +
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
    trigger.innerHTML = '<span>Fuel my next build</span>';

    var supportCopy = {
      en: {
        trigger: 'Fuel my next build', title: 'Found this useful? Fuel my next build.',
        intro: 'Help cover AI credits and hosting so I can keep improving these free apps.',
        close: 'Close support options', global: 'Global', vietnam: 'Vietnam',
        international: 'International support options', kofi: 'QR code to support Thang Luu on Ko-fi',
        shopee: 'ShopeePay QR for voluntary support'
      },
      vi: {
        trigger: 'Tiếp sức cho dự án mới', title: 'Bạn thấy hữu ích? Tiếp sức cho dự án mới.',
        intro: 'Góp phần trang trải chi phí AI và hosting để tôi tiếp tục cải thiện các ứng dụng miễn phí này.',
        close: 'Đóng hộp hỗ trợ', global: 'Quốc tế', vietnam: 'Việt Nam',
        international: 'Các cách hỗ trợ quốc tế', kofi: 'Mã QR ủng hộ Thang Luu qua Ko-fi',
        shopee: 'Mã QR ShopeePay để ủng hộ tự nguyện'
      },
      ja: {
        trigger: '次の開発を応援する', title: '役に立ちましたか？次の開発を応援する。',
        intro: '無料アプリの改善を続けるため、AIの利用料やサーバー費用へのご支援をお願いします。',
        close: '支援方法を閉じる', global: '海外から', vietnam: 'ベトナム国内',
        international: '海外からの支援方法', kofi: 'Ko-fiでThang Luuを支援するQRコード',
        shopee: '任意の支援用ShopeePay QRコード'
      },
      zh: {
        trigger: '支持我的下一个项目', title: '觉得有用？支持我的下一个项目。',
        intro: '帮助分担 AI 和服务器费用，让我能继续改进这些免费应用。',
        close: '关闭支持选项', global: '国际', vietnam: '越南',
        international: '国际支持方式', kofi: '通过 Ko-fi 支持 Thang Luu 的二维码',
        shopee: '用于自愿支持的 ShopeePay 二维码'
      }
    };
    function syncSupportLanguage() {
      var language = document.documentElement.lang.toLowerCase().split('-')[0];
      var copy = supportCopy[language] || supportCopy.en;
      var buttons = customTriggers.length ? customTriggers : [trigger];
      buttons.forEach(function (button) {
        var text = button.querySelector('span');
        if (text) text.textContent = copy.trigger;
        else button.textContent = copy.trigger;
        button.setAttribute('aria-label', copy.trigger);
      });
      if (!dialog) return;
      dialog.lang = supportCopy[language] ? document.documentElement.lang : 'en';
      dialog.querySelector('#supportDialogTitle').textContent = copy.title;
      dialog.querySelector('#supportDialogIntro').textContent = copy.intro;
      closeButton.setAttribute('aria-label', copy.close);
      dialog.querySelector('.support-international').setAttribute('aria-label', copy.international);
      dialog.querySelector('.support-kofi h3').textContent = copy.global;
      dialog.querySelector('.support-bank h3').textContent = copy.vietnam;
      dialog.querySelector('.support-kofi img').alt = copy.kofi;
      dialog.querySelector('.support-bank img').alt = copy.shopee;
    }
    new MutationObserver(syncSupportLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    var slot = document.getElementById('supportSlot');
    document.body.insertAdjacentHTML("beforeend", dialogMarkup());
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
    syncSupportLanguage();
    if (!dialog || typeof dialog.showModal !== "function") return;

    function openSupport() {
      syncSupportLanguage();
      dialog.showModal();
      document.body.classList.add('support-dialog-open');
    }
    (customTriggers.length ? customTriggers : [trigger]).forEach(function (button) {
      button.addEventListener("click", function () {
        openSupport();
      });
    });
    if (window.location.hash === "#support") {
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
