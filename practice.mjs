import {shuffle} from './core.mjs?v=38';

export const ratingLabels={known:'Biliyorum',unsure:'Kararsızım',repeat:'Tekrar et'};
export function ratingSummary(ids,ratings={}){
 const result={known:0,unsure:0,repeat:0,new:0};
 for(const id of ids)result[Object.hasOwn(ratingLabels,ratings[id])?ratings[id]:'new']++;
 return result;
}
export function focusIds(ids,ratings={}){return ids.filter(id=>ratings[id]!=='known').sort((a,b)=>({repeat:0,unsure:1}[ratings[a]]??2)-({repeat:0,unsure:1}[ratings[b]]??2));}
export function reviewQueue(ids,ratings={},random=Math.random){
 const weighted=ids.flatMap(id=>Array({repeat:4,unsure:2}[ratings[id]]||1).fill(id));
 const pending=shuffle(weighted,random),result=[];
 while(pending.length){let i=pending.findIndex(id=>id!==result.at(-1));if(i<0)i=0;result.push(pending.splice(i,1)[0]);}
 return result;
}

const clean=s=>String(s).normalize('NFC').replace(/\*/g,'').replace(/[“”„]/g,'"').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'');
const lower=s=>clean(s).toLocaleLowerCase('de-DE');
const article=s=>{const m=/^(der|die|das|ein|eine|einen|einem|einer|eines|den|dem|des)\s+(.+)$/i.exec(clean(s));return m?{article:m[1],word:m[2]}:{article:'',word:clean(s)};};
export function answerForms(word){
 const raw=clean(word.de),forms=[raw];
 for(let part of raw.split(/\s+(?:\/|=)\s+/)){
  part=part.replace(/\s*\((?:Sg\.?|Pl\.?|Singular|Plural|nur Pl\.?|nur Sg\.?)\)\s*/gi,' ').trim();
  if(/^(der|die|das)\s/i.test(part))part=part.split(',')[0].trim();
  if(part)forms.push(part);
 }
 return [...new Set(forms)].sort((a,b)=>a.length-b.length);
}
// Only German spelling equivalents are tolerated. Other missing/wrong letters remain errors.
export function germanEquivalent(expected,typed){
 const alternatives={ä:'(?:ä|a|ae)',ö:'(?:ö|o|oe)',ü:'(?:ü|u|ue)',ß:'(?:ß|ss)',a:'(?:a|ä)',o:'(?:o|ö)',u:'(?:u|ü)'};
 const pattern=Array.from(lower(expected)).map(c=>alternatives[c]||c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
 return new RegExp('^'+pattern+'$','u').test(lower(typed));
}
export function letterDiff(expected,typed){
 const a=Array.from(clean(expected)),b=Array.from(clean(typed));
 const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
 for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(lower(a[i-1])===lower(b[j-1])?0:1));
 let i=a.length,j=b.length;const correct=[],entered=[];
 while(i||j){if(i&&j&&d[i][j]===d[i-1][j-1]+(lower(a[i-1])===lower(b[j-1])?0:1)){const wrong=lower(a[i-1])!==lower(b[j-1]);correct.unshift({text:a[--i],wrong});entered.unshift({text:b[--j],wrong});}else if(i&&d[i][j]===d[i-1][j]+1)correct.unshift({text:a[--i],wrong:true});else entered.unshift({text:b[--j],wrong:true});}
 return {distance:d[a.length][b.length],correct,entered};
}
export function evaluateWritten(word,typed){
 const forms=answerForms(word),value=clean(typed).slice(0,240);
 const exact=forms.find(s=>lower(s)===lower(value));
 const equivalent=exact||forms.find(s=>germanEquivalent(s,value));
 const expected=equivalent||[...forms].sort((a,b)=>letterDiff(a,value).distance-letterDiff(b,value).distance)[0];
 const target=article(expected),input=article(value);
 const articleError=!!target.article&&lower(target.article)!==lower(input.article);
 const wordCorrect=germanEquivalent(target.word,input.word);
 return {correct:!!equivalent&&!!value,expected,typed:value,spellingNotice:!!equivalent&&!exact,articleError,expectedArticle:target.article,enteredArticle:input.article,wordCorrect,diff:letterDiff(target.word,input.word)};
}
export function firstLetterHint(word){const form=article(answerForms(word)[0]);return `${form.article?form.article+' ':''}${Array.from(form.word)[0]||''}…`;}
