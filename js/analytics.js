(function () {
  "use strict";

  var PRODUCTION_HOST = "thangldw.github.io";
  var WEBSITE_ID = "5edb5825-85d4-4685-8b8c-2b8c32361d6c";

  if (window.location.hostname !== PRODUCTION_HOST) return;
  if (document.querySelector("script[data-website-id='" + WEBSITE_ID + "']")) return;

  var tracker = document.createElement("script");
  tracker.defer = true;
  tracker.src = "https://cloud.umami.is/script.js";
  tracker.dataset.websiteId = WEBSITE_ID;
  tracker.dataset.domains = PRODUCTION_HOST;
  document.head.appendChild(tracker);
})();
