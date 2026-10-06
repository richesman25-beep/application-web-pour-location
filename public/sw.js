/* Cache public installation assets only. Business data and API requests stay on the network. */
const CACHE='lokasyon-lakay-install-v1';
const PUBLIC_ASSETS=['/offline.html','/images/logo-lokasyon-lakay.png','/images/app-icon.png','/images/app-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lokasyon-lakay-install-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await caches.match('/offline.html')||Response.error()));return;}
 if(PUBLIC_ASSETS.includes(url.pathname)&&!url.search){event.respondWith(fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}return response;}).catch(async()=>await caches.match(request)||Response.error()));}
});
