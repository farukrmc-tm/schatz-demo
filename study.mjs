import {shuffle} from './core.mjs?v=38';

// A learning round ends after two consecutive correct answers per entry.
// Incorrect entries go to the end of the queue, leaving other words between retries.
export function createLearningRound(ids, random=Math.random) {
  return {queue:shuffle(ids,random),streaks:Object.fromEntries(ids.map(id=>[id,0])),mastered:[]};
}
export function takeLearningWord(round) {
  return round.queue.shift() || null;
}
export function recordLearningAnswer(round,id,correct) {
  if(!(id in round.streaks)||round.mastered.includes(id))return;
  round.streaks[id]=correct?round.streaks[id]+1:0;
  if(round.streaks[id]>=2)round.mastered.push(id);
  else if(!round.queue.includes(id))round.queue.push(id);
}
export function lessonShareText(lesson,words) {
  const course=lesson.source.startsWith('daily-')?'Günlük Hayat':lesson.source==='a2'?'A2':'TestDaF';
  return `WortAtlas · ${course} · Ünite ${lesson.category} · Set ${lesson.setNumber}\n${words.length} kelime ve ifade\n\n`+
    words.map((w,i)=>`${i+1}. ${w.de.replace(/\*/g,'')} — ${w.tr}`).join('\n');
}
