const APP_BASE = "/fp3/";
const SHELL_CACHE = "fp3-shell-3935f6e4be689c17";
const PRECACHE_URLS = [
  "/cert/assets/AppShell-Bl3dNDla.css",
  "/cert/assets/AppShell-CyXyGTjs.js",
  "/cert/assets/CertificationViews-BESgpx0G.js",
  "/cert/assets/CertificationViews-rutjcLFs.css",
  "/cert/assets/ExperienceWorkspace-BMVdJlZL.css",
  "/cert/assets/ExperienceWorkspace-d9GAZQ8H.js",
  "/cert/assets/FlowCanvas-DLioOiRN.css",
  "/cert/assets/FlowCanvas-oXu6wQpj.js",
  "/cert/assets/fonts/InterVariable.woff2",
  "/cert/assets/index-C9Ol1dtB.css",
  "/cert/assets/index-rXast9ul.js",
  "/cert/assets/jlpt-strict-resume-H9YUmy5l.js",
  "/cert/assets/jsx-runtime-Cltr0gcK.js",
  "/cert/assets/question-response-Cm3pa_t5.js",
  "/cert/pwa/icon-192.png",
  "/cert/pwa/icon-512.png",
  "/cert/pwa/icon-maskable-512.png",
  "/cert/theme-init.js",
  "/fp3/index.html",
  "/fp3/manifest.webmanifest"
];
const SHELL_URLS = new Set(PRECACHE_URLS);
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('fp3-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(APP_BASE+'protected-data/')||url.pathname.startsWith(APP_BASE+'question-media/'))return;
 if(SHELL_URLS.has(url.pathname)){event.respondWith(caches.open(SHELL_CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.pathname.startsWith(APP_BASE))event.respondWith(fetch(request).catch(()=>caches.match(APP_BASE+'index.html')));
});
