const APP_BASE = "/g-kentei/";
const SHELL_CACHE = "g-kentei-shell-0a96d5f8a3acb726";
const PRECACHE_URLS = [
  "/cert/assets/AppShell-BZfg-Vk_.js",
  "/cert/assets/AppShell-Bl3dNDla.css",
  "/cert/assets/CertificationViews-DiIGKs5N.js",
  "/cert/assets/CertificationViews-rutjcLFs.css",
  "/cert/assets/ExperienceWorkspace-CQNtPyuK.js",
  "/cert/assets/ExperienceWorkspace-yCiFdpId.css",
  "/cert/assets/FlowCanvas-DLioOiRN.css",
  "/cert/assets/FlowCanvas-DoyvyBoi.js",
  "/cert/assets/fonts/InterVariable.woff2",
  "/cert/assets/index-U_niqUOD.css",
  "/cert/assets/index-nSe0jCo0.js",
  "/cert/assets/jlpt-strict-resume-DnIwNoxg.js",
  "/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/cert/assets/question-response-DHcORlsZ.js",
  "/cert/pwa/icon-192.png",
  "/cert/pwa/icon-512.png",
  "/cert/pwa/icon-maskable-512.png",
  "/cert/theme-init.js",
  "/g-kentei/index.html",
  "/g-kentei/manifest.webmanifest"
];
const SHELL_URLS = new Set(PRECACHE_URLS);
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('g-kentei-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(APP_BASE+'protected-data/')||url.pathname.startsWith(APP_BASE+'question-media/'))return;
 if(SHELL_URLS.has(url.pathname)){event.respondWith(caches.open(SHELL_CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.pathname.startsWith(APP_BASE))event.respondWith(fetch(request).catch(()=>caches.match(APP_BASE+'index.html')));
});
