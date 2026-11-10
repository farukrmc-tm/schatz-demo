
const CACHE='schatz-offline-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  try{return await fetch(event.request);}
  catch(error){
   const cache=await caches.open(CACHE);
   const hit=event.request.mode==='navigate'?await cache.match(new URL('index.html',self.registration.scope).href):await cache.match(event.request,{ignoreSearch:true});
   if(hit)return hit;
   return new Response('Bu içerik çevrimdışı kullanım için indirilmedi.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
