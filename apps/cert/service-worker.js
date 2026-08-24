const APP_BASE = "/apps/cert/";
const SHELL_CACHE = "cert-shell-618f402b928ae9b1";
const RUNTIME_CACHE = "cert-runtime-v1";
const PRECACHE_URLS = [
  "/apps/cert/assets/AppShell-0ou9uc6I.js",
  "/apps/cert/assets/AppShell-Bl3dNDla.css",
  "/apps/cert/assets/CertificationViews-ClCZWdEb.js",
  "/apps/cert/assets/CertificationViews-rutjcLFs.css",
  "/apps/cert/assets/ExperienceWorkspace-B63ZU5-W.js",
  "/apps/cert/assets/ExperienceWorkspace-DmZ0esOy.css",
  "/apps/cert/assets/FlowCanvas-BwgfvBkr.js",
  "/apps/cert/assets/FlowCanvas-DLioOiRN.css",
  "/apps/cert/assets/fonts/InterVariable.woff2",
  "/apps/cert/assets/index-D01asHKm.css",
  "/apps/cert/assets/index-DyYhbsT3.js",
  "/apps/cert/assets/jlpt-strict-resume-CsIHLQ_9.js",
  "/apps/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/apps/cert/assets/question-response-DU3EaWrE.js",
  "/apps/cert/index.html",
  "/apps/cert/manifest.webmanifest",
  "/apps/cert/pwa/icon-192.png",
  "/apps/cert/pwa/icon-512.png",
  "/apps/cert/pwa/icon-maskable-512.png",
  "/apps/cert/theme-init.js"
];
const SHELL_URLS = new Set(PRECACHE_URLS);

function cacheable(response) {
  return response.ok && response.type !== "opaque";
}

function isAnalyticsRequest(url) {
  return url.pathname === "/js/analytics.js" || url.pathname.startsWith("/analytics/");
}

async function fromShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  return (await cache.match(request, { ignoreSearch: true })) || fetch(request);
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return caches.match(`${APP_BASE}index.html`);
  }
}

async function cacheFirstRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== "opaque") await cache.put(request, response.clone());
  return response;
}

async function networkFirstRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (cacheable(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith("cert-shell-") && name !== SHELL_CACHE)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || isAnalyticsRequest(url)) return;

  if (request.mode === "navigate" && url.pathname.startsWith(APP_BASE)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (SHELL_URLS.has(url.pathname)) {
    event.respondWith(fromShell(request));
    return;
  }

  const protectedPack = url.pathname.startsWith(`${APP_BASE}protected-data/`) && url.pathname.endsWith(".cbk");
  const questionMedia = url.pathname.startsWith(`${APP_BASE}question-media/`);
  if (protectedPack || questionMedia) {
    event.respondWith(cacheFirstRuntime(request));
    return;
  }

  const sharedSiteAsset = url.pathname.startsWith("/css/") || url.pathname.startsWith("/js/");
  if (url.pathname.startsWith(APP_BASE) || sharedSiteAsset) {
    event.respondWith(networkFirstRuntime(request));
  }
});
