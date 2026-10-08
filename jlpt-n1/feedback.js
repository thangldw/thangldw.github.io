const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = value => String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '');
const labels = {explanation:'Giải thích',vietnamese:'Tiếng Việt',japanese:'日本語',meaning:'Nghĩa',reading:'Cách đọc',word:'Từ',full:'Câu hoàn chỉnh',grammar:'Ngữ pháp',order:'Thứ tự',steps:'Cách ghép câu',anchor:'Bằng chứng trong bài',traps:'Bẫy lựa chọn',translation:'Bản dịch',vocabulary:'Từ trong bài',thinking:'Mạch suy luận',synonyms:'Từ gần nghĩa',collocations:'Kết hợp từ',distractors:'Phân biệt đáp án sai',examples:'Ví dụ',reason:'Lý do',notes:'Ghi chú',confusions:'Dễ nhầm',parts:'Cấu tạo chữ',sourceFields:'Cách đọc · nghĩa · ví dụ',vi:'Tiếng Việt',vn:'Tiếng Việt',jp:'日本語',h:'Cách đọc',r:'Cách đọc',k:'Từ',m:'Nghĩa',co:'Kết hợp từ',sy:'Từ gần nghĩa',s:'Ví dụ',ex:'Ví dụ',p:'Từ loại',opts:'Lựa chọn',term:'Từ',mean:'Nghĩa',set:'Kết hợp từ',setv:'Nghĩa kết hợp từ',j:'日本語',v:'Tiếng Việt',choices:'Đối chiếu các từ',correctOrder:'Thứ tự đúng',kanji:'Chữ',on:'Âm on',kun:'Âm kun',hanviet:'Hán Việt',wrong_explained:'Phân biệt cách đọc'};
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
function content(value, source) {
  if (!present(value)) return '';
  if (Array.isArray(value)) return `<ul class="study-list">${value.filter(present).map(item=>row(item,source)).join('')}</ul>`;
  if (typeof value === 'object') return facts(entries(value),source);
  return `<p class="study-text">${escape(text(value))}</p>`;
}
function facts(items, source) {
  return `<dl class="study-facts">${items.map(([key,value])=>`<div><dt>${escape(key==='r'&&source==='n1-grammar-exams'?'Giải thích':labels[key]||key)}</dt><dd>${content(value,source)}</dd></div>`).join('')}</dl>`;
}
const secondary = new Set(['translation','vocabulary','parts','confusions','wrong_explained','distractors','traps','notes','sourceFields']);
function sections(items, source) {
  return items.map(([key,value])=> {
    const label=key==='r'&&source==='n1-grammar-exams'?'Giải thích':labels[key]||key;
    const body=content(value,source);
    if (secondary.has(key)) return `<details class="study-detail"><summary>${escape(label)}</summary>${body}</details>`;
    return `<section class="study-section"><h3>${escape(label)}</h3>${body}</section>`;
  }).join('');
}
export function renderExplanation(value, {source='',word='',answer=''}={}) {
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
