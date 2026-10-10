const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = value => String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '');
const labels = {explanation:'Giải thích',vietnamese:'Tiếng Việt',japanese:'日本語',meaning:'Nghĩa',reading:'Cách đọc',word:'Từ',full:'Câu hoàn chỉnh',grammar:'Ngữ pháp',order:'Thứ tự',steps:'Cách ghép câu',anchor:'Bằng chứng trong bài',traps:'Bẫy lựa chọn',translation:'Bản dịch',vocabulary:'Từ trong bài',thinking:'Mạch suy luận',synonyms:'Từ gần nghĩa',collocations:'Kết hợp từ',distractors:'Phân biệt đáp án sai',examples:'Ví dụ',reason:'Lý do',notes:'Ghi chú',confusions:'Dễ nhầm',parts:'Cấu tạo chữ',sourceFields:'Cách đọc · nghĩa · ví dụ',vi:'Tiếng Việt',vn:'Tiếng Việt',jp:'日本語',h:'Cách đọc',r:'Cách đọc',k:'Từ',m:'Nghĩa',co:'Kết hợp từ',sy:'Từ gần nghĩa',s:'Ví dụ',ex:'Ví dụ',p:'Từ loại',opts:'Lựa chọn',term:'Từ',mean:'Nghĩa',set:'Kết hợp từ',setv:'Nghĩa kết hợp từ',j:'日本語',v:'Tiếng Việt',choices:'Đối chiếu các từ',correctOrder:'Thứ tự đúng',kanji:'Chữ',on:'Âm on',kun:'Âm kun',hanviet:'Hán Việt',wrong_explained:'Phân biệt cách đọc'};
Object.assign(labels,{first:'Câu mở đầu',last:'Kết luận',link:'Liên kết ý',anchorWords:'Từ khóa trong bài',chain:'Chuỗi suy luận',main:'Hướng giải',jp:'日本語',vn:'Tiếng Việt',wrongs:'Phân biệt phương án sai',opt:'Phương án'});
const readingFieldNotes = {
 first:'Câu mở đầu đặt chủ đề hoặc vấn đề mà tác giả sẽ triển khai.',
 last:'Kết luận hoặc ý chốt giúp xác định thông điệp chính; đối chiếu với phần trước để tránh hiểu riêng lẻ.',
 link:'Từ nối và thành phần quy chiếu cho biết các ý bổ sung, đối lập, giải thích hay dẫn tới kết quả.',
 anchorWords:'Từ khóa giúp theo dõi chủ đề và phạm vi ý; một từ trùng đáp án chưa đủ để kết luận.',
 chain:'Chuỗi suy luận nối vấn đề, bằng chứng và kết luận để kiểm tra cách chọn đáp án.'
};
function readingColorLegend(){return '<dl class="reading-color-legend" aria-label="Chú thích màu phân tích"><div><dt><span class="reading-evidence">Vàng · Bằng chứng</span></dt><dd>Câu hoặc cụm từ làm căn cứ chọn đáp án. Đọc cả ngữ cảnh để kiểm tra phạm vi và phủ định.</dd></div><div><dt><span class="reading-relationship">Xanh · Liên kết ý</span></dt><dd>Từ nối hoặc thành phần liên kết các ý: đối lập, nguyên nhân–kết quả, điều kiện hoặc quy chiếu.</dd></div></dl>';}
function readingFieldNote(key){return readingFieldNotes[key]?`<p class="reading-field-note">${escape(readingFieldNotes[key])}</p>`:'';}
const metadata = new Set(['id','src','pri','examEligible','n','n1','source','round','years','sec']);
function present(value) {
  if (value == null || value === '') return false;
  if (Array.isArray(value)) return value.some(present);
  if (typeof value === 'object') return entries(value).length > 0;
  return typeof value !== 'string' || text(value).trim().length > 0;
}
function entries(value) {
  return Object.entries(value).filter(([key, item]) => !metadata.has(key) && !(key === 'p' && typeof item !== 'string') && present(item));
}
const first = (value, keys) => keys.find(key => present(value[key]));
function lexical(value, source) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const wordKey = first(value, ['word','k','term','kanji','jp','j']);
  const readingKey = first(value, source === 'n1-grammar-exams' ? ['reading','h','kana'] : ['reading','h','r','kana']);
  const meaningKey = first(value, ['meaning','m','vi','vn','mean','v']);
  if (!wordKey) return null;
  const used = new Set([wordKey, readingKey, meaningKey]);
  return {word:text(value[wordKey]),reading:readingKey?text(value[readingKey]):'',meaning:meaningKey?text(value[meaningKey]):'',rest:entries(value).filter(([key])=>!used.has(key))};
}
function row(value, source) {
  const item = lexical(value, source);
  if (!item) return `<li>${content(value, source)}</li>`;
  return `<li class="study-word-row"><div><strong lang="ja">${escape(item.word)}</strong>${item.reading?`<span class="study-reading" lang="ja">${escape(item.reading)}</span>`:''}</div>${item.meaning?`<p>${escape(item.meaning)}</p>`:''}${item.rest.length?facts(item.rest, source):''}</li>`;
}
function normalizeExplanationText(value){return String(value).replace(/\(Phân tích mỏ neo chi tiết sẽ bổ sung khi luyện đến bài này\.\)/gu,'Nguồn chưa có phân tích bằng chứng chi tiết cho câu này. Đối chiếu đáp án với đoạn đọc; ứng dụng không tự bổ sung phân tích chưa được kiểm chứng.');}
function safeInline(value){
 const allowed={anchor:'reading-evidence',kw:'reading-relationship',redflag:'reading-trap',truebait:'reading-relationship'};
 return String(value).split(/(<[^>]*>)/gu).map(part=>{
  if(!part.startsWith('<'))return escape(part);
  if(/^<br\s*\/?\s*>$/iu.test(part))return '<br>';
  if(/^<(?:b|strong)(?:\s[^>]*)?>$/iu.test(part))return '<strong>';
  if(/^<\/(?:b|strong)\s*>$/iu.test(part))return '</strong>';
  if(/^<u(?:\s[^>]*)?>$/iu.test(part))return '<u>';
  if(/^<\/u\s*>$/iu.test(part))return '</u>';
  const span=part.match(/^<span\s+[^>]*class=["']([^"']+)["'][^>]*>$/iu);
  if(span){const role=span[1].split(/\s+/u).find(c=>allowed[c]);return role?`<span class="${allowed[role]}">`:'<span>';}
  if(/^<\/span\s*>$/iu.test(part))return '</span>';
  return '';
 }).join('');
}
function content(value, source) {
  if (!present(value)) return '';
  if (Array.isArray(value)) return `<ul class="study-list">${value.filter(present).map(item=>row(item,source)).join('')}</ul>`;
  if (typeof value === 'object') return facts(entries(value),source);
  return `<p class="study-text">${safeInline(normalizeExplanationText(value))}</p>`;
}
function facts(items, source) {
  return `<dl class="study-facts">${items.map(([key,value])=>`<div><dt>${escape(key==='r'&&source==='n1-grammar-exams'?'Giải thích':labels[key]||key)}</dt><dd>${readingFieldNote(key)}${content(value,source)}</dd></div>`).join('')}</dl>`;
}
const secondary = new Set(['translation','vocabulary','parts','confusions','wrong_explained','distractors','traps','notes','sourceFields']);
function sections(items, source) {
  return items.map(([key,value])=> {
    const label=key==='r'&&source==='n1-grammar-exams'?'Giải thích':labels[key]||key;
    const body=content(value,source);
    if (secondary.has(key)) return `<details class="study-detail"><summary>${escape(label)}</summary>${body}</details>`;
    return `<section class="study-section"><h3>${escape(label)}</h3>${readingFieldNote(key)}${body}</section>`;
  }).join('');
}
function renderReadingAnalysis(analysis){
 const spans=analysis.anchors||[],bounds=[0,analysis.passage.length,...spans.flatMap(a=>[a.start,a.end])].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 const marked=bounds.slice(0,-1).map((start,i)=>{const end=bounds[i+1],roles=spans.filter(a=>a.start<=start&&a.end>=end).map(a=>a.role);const value=escape(analysis.passage.slice(start,end));return roles.length?`<mark class="reading-${roles.includes('evidence')?'evidence':'relationship'}">${value}</mark>`:value;}).join('');
 return `<section class="reading-analysis"><h3>Phân tích bằng chứng</h3>${readingColorLegend()}<div class="reading-analyzed-passage" lang="ja">${marked}</div><dl class="reading-anchor-notes">${spans.map(a=>`<div><dt>${a.role==='evidence'?'Bằng chứng':'Liên kết ý'}</dt><dd lang="ja">${escape(a.quote)}</dd></div>`).join('')}</dl><p lang="ja">${escape(analysis.japanese)}</p><p>${escape(analysis.vietnamese)}</p><details class="study-detail"><summary>Vì sao các phương án khác sai?</summary>${analysis.distractors.map(d=>`<div class="reading-distractor"><strong>Phương án ${d.choice+1}</strong><p lang="ja">${escape(d.japanese)}</p><p>${escape(d.vietnamese)}</p></div>`).join('')}</details></section>`;
}
function renderLegacyReading({passage,keywords=[]}){
 const input=text(passage),words=[...new Set(keywords.filter(w=>typeof w==='string'&&w))].sort((a,b)=>b.length-a.length);
 let result='',offset=0;
 while(offset<input.length){const word=words.find(w=>input.startsWith(w,offset));if(word){result+=`<mark class="reading-evidence">${escape(word)}</mark>`;offset+=word.length;}else result+=escape(input[offset++]);}
 return `<section class="study-section"><h3>Từ khóa trong đoạn đọc</h3>${readingColorLegend()}<p class="small">Từ khóa theo phân tích có sẵn trong nguồn. Vùng vàng đánh dấu từ khóa do nguồn chọn; cần đối chiếu cả câu để xác định bằng chứng cho đáp án.</p><div class="reading-analyzed-passage" lang="ja">${result}</div></section>`;
}
export function renderExplanation(value, {source='',word='',answer=''}={}) {
  if(value?.legacyReading){const {legacyReading,...rest}=value;return renderLegacyReading(legacyReading)+renderExplanation(rest,{source,word,answer});}
  if(value?.analysis)return renderReadingAnalysis(value.analysis)+sections(entries(value).filter(([key])=>key!=='analysis'),source);
  if (value?.materials) return value.materials.map((material,index)=>index===0?renderExplanation(material.content,{source:material.source||source,word,answer}):present(material.content)?`<details class="study-detail"><summary>Ví dụ và cách dùng bổ sung ${index}</summary>${renderExplanation(material.content,{source:material.source||source})}</details>`:'').join('');
  if (!present(value) && word && !answer) return '<p class="study-text">Chưa có giải thích bổ sung cho mục này.</p>';
  if (!present(value)) return answer?`<div class="study-head"><span class="small">Đáp án</span><p class="study-word" lang="ja">${escape(answer)}</p></div>`:'';
  if (typeof value !== 'object' || Array.isArray(value)) return `${answer?`<div class="study-head"><span class="small">Đáp án</span><p class="study-word" lang="ja">${escape(answer)}</p></div>`:''}${content(value,source)}`;
  const item=lexical(value,source),readingKey=first(value,source==='n1-grammar-exams'?['reading','h']:['reading','h','r']),meaningKey=first(value,['meaning','m','vi','vn','mean']);
  const title=item?.word||answer||word;
  const reading=item?.reading||(readingKey?text(value[readingKey]):'');
  const meaning=item?.meaning||(meaningKey?text(value[meaningKey]):'');
  const rest=item?.rest||entries(value).filter(([key])=>!title||![readingKey,meaningKey].includes(key));
  return `${title?`<div class="study-head"><span class="small">${answer?'Đáp án':'Từ cần nhớ'}</span><div class="study-term"><p class="study-word" lang="ja">${escape(title)}</p>${reading?`<span class="study-reading" lang="ja">${escape(reading)}</span>`:''}</div>${meaning?`<p class="study-meaning">${escape(meaning)}</p>`:''}</div>`:''}<div class="study-sections">${sections(rest,source)}</div>`;
}
