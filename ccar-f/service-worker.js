const APP_BASE = "/ccar-f/";
const SHELL_CACHE = "ccar-f-shell-82027e50f2332be9";
const PRECACHE_URLS = [
  "/assets/learning/assets/AppShell-Bl3dNDla.css",
  "/assets/learning/assets/AppShell-Cs8Wfm9M.js",
  "/assets/learning/assets/CertificationViews-JVbEtMja.js",
  "/assets/learning/assets/CertificationViews-rutjcLFs.css",
  "/assets/learning/assets/ExperienceWorkspace-BhFtx0TR.js",
  "/assets/learning/assets/ExperienceWorkspace-yCiFdpId.css",
  "/assets/learning/assets/FlowCanvas-DLioOiRN.css",
  "/assets/learning/assets/FlowCanvas-SJrdExKY.js",
  "/assets/learning/assets/fonts/InterVariable.woff2",
  "/assets/learning/assets/index-B1Ad7ELl.js",
  "/assets/learning/assets/index-BQu2Pz9L.css",
  "/assets/learning/assets/jlpt-strict-resume-DhiSPGXH.js",
  "/assets/learning/assets/jsx-runtime-Cltr0gcK.js",
  "/assets/learning/assets/question-response-BQBjYSd9.js",
  "/assets/learning/pwa/icon-192.png",
  "/assets/learning/pwa/icon-512.png",
  "/assets/learning/pwa/icon-maskable-512.png",
  "/assets/learning/theme-init.js",
  "/ccar-f/index.html",
  "/ccar-f/manifest.webmanifest"
];
const SHELL_URLS = new Set(PRECACHE_URLS);
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('ccar-f-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith(APP_BASE+'protected-data/')||url.pathname.startsWith(APP_BASE+'question-media/'))return;
 if(SHELL_URLS.has(url.pathname)){event.respondWith(caches.open(SHELL_CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true}))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.pathname.startsWith(APP_BASE))event.respondWith(fetch(request).catch(()=>caches.match(APP_BASE+'index.html')));
});
