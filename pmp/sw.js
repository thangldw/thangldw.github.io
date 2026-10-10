const CACHE='pmp-studio-api-ee83b868fe5105af785f840c-dfda36504403';const FILES=['./','./index.html','./style.css?v=dfda36504403','./workspace.css?v=dfda36504403','./app.js?v=dfda36504403','./manifest.webmanifest','./icon.svg','/css/tokens.css','/css/site-shell.css?v=20261007brandstates','/assets/fonts/InterVariable.woff2'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pmp-studio-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{let url=new URL(e.request.url);url.hash='';let allowed=FILES.map(f=>new URL(f,self.registration.scope).href);if(e.request.method==='GET'&&allowed.includes(url.href))e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>caches.match(e.request))) });

self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_SHELL')self.skipWaiting()});
