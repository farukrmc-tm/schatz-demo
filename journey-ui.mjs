import {topicArt} from './topic-art.mjs?v=38';
const names={
 egitim:['Eğitim ve bilim','Schule · Studium · Wissenschaft'],
 insan:['İnsan ve sağlık','Ernährung · Körper · Gesundheit'],
 yasam:['Günlük yaşam','Beziehungen · Arbeit · Freizeit'],
 toplum:['Toplum ve dünya','Gesellschaft · Wirtschaft · Technik'],
 doga:['Doğa ve çevre','Natur · Biologie · Chemie']
};

export function buildParts(data,lessons){
 return data.sources.map((source,i)=>({...source,number:i+1,title:source.title||names[source.id]?.[0]||source.name,subtitle:source.subtitle||names[source.id]?.[1]||'',lessons:lessons.filter(l=>l.source===source.id),units:data.categories.filter(c=>c.group===source.id).map((c,j)=>({...c,number:j+1,lessons:lessons.filter(l=>l.source===source.id&&l.category===c.id)}))}));
}

export function groupProgress(group,state){
 const entries=group.lessons.map(l=>state.byId.get(l.id)),done=entries.filter(e=>e.complete).length;
 return {done,total:entries.length,percent:Math.round(done/entries.length*100),complete:done===entries.length,unlocked:entries[0]?.unlocked===true};
}

const theme=id=>id;
const art=id=>`<img class="category-illustration" src="./illustrations/category-${theme(id)}.webp" width="768" height="576" alt="" aria-hidden="true" decoding="async">`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function courseTopics({part,state,icon}){
 const total=groupProgress(part,state),completed=part.units.filter(u=>groupProgress(u,state).complete).length;
 return `<section class="part-topics-page">
 <header class="part-topics-heading"><div><span class="eyebrow">TESTDAF · ${part.number}. KISIM</span><h1>${esc(part.title)}</h1><p>Bu bölümde <strong>${part.units.length} konu</strong> var. Çalışmak istediğin konuyu seç.</p><div class="part-topic-totals"><span>${part.lessons.reduce((n,l)=>n+l.ids.length,0)} kelime</span><span>${total.total} set</span></div></div><div class="part-heading-art">${art(part.id)}</div></header>
 <div class="topics-return-row"><button class="topics-return" data-action="nav" data-view="learn" aria-label="Tüm bölümlere geri dön">${icon('back')}<span>Tüm bölümler</span></button></div>
 <div class="topic-list-heading"><h2>Konular</h2><span>${completed} / ${part.units.length} konu tamamlandı</span></div>
 <div class="topic-selection-grid" aria-label="${esc(part.title)} konuları">${part.units.map((u,i)=>{
  const g=groupProgress(u,state),current=g.unlocked&&!g.complete,previous=part.units[i-1];
  const status=g.complete?'Tamamlandı':current?(g.done?'Devam edebilirsin':'Başlamaya hazır'):'Kilitli';
  const lockMessage=previous?`Önce ${previous.title} konusunu tamamla.`:'Önce bir önceki bölümü tamamla.';
  return `<button class="topic-selection-card ${g.complete?'is-complete':current?'is-current':'is-locked'}" data-action="${g.unlocked?'open-unit':'locked'}" data-id="${u.id}" data-message="${esc(lockMessage)}" aria-disabled="${!g.unlocked}" aria-label="${esc(u.title)}, ${u.count} kelime, ${g.total} set, ${status}">
   <span class="topic-card-top"><span class="topic-order">${String(u.number).padStart(2,'0')} · KONU</span><span class="topic-card-status">${icon(g.complete?'check':g.unlocked?'arrow':'lock')}</span></span>
   <span class="topic-card-main"><span class="topic-card-copy"><strong>${esc(u.title)}</strong><span lang="de">${esc(u.de)}</span><span class="topic-card-count">${u.count} kelime <span>·</span> ${g.total} set</span></span><span class="topic-card-art">${topicArt(u.id)}</span></span>
   <span class="topic-card-progress"><span><span>${g.done} / ${g.total} set tamamlandı</span><strong>%${g.percent}</strong></span><span class="progress-track" role="progressbar" aria-label="${esc(u.title)} ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${g.percent}"><span style="width:${g.percent}%"></span></span></span>
   <span class="topic-card-footer">${g.unlocked?`<span>${status}</span><span>${g.complete?'Tekrar et':g.done?'Devam et':'Konuyu aç'} ${icon('arrow')}</span>`:`${icon('lock')}<span>${esc(lockMessage)}</span>`}</span>
  </button>`;
 }).join('')}</div>
 <p class="topic-unlock-note">${icon('spark')} Tüm konular açık. İstediğin konudan başlayabilirsin.</p></section>`;
}

export function coursePath({part,unit,state,icon,words=[],recent=null}){
 const gp=groupProgress(unit,state),items=unit.lessons,lookup=new Map(words.map(w=>[w.id,w]));
 const last=items.find(l=>l.id===recent&&!state.byId.get(l.id).complete),current=last||items.find(l=>!state.byId.get(l.id).complete);
 return `<section class="set-library"><div class="library-toolbar"><button class="back-link" data-action="open-part" data-id="${part.id}">${icon('back')} Tüm konular</button><span>SCHATZ <i>/</i> TESTDAF</span></div>
 <header class="library-hero"><div><span class="eyebrow">${esc(part.title)}</span><h1>${esc(unit.title)}</h1><p>${unit.count} kelime · ${items.length} set</p></div><div class="library-art">${topicArt(unit.id)}</div></header>
 <div class="library-progress"><div class="progress-track" role="progressbar" aria-label="Konu ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${gp.percent}"><span style="width:${gp.percent}%"></span></div><p>${gp.done} / ${items.length} set tamamlandı</p></div>
 ${current?`<button class="library-resume" data-action="lesson" data-id="${current.id}"><span><small>${last?'KALDIĞIN YERDEN':'KEŞFETMEYE DEVAM'}</small><strong>Set ${String(current.setNumber).padStart(2,'0')}</strong><span>${current.ids.length} kelime</span></span><span class="library-resume-cta">${last?'Devam et':'Başla'} ${icon('arrow')}</span></button>`:''}
 <div class="library-heading"><h2>Kelime setlerin</h2><span>${items.length} set</span></div><div class="lesson-list">${items.map(l=>{const st=state.byId.get(l.id),active=l.id===current?.id;return `<button class="lesson-row ${st.complete?'is-done':active?'is-current':''}" data-action="lesson" data-id="${l.id}" aria-label="Set ${l.setNumber}, ${l.ids.length} kelime${st.complete?', tamamlandı':''}"><span class="lesson-number">${st.complete?icon('check'):String(l.setNumber).padStart(2,'0')}</span><span class="lesson-copy"><span class="lesson-row-heading"><strong>Set ${l.setNumber}</strong><small>${l.ids.length} kelime</small></span><span class="lesson-preview" lang="de">${l.ids.slice(0,2).map(id=>esc(lookup.get(id)?.de||'')).join(' · ')}</span><span class="lesson-status">${st.complete?'Tamamlandı':active?'Buradan devam et':'Çalışmaya hazır'}</span></span><span class="lesson-arrow">${icon('arrow')}</span></button>`;}).join('')}</div>
 ${gp.complete?`<div class="library-complete">${icon('check')} Bu konudaki tüm setleri tamamladın.<button class="link-btn" data-action="unit-picker">Tüm konular ${icon('arrow')}</button></div>`:''}</section>`;
}

export function courseHome({parts,state,icon,sync,reviewCount=0,savedCount=0,recent=null}){
 const current=state.current,part=parts.find(p=>p.lessons.some(l=>l.id===current.id)),unit=part.units.find(u=>u.id===current.category);
 const done=groupProgress(unit,state),allDone=state.completed===state.entries.length;
 return `<section class="course-home atelier-home"><header class="atelier-mast"><div><span class="eyebrow">MERHABA, FARUK</span><h1>TestDaF kelime atölyen.</h1></div><button class="icon-btn" data-action="settings" aria-label="Ayarlar">${icon('settings')}</button></header><div class="home-launch-grid"><section class="study-hero"><div class="study-hero-copy"><span class="hero-kicker"><i></i>${allDone?'TEKRAR ZAMANI':state.completed?'KALDIĞIN YERDEN':'BUGÜNKÜ İLK ADIM'}</span><h2>${esc(unit.title)}</h2><p>${current.ids.length} kelime <span>·</span> Set ${current.setNumber}</p><button class="primary" data-action="lesson" data-id="${current.id}">${state.completed?'Çalışmaya devam et':'Öğrenmeye başla'} ${icon('arrow')}</button></div><div class="study-hero-art">${art(part.id)}</div><div class="hero-unit-progress"><span>${done.done} / ${done.total} set</span><div class="progress-track"><span style="width:${done.percent}%"></span></div></div></section><div class="home-shortcuts"><button data-action="downloads"><span class="shortcut-icon mint">${icon('download')}</span><span><strong>Yanında götür</strong><small>Çevrimdışı çalış</small></span>${icon('chevron')}</button></div></div>${recent&&recent.id!==current.id?`<button class="recent-set" data-action="lesson" data-id="${esc(recent.id)}">${icon('clock')}<span>Son açtığın set<strong>${esc(recent.title)}</strong></span>${icon('arrow')}</button>`:''}${reviewCount?`<button class="review-shortcut" data-action="review-start"><span class="review-icon">${icon('reset')}</span><span><strong>Bir kez daha bakalım</strong><small>Tekrar bekleyen ${reviewCount} kelime</small></span>${icon('arrow')}</button>`:''}<div class="atelier-section-heading"><div><span class="eyebrow">TESTDAF</span><h2>Bölümlerini keşfet</h2></div><span class="section-count">${state.completed} set tamamlandı</span></div><div class="part-grid">${parts.map(p=>{const g=groupProgress(p,state);return `<button class="part-card theme-${theme(p.id)} ${g.unlocked?'':'is-locked'}" data-action="${g.unlocked?'open-part':'locked'}" data-id="${p.id}" aria-disabled="${!g.unlocked}"><span class="part-upper"><span class="part-kicker">${String(p.number).padStart(2,'0')} · KISIM</span><span class="part-status">${icon(g.complete?'check':g.unlocked?'arrow':'lock')}</span></span><span class="part-middle"><span><strong>${p.title}</strong><span class="part-subtitle">${p.units.length} konu · ${g.total} set</span></span><span class="part-art">${art(p.id)}</span></span><span class="progress-track"><span style="width:${g.percent}%"></span></span></button>`}).join('')}</div><footer class="atelier-footer">${sync}<button class="link-btn" data-action="downloads">${icon('download')} Çevrimdışı bölümler</button></footer></section>`;
}
