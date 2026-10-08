const APP_BASE = "/cert/";
const SHELL_CACHE = "cert-shell-504186d24d7ae831";
const PRECACHE_URLS = [
  "/cert/assets/AppShell-Bl3dNDla.css",
  "/cert/assets/AppShell-BnjCi6jw.js",
  "/cert/assets/CertificationViews-DI_ORJr-.js",
  "/cert/assets/CertificationViews-rutjcLFs.css",
  "/cert/assets/ExperienceWorkspace-CuZkn4DX.js",
  "/cert/assets/ExperienceWorkspace-D-4YcN02.css",
  "/cert/assets/FlowCanvas-DLioOiRN.css",
  "/cert/assets/FlowCanvas-DhqeQkz1.js",
  "/cert/assets/fonts/InterVariable.woff2",
  "/cert/assets/index-BM2SJFj2.js",
  "/cert/assets/index-GonsR_LT.css",
  "/cert/assets/jlpt-strict-resume-DOf0Rxhx.js",
  "/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/cert/assets/question-response-CpsKP0SE.js",
  "/cert/index.html",
  "/cert/manifest.webmanifest",
  "/cert/pwa/icon-192.png",
  "/cert/pwa/icon-512.png",
  "/cert/pwa/icon-maskable-512.png",
  "/cert/theme-init.js"
];
const SHELL_URLS = new Set(PRECACHE_URLS);
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('cert-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(APP_BASE+'protected-data/')||url.pathname.startsWith(APP_BASE+'question-media/'))return;
 if(SHELL_URLS.has(url.pathname)){event.respondWith(caches.open(SHELL_CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.pathname.startsWith(APP_BASE))event.respondWith(fetch(request).catch(()=>caches.match(APP_BASE+'index.html')));
});
