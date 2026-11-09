// Shared miniature illustrations for topic cards and set headers.
const topics=new Set(["1.1","1.2","1.3","2.1","2.2","2.3","2.4","2.5","3.1","3.2","3.3","3.4","3.5","4.1","4.2","4.3","4.4","4.5","4.6","4.7","4.8","4.9","4.10","5.1","5.2","5.3"]);
export function topicArt(id){
 if(!topics.has(id))return '';
 const asset=id.replace('.', '-');
 return `<img class="topic-illustration" data-topic-art="${id}" src="./illustrations/topics/${asset}.webp" width="640" height="480" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
}
