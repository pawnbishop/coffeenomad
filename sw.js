// Coffee Nomad service worker: network first, falls back to the last good copy when offline.
const V="cn-v11";
const SHELL=["./","index.html","styles.css","app.js","manifest.webmanifest","icon-192.png","logo.png","logo-dark.png","mark.png","mark-dark.png","favicon-32.png","assets/v60-poster.jpg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{if(r.status===200){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp)).catch(()=>{})}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("index.html"))))});
