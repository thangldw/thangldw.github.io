import {escapeStudyText} from '../study-workspace/text.js';
export function renderQuestionPrompt(question) {
 const text=String(question?.prompt||'');
 const ranges=Array.isArray(question?.targetRanges)?question.targetRanges:[];
 let cursor=0,html='';
 for(const range of ranges){
  if(!Array.isArray(range)||range.length!==2)continue;
  const [start,end]=range;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<cursor||end<=start||end>text.length)continue;
  html+=escapeStudyText(text.slice(cursor,start))+`<u class="question-target">${escapeStudyText(text.slice(start,end))}</u>`;
  cursor=end;
 }
 return html+escapeStudyText(text.slice(cursor));
}

export function questionInstruction(question) {
 if(question?.mode==='recall')return '';
 return ({'kanji-reading':'下線の言葉の読み方として最もよいものを一つ選びなさい。','vocabulary-context':'（　）に入れるのに最もよいものを一つ選びなさい。','vocabulary-paraphrase':'下線の言葉に意味が最も近いものを一つ選びなさい。','vocabulary-usage':'この言葉の使い方として最もよいものを一つ選びなさい。'})[question?.skill]||'';
}
