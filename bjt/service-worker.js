const APP_BASE = "/bjt/";
const SHELL_CACHE = "bjt-shell-96c9e74f05bbab27";
const PRECACHE_URLS = [
  "/cert/assets/AppShell-Bl3dNDla.css",
  "/cert/assets/AppShell-Cmf2pf3l.js",
  "/cert/assets/CertificationViews-CZFCbdxh.js",
  "/cert/assets/CertificationViews-rutjcLFs.css",
  "/cert/assets/ExperienceWorkspace-CgnHLX4G.js",
  "/cert/assets/ExperienceWorkspace-D-4YcN02.css",
  "/cert/assets/FlowCanvas-3HyTJvJl.js",
  "/cert/assets/FlowCanvas-DLioOiRN.css",
  "/cert/assets/fonts/InterVariable.woff2",
  "/cert/assets/index-CJgKGTA7.js",
  "/cert/assets/index-GonsR_LT.css",
  "/cert/assets/jlpt-strict-resume-BgC18pZq.js",
  "/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/cert/assets/question-response-z8QgKWUK.js",
  "/cert/pwa/icon-192.png",
  "/cert/pwa/icon-512.png",
  "/cert/pwa/icon-maskable-512.png",
  "/cert/theme-init.js",
  "/bjt/index.html",
  "/bjt/manifest.webmanifest"
];
const SHELL_URLS = new Set(PRECACHE_URLS);
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('bjt-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(APP_BASE+'protected-data/')||url.pathname.startsWith(APP_BASE+'question-media/'))return;
 if(SHELL_URLS.has(url.pathname)){event.respondWith(caches.open(SHELL_CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.pathname.startsWith(APP_BASE))event.respondWith(fetch(request).catch(()=>caches.match(APP_BASE+'index.html')));
});
