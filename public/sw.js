/* Only the application shell is cached here. Authenticated data stays in the account's Firestore cache. */
const ASSETS=__PRECACHE__;
const CACHE='lokasyon-shell-'+__VERSION__;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('lokasyon-shell-')||key.startsWith('lokasyon-lakay-install-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);const shell=await cache.match('/index.html');if(shell){const html=(await shell.text()).replace('<head>','<head><script>window.__LOKASYON_OFFLINE__=true;</script>');return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});}return await cache.match('/offline.html')||Response.error();}));return;}
 if(ASSETS.includes(url.pathname)&&!url.search){event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(url.pathname)||fetch(request)));}
});
