import {newProgress} from './core.mjs?v=38';
const copy=x=>JSON.parse(JSON.stringify(x));
export function applyOperation(p,e){p._clocks||={};p._favorites||={};
 if(e.kind==='answer'||e.kind==='seed-word'){
  const w=p.words[e.wordId]||={correct:0,wrong:0,match:0,test:0};
  if(e.kind==='answer'){if(e.correct){w.correct++;w[e.mode]++;}else w.wrong++;w.last=Math.max(w.last||0,e.at);p.days[e.day]=(p.days[e.day]||0)+1;}
  else{const m=Math.max(w.match,e.value.match),t=Math.max(w.test,e.value.test);w.match=m;w.test=t;w.correct=m+t;w.wrong=Math.max(w.wrong,e.value.wrong);w.last=Math.max(w.last||0,e.value.last||0);}
 }else if(e.kind==='rating'){p.ratings||={};const key='rating:'+e.wordId;if(e.at>=(p._clocks[key]||0)){p.ratings[e.wordId]=e.value;p._clocks[key]=e.at;}}else if(e.kind==='seed-day')p.days[e.day]=Math.max(p.days[e.day]||0,e.value);
 else if(e.kind==='complete-set'){p.completedSets||={};const key='set:'+e.setId;if(e.at>=(p._clocks[key]||0)){p.completedSets[e.setId]=e.value;p._clocks[key]=e.at;}}
 else if(e.kind==='favorite'){const key='fav:'+e.wordId;if(e.at>=(p._clocks[key]||0)){p._favorites[e.wordId]=e.value;p._clocks[key]=e.at;}}
 else if(e.kind==='meta'&&e.at>=(p._clocks[e.key]||0)){if(e.key==='matchSession')p.matchSession=e.value;else p.settings[e.key]=e.value;p._clocks[e.key]=e.at;}
 p.favorites=Object.entries(p._favorites).filter(([,value])=>!!value).map(([key])=>key);return p;
}
export function seedOperations(p,at=Date.now()){
 const result=[];for(const [wordId,w]of Object.entries(p.words||{}))if(w.match||w.test||w.wrong)result.push({kind:'seed-word',wordId,value:{match:w.match||0,test:w.test||0,wrong:w.wrong||0,last:w.last||0},at});
 for(const [day,value]of Object.entries(p.days||{}))if(value)result.push({kind:'seed-day',day,value,at});
 for(const [setId,value]of Object.entries(p.completedSets||{}))if(value)result.push({kind:'complete-set',setId,value:true,at});
 for(const [wordId,value]of Object.entries(p.ratings||{}))if(['known','unsure','repeat'].includes(value))result.push({kind:'rating',wordId,value,at});
 for(const wordId of p.favorites||[])result.push({kind:'favorite',wordId,value:true,at});
 for(const key of ['sound','theme'])if(p.settings?.[key]!==undefined)result.push({kind:'meta',key,value:p.settings[key],at});
 if(p.matchSession)result.push({kind:'meta',key:'matchSession',value:p.matchSession,at});return result;
}
export class CloudProgress{
 constructor({user,legacy,onState,onStatus}){this.user=user;this.onState=onState;this.onStatus=onStatus;this.key='wortatlas-cloud-v2:'+user.id;this.state={snapshot:{...newProgress(),_favorites:{},_clocks:{}},queue:[],seeded:false};this.busy=false;this.status='connecting';this.timer=null;this.legacy=legacy;this.storageError=false;
  try{const value=JSON.parse(localStorage.getItem(this.key));if(value?.snapshot&&Array.isArray(value.queue))this.state=value;}catch{}
 }
 save(){try{localStorage.setItem(this.key,JSON.stringify(this.state));}catch{this.storageError=true;}}
 restrict({wordIds,setIds}){
  const clean=p=>{p={...newProgress(),...p,settings:{...newProgress().settings,...p?.settings}};p.words=Object.fromEntries(Object.entries(p.words||{}).filter(([id])=>wordIds.has(id)));p.ratings=Object.fromEntries(Object.entries(p.ratings||{}).filter(([id])=>wordIds.has(id)));p.favorites=(p.favorites||[]).filter(id=>wordIds.has(id));p.completedSets=Object.fromEntries(Object.entries(p.completedSets||{}).filter(([id,value])=>setIds.has(id)&&value));p._favorites=Object.fromEntries(Object.entries(p._favorites||{}).filter(([id])=>wordIds.has(id)));p._clocks=Object.fromEntries(Object.entries(p._clocks||{}).filter(([key])=>{const word=key.match(/^(?:rating|fav):(.+)$/),set=key.match(/^set:(.+)$/);return (!word||wordIds.has(word[1]))&&(!set||setIds.has(set[1]));}));if(p.matchSession){const ids=p.matchSession.ids?.filter(id=>wordIds.has(id))||[];p.matchSession=ids.length?{...p.matchSession,ids}:null;}p.xp=0;return p;};
  const allowed=e=>{if(e.wordId&&!wordIds.has(e.wordId))return false;if(e.setId&&!setIds.has(e.setId))return false;if(e.kind==='meta'&&e.key==='matchSession'&&e.value&&!e.value.ids.every(id=>wordIds.has(id)))return false;return true;};
  this.allowed={wordIds,setIds};this.state.snapshot=clean(this.state.snapshot);this.legacy=clean(this.legacy);this.state.queue=this.state.queue.filter(allowed);this.save();this.emit();
 }
 statusChange(status){this.status=status;this.onStatus?.(status,this.state.queue.length,this.storageError);}
 emit(){const p=copy(this.state.snapshot);for(const e of this.state.queue)applyOperation(p,e);this.onState(p);}
 async request(method,events){if(navigator.onLine===false)throw new Error('offline');const response=await fetch('/api/progress',{method,cache:'no-store',credentials:'same-origin',headers:method==='POST'?{'Content-Type':'application/json','X-WortAtlas-Account':this.user.id}:{},body:events?JSON.stringify({events}):undefined,signal:AbortSignal.timeout(12000),keepalive:method==='POST'});if(response.status===409)throw new Error('account_mismatch');if(response.status===401)throw new Error('signin');if(!response.ok)throw new Error('sync:'+response.status);const data=await response.json();if(data.user?.id!==this.user.id)throw new Error('account_mismatch');return data;}
 enqueue(event,{schedule=true}={}){const e={...event,id:crypto.randomUUID(),at:event.at??Date.now()};this.state.queue.push(e);this.save();this.emit();this.statusChange('pending');if(schedule)this.schedule();return e;}
 meta(key,value){this.enqueue({kind:'meta',key,value});}
 importProgress(p,at=Date.now()){for(const e of seedOperations(p,at))this.enqueue(e,{schedule:false});this.schedule();}
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),500);}
 async start(){
  if(!this.state.seeded){let owner=null;try{owner=localStorage.getItem('wortatlas-legacy-owner');}catch{}if(!owner||owner===this.user.id){this.importProgress(this.legacy,1);try{localStorage.setItem('wortatlas-legacy-owner',this.user.id);}catch{}}clearTimeout(this.timer);this.state.seeded=true;this.save();}
  this.emit();try{const data=await this.request('GET');this.state.snapshot=data.progress;this.save();this.emit();this.statusChange(this.state.queue.length?'pending':'saved');await this.flush();}catch(e){this.statusChange(['signin','account_mismatch'].includes(e.message)?'signin':'offline');}
  window.addEventListener('online',()=>this.refresh());window.addEventListener('focus',()=>this.refresh());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.flush();else this.refresh();});setInterval(()=>{if(!document.hidden)this.refresh();},45000);
 }
 async flush(){if(this.busy)return;if(!this.state.queue.length){if(this.status!=='offline')this.statusChange('saved');return;}this.busy=true;this.statusChange('syncing');try{while(this.state.queue.length){const batch=[];for(const e of this.state.queue){if(batch.length>=10||JSON.stringify({events:[...batch,e]}).length>55000)break;batch.push(e);}if(!batch.length)throw new Error('event_too_large');const data=await this.request('POST',batch);const ack=new Set(data.ack);this.state.queue=this.state.queue.filter(e=>!ack.has(e.id));this.state.snapshot=data.progress;this.save();this.emit();}this.statusChange('saved');}catch(e){this.statusChange(['signin','account_mismatch'].includes(e.message)?'signin':'offline');}finally{this.busy=false;}}
 async refresh(){if(this.busy)return;if(this.state.queue.length)return this.flush();this.busy=true;try{const data=await this.request('GET');this.state.snapshot=data.progress;this.save();this.emit();this.statusChange('saved');}catch(e){this.statusChange(['signin','account_mismatch'].includes(e.message)?'signin':'offline');}finally{this.busy=false;if(this.state.queue.length)this.schedule();}}
}
