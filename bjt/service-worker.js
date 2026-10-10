const APP_BASE = "/bjt/";
const SHELL_CACHE = "bjt-shell-32022bab61f13be1";
const PRECACHE_URLS = [
  "/assets/learning/assets/AppShell-Bl3dNDla.css",
  "/assets/learning/assets/AppShell-C-2OlFec.js",
  "/assets/learning/assets/CertificationViews-X9BvsNJC.js",
  "/assets/learning/assets/CertificationViews-rutjcLFs.css",
  "/assets/learning/assets/ExperienceWorkspace-KP1sbg-Z.js",
  "/assets/learning/assets/ExperienceWorkspace-yCiFdpId.css",
  "/assets/learning/assets/FlowCanvas-CddnKGtz.js",
  "/assets/learning/assets/FlowCanvas-DLioOiRN.css",
  "/assets/learning/assets/fonts/InterVariable.woff2",
  "/assets/learning/assets/index-BQu2Pz9L.css",
  "/assets/learning/assets/index-_U2FV28T.js",
  "/assets/learning/assets/jlpt-strict-resume-CImrp3fS.js",
  "/assets/learning/assets/jsx-runtime-Cltr0gcK.js",
  "/assets/learning/assets/question-response-CenXL3-_.js",
  "/assets/learning/pwa/icon-192.png",
  "/assets/learning/pwa/icon-512.png",
  "/assets/learning/pwa/icon-maskable-512.png",
  "/assets/learning/theme-init.js",
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
