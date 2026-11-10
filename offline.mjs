
const CACHE='schatz-offline-v1',META='schatz-downloads-v1';
const base=new URL('./',import.meta.url),url=p=>new URL(p,base).href;
export const offlineSupported=()=>isSecureContext&&'serviceWorker'in navigator&&'caches'in globalThis;
export const offlineAccount=()=>null,forgetOfflineAccount=()=>{},rememberOfflineAccount=()=>{};
export const chapterKey=(course,category)=>course+':'+category;
let catalog=null;
async function cacheFile(cache,address){const r=await fetch(address,{cache:'reload'});if(!r.ok)throw new Error('Download failed: '+address);await cache.put(address,r.clone());return r;}
async function workerReady(){
 if(!offlineSupported())throw new Error('Offline unsupported');
 await navigator.serviceWorker.register(url('sw.js'),{scope:base.pathname});
 await navigator.serviceWorker.ready;
}
async function shell(cache){
 const seen=new Set();
 async function visit(address){
  address=new URL(address,base).href;if(seen.has(address)||new URL(address).origin!==base.origin)return;seen.add(address);
  const r=await cacheFile(cache,address),path=new URL(address).pathname;
  if(!/\.(html|mjs|css)$/.test(path))return;
  const text=await r.text();let refs=[];
  if(path.endsWith('.html'))refs=[...text.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]);
  if(path.endsWith('.mjs'))refs=[...text.matchAll(/(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g)].map(m=>m[1]);
  if(path.endsWith('.css'))refs=[...text.matchAll(/url\(\s*["']?([^"'\s)]+)["']?\s*\)/g)].map(m=>m[1]);
  for(const ref of refs)if(!ref.startsWith('data:')&&!ref.startsWith('#'))await visit(new URL(ref,address).href);
 }
 await visit(url('index.html'));
}
function metadata(){try{return JSON.parse(localStorage.getItem(META)||'{}');}catch{return {};}}
export async function validDownloads(){
 if(!offlineSupported())return {};
 const cache=await caches.open(CACHE),items=metadata(),valid={};
 for(const [key,item] of Object.entries(items))if(await cache.match(url('data.json'))&&await cache.match(item.image))valid[key]=item;
 return valid;
}
export async function loadCatalogs(){
 const address=url('data.json');
 try{const r=await fetch(address);if(!r.ok)throw new Error('catalog');catalog=await r.json();return {catalogs:[catalog],offline:navigator.onLine===false};}
 catch(e){if(!offlineSupported())throw e;const r=await (await caches.open(CACHE)).match(address);if(!r)throw e;catalog=await r.json();return {catalogs:[catalog],offline:true};}
}
export async function downloadChapter(account,course,category){
 await workerReady();const cache=await caches.open(CACHE);await shell(cache);
 const response=await cacheFile(cache,url('data.json'));catalog=await response.json();
 const c=catalog.categories.find(c=>c.id===category);if(!c)throw new Error('Unknown chapter');
 const image=url('illustrations/topics/'+category.replace('.','-')+'.webp');
 const img=await cacheFile(cache,image);
 for(const source of catalog.sources)await cacheFile(cache,url('illustrations/category-'+source.id+'.webp'));
 const items=metadata();items[chapterKey(course,category)]={course,category,title:c.title,image,bytes:(await img.blob()).size,downloadedAt:new Date().toISOString()};
 localStorage.setItem(META,JSON.stringify(items));
 if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);
 return validDownloads();
}
export async function removeDownload(account,course,category){
 const items=metadata(),key=chapterKey(course,category),item=items[key];
 if(item)await (await caches.open(CACHE)).delete(item.image);
 delete items[key];localStorage.setItem(META,JSON.stringify(items));return validDownloads();
}
if(offlineSupported())navigator.serviceWorker.register(url('sw.js'),{scope:base.pathname}).catch(()=>{});

export async function downloadEverything(onProgress=()=>{}){
 await workerReady();const cache=await caches.open(CACHE);
 onProgress(0,'Uygulama dosyaları hazırlanıyor');await shell(cache);
 const response=await cacheFile(cache,url('data.json'));catalog=await response.json();
 const images=[...catalog.sources.map(s=>url('illustrations/category-'+s.id+'.webp')),...catalog.categories.map(c=>url('illustrations/topics/'+c.id.replace('.','-')+'.webp')),url('icon-192.png'),url('icon-512.png')];
 const sizes=new Map();
 for(let i=0;i<images.length;i++){const r=await cacheFile(cache,images[i]);sizes.set(images[i],(await r.blob()).size);onProgress(Math.round((i+1)/images.length*95),'Kelimeler ve görseller indiriliyor');}
 const items={};
 for(const c of catalog.categories){const image=url('illustrations/topics/'+c.id.replace('.','-')+'.webp');items[chapterKey('testdaf',c.id)]={course:'testdaf',category:c.id,title:c.title,image,bytes:sizes.get(image)||0,downloadedAt:new Date().toISOString()};}
 localStorage.setItem(META,JSON.stringify(items));
 if(navigator.storage?.persist)await navigator.storage.persist().catch(()=>false);
 onProgress(100,'Çevrimdışı kullanım hazır');return validDownloads();
}
export async function removeEverything(){await caches.delete(CACHE);localStorage.removeItem(META);return {};}
