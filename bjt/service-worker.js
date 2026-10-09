const APP_BASE = "/bjt/";
const SHELL_CACHE = "bjt-shell-6c6114f968dd5ab5";
const PRECACHE_URLS = [
  "/cert/assets/AppShell-Bl3dNDla.css",
  "/cert/assets/AppShell-C9i9L0yN.js",
  "/cert/assets/CertificationViews-BAN7tkCv.js",
  "/cert/assets/CertificationViews-rutjcLFs.css",
  "/cert/assets/ExperienceWorkspace-B-OQczmR.js",
  "/cert/assets/ExperienceWorkspace-BYcUrSIc.css",
  "/cert/assets/FlowCanvas--GSmrlKR.js",
  "/cert/assets/FlowCanvas-DLioOiRN.css",
  "/cert/assets/fonts/InterVariable.woff2",
  "/cert/assets/index-GonsR_LT.css",
  "/cert/assets/index-_XYdStTd.js",
  "/cert/assets/jlpt-strict-resume-CoPpDPjR.js",
  "/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/cert/assets/question-response-DyBk3YbB.js",
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
