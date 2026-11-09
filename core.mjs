export const normalize = s => String(s).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ı]/g,'i').replace(/\*/g,'').replace(/\s+/g,' ').trim();
export function shuffle(items, random=Math.random) {const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// Each visible card moves, including the replacement pair. Columns are shuffled
// independently so matching positions cannot be inferred from a shared rotation.
export function shuffleMatchColumns(left, right, random=Math.random) {
 const moved=(items,other=[])=>{
  if(items.length<2)return [...items];
  const allowed=candidate=>candidate.every((id,i)=>id!==items[i])&&
   (items.length<3||candidate.some((id,i)=>id!==other[i]));
  for(let attempt=0;attempt<32;attempt++){
   const candidate=shuffle(items,random);
   if(allowed(candidate))return candidate;
  }
  // Bounded fallback also works with deterministic or unusually repetitive RNG.
  for(let offset=1;offset<items.length;offset++){
   const candidate=[...items.slice(offset),...items.slice(0,offset)];
   if(allowed(candidate))return candidate;
  }
 };
 const nextLeft=moved(left.filter(Boolean));
 return {left:nextLeft,right:moved(right.filter(Boolean),nextLeft)};
}
export function displayTerm(word) {return word.de.replace(/\*/g,'');}
export function makeDeck(words, counts={}, limit=10, target=0) {const eligible=target ? words.filter(w=>(counts[w.id]||0)<target):words;return eligible.slice(0,limit==='all'?eligible.length:Number(limit)).map(w=>w.id);}
export function nextMatchId(ids, active, counts, target, previous=null, random=Math.random) {
 const available=ids.filter(id=>!active.includes(id) && (!target || (counts[id]||0)<target));
 if(!available.length)return null;
 const min=Math.min(...available.map(id=>counts[id]||0));
 let choices=available.filter(id=>(counts[id]||0)===min);
 if(choices.length>1)choices=choices.filter(id=>id!==previous);
 return choices[Math.floor(random()*choices.length)];
}
export function makeQuestion(word, words, direction='de-tr', random=Math.random) {
 const answer=direction==='de-tr'?'tr':'de',prompt=direction==='de-tr'?'de':'tr';
 const normAnswer=normalize(word[answer]);
 const normPrompt=normalize(word[prompt]);
 const labels=new Set([normAnswer]);
 // Exclude identical prompts and duplicate answer labels: each question has one valid choice.
 const candidates=shuffle(words,random).filter(w=>normalize(w[prompt])!==normPrompt && normalize(w[answer])!==normAnswer);
 const options=[{id:word.id,label:word[answer].replace(/\*/g,'')}];
 for(const w of candidates){const label=normalize(w[answer]);if(labels.has(label))continue;labels.add(label);options.push({id:w.id,label:w[answer].replace(/\*/g,'')});if(options.length===4)break;}
 return {wordId:word.id,prompt:word[prompt].replace(/\*/g,''),direction,options:shuffle(options,random)};
}
export function dayKey(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function getStreak(days, now=new Date()) {let date=new Date(now);date.setHours(12,0,0,0);if(!(days[dayKey(date)]>0))date.setDate(date.getDate()-1);let count=0;while(days[dayKey(date)]>0){count++;date.setDate(date.getDate()-1);}return count;}
export function newProgress(){return {version:1,words:{},days:{},favorites:[],completedSets:{},ratings:{},settings:{sound:true,theme:"dark"},matchSession:null,xp:0};}
export function recordAnswer(progress,id,correct,mode,date=new Date()) {
 const stat=progress.words[id] ||= {correct:0,wrong:0,match:0,test:0};
 if(correct){stat.correct++;stat[mode]++;}
 else stat.wrong++;
 stat.last=Date.now();progress.days[dayKey(date)]=(progress.days[dayKey(date)]||0)+1;return stat;
}
// Stable, topic-scoped set IDs prevent the old global 10-entry slices from mixing topics.
export function buildLessons(words){
 const lessons=[];let start=0;
 while(start<words.length){
  let end=start+1;const first=words[start];
  while(end<words.length&&words[end].source===first.source&&words[end].category===first.category)end++;
  const count=end-start,setCount=Math.max(1,Math.floor(count/10));
  for(let part=0;part<setCount;part++){
   const from=start+part*10,to=part===setCount-1?end:from+10,items=words.slice(from,to);
   lessons.push({id:`lesson:${first.source}:${first.category}:${part+1}`,number:lessons.length+1,setNumber:part+1,setCount,source:first.source,category:first.category,start:from+1,end:to,ids:items.map(w=>w.id),categories:[first.category]});
  }
  start=end;
 }
 return lessons;
}
export function lessonProgress(lesson,progress){
 const done=lesson.ids.reduce((n,id)=>n+Math.min(15,progress.words[id]?.match||0),0),target=lesson.ids.length*15,manual=!!progress.completedSets?.[lesson.id],practiced=done===target;
 return {done,target,practicePercent:Math.round(done/target*100),percent:manual?100:Math.round(done/target*100),complete:manual||practiced,manual,practiced};
}
export function curriculumState(lessons,progress){
 const entries=lessons.map(lesson=>({lesson,...lessonProgress(lesson,progress),unlocked:true}));
 return {entries,byId:new Map(entries.map(e=>[e.lesson.id,e])),current:entries.find(e=>e.unlocked&&!e.complete)?.lesson||lessons.at(-1),completed:entries.filter(e=>e.complete).length};
}
export function lessonRoute(lesson){return `set/${lesson.source}/${lesson.category}/${lesson.setNumber}`;}
export function resolveLessonRoute(parts,lessons,words){
 if(parts.length===3)return lessons.find(l=>l.source===parts[0]&&l.category===parts[1]&&String(l.setNumber)===parts[2])||null;
 // Old shared #set/N URLs are mapped by their original first word, never by a renumbered set.
 if(parts.length===1&&/^[1-9]\d*$/.test(parts[0])){const word=words[(Number(parts[0])-1)*10];return word?lessons.find(l=>l.ids.includes(word.id))||null:null;}
 return null;
}
