const CACHE='schatz-offline-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const request=event.request;
  const media=['image','font'].includes(request.destination)||/\.(?:webp|png|jpe?g|svg|gif|avif|ico|woff2?|ttf)$/i.test(u.pathname);
  const refresh=request.cache==='reload'||request.cache==='no-store';
  const cache=await caches.open(CACHE).catch(()=>null);
  if(media&&!refresh&&cache){
   const hit=await cache.match(request,{ignoreSearch:true}).catch(()=>null);
   if(hit)return hit;
  }
  try{
   const response=await fetch(request);
   if(media&&response.ok&&cache&&request.cache!=='no-store')await cache.put(request,response.clone()).catch(()=>{});
   return response;
  }catch(error){
   const hit=cache?await (request.mode==='navigate'?cache.match(new URL('index.html',self.registration.scope).href):cache.match(request,{ignoreSearch:true})).catch(()=>null):null;
   if(hit)return hit;
   return new Response('Bu içerik çevrimdışı kullanım için indirilmedi.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
