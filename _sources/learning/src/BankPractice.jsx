import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,Info,CheckCircle} from '@phosphor-icons/react';
import catalog from './bank-api/catalog.json';
import {content} from './bank-api/api.js';
import {Button} from './Button.jsx';
import {createPracticePlan} from './engine/exam-session.js';
import {parseRichBlocks} from './engine/question-content.js';
import {QuestionResponse,CUSTOM_RESPONSE_TYPES} from './BankQuestionResponse.jsx';
import {emptyBankSession,readBankSession,writeBankSession} from './bank-session.js';
const empty=emptyBankSession;
const text=v=>typeof v==='string'?v:v?.explanation||v?.reason||v?.text||'';
const label=c=>typeof c==='string'?c:c?.text||c?.label||'';

function RichText({value,lang}){return <div lang={lang}>{parseRichBlocks(value).map((block,i)=>block.type==='table'?<div className="comparison-wrap" key={i}><table><thead><tr>{block.headers.map((h,j)=><th key={j}>{h}</th>)}</tr></thead><tbody>{block.rows.map((row,j)=><tr key={j}>{row.map((c,k)=><td key={k}>{c}</td>)}</tr>)}</tbody></table></div>:<p key={i} className={lang?.startsWith('ja')?'japanese-text':undefined}>{block.text}</p>)}</div>}
export function BankPractice({defaultCert='aws'}){
 const [certId,setCertId]=useState(defaultCert);
 if(!['http://localhost:8797','http://127.0.0.1:8797','https://thangldw.github.io'].includes(window.location.origin))return <section className="study-page"><h1>Luyện câu hỏi & chữa bài</h1><p>Mở bản đã kết nối ngân hàng câu hỏi để bắt đầu luyện và xem lời giải.</p><a className="ui-button" href="http://localhost:8797/">Mở bản đã kết nối</a></section>;
 return <BankSession key={certId} certId={certId} onChangeCert={setCertId}/>;
}
function BankSession({certId,onChangeCert}){
 const [initial]=useState(()=>readBankSession(certId));const [session,setSession]=useState(initial.session),[saved,setSaved]=useState(initial.available);
 const [index,setIndex]=useState(null),[section,setSection]=useState(''),[size,setSize]=useState('5'),[question,setQuestion]=useState(null),[feedback,setFeedback]=useState(null),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const feedbackRef=useRef(null),alive=useRef(true);const meta=catalog.certifications.find(c=>c.id===certId);
 useEffect(()=>{alive.current=true;let current=true;setBusy('index');content('/index',{certId}).then(d=>{if(current)setIndex(d)}).catch(e=>{if(current)setError(e.message)}).finally(()=>{if(current)setBusy('')});return()=>{current=false;alive.current=false}},[certId]);
 useEffect(()=>{const r=writeBankSession(certId,session);setSaved(r.ok)},[session,certId]);
 function update(p){setSession(s=>({...s,...p}))}
 async function fetchPrompt(ids,position){setBusy('prompt');setError('');try{const records=await content('/prompts',{certId,ids:[ids[position]]});if(!alive.current)return false;if(!records?.[0])throw Error('Không tìm thấy câu hỏi.');setQuestion(records[0]);setFeedback(null);return true}catch(e){if(alive.current)setError(e.message);return false}finally{if(alive.current)setBusy('')}}
 async function start(){
  const scoped=(index?.questions||[]).filter(q=>!section||(q.sectionId||q.section)===section);
  const plan=createPracticePlan({id:certId,questions:scoped},{},{strategy:'mixed',questionCount:Number(size),sessionMode:'study'});
  if(!plan.questionIds.length){setError('Chưa có câu hỏi trong phạm vi này.');return}
  if(await fetchPrompt(plan.questionIds,0))setSession({...empty(),ids:plan.questionIds});
 }
 async function resume(){await fetchPrompt(session.ids,session.position)}
 async function check(){
  const response=session.responses[question.id]||[];
  if(!response.length||response.every(v=>String(v).trim()==='')){setError('Hãy nhập hoặc chọn đáp án trước khi kiểm tra.');return}
  setBusy('answer');setError('');try{
   const d=await content('/feedback',{certId,id:question.id,response});if(!alive.current)return;
   if(d.result==='invalid'){setError('Câu trả lời chưa đầy đủ hoặc chưa đúng định dạng.');return}
   setFeedback(d.feedback);update({results:{...session.results,[question.id]:d.result}});requestAnimationFrame(()=>feedbackRef.current?.focus());
  }catch(e){if(alive.current)setError(e.message)}finally{if(alive.current)setBusy('')}
 }
 async function next(){if(session.position+1===session.ids.length){update({finished:true});setQuestion(null);setFeedback(null);return}const n=session.position+1;if(await fetchPrompt(session.ids,n))update({position:n})}
 const response=question?session.responses[question.id]||[]:[],result=question?session.results[question.id]:null;
 const multiple=['multiple','multiple_choice'].includes(question?.type),custom=CUSTOM_RESPONSE_TYPES.has(question?.type);
 const rubricValue=feedback?.rubric||feedback?.response?.rubric;const rubric=Array.isArray(rubricValue)?rubricValue:rubricValue?[rubricValue]:[];
 const chosen=feedback?.answer||[];const sections=[...new Map((index?.questions||[]).map(q=>[q.sectionId||q.section,q.section||q.sectionId])).entries()];
 const totals=Object.values(session.results);const scored=totals.filter(r=>['correct','wrong'].includes(r));
 const active=Boolean(session.ids.length&&!session.finished);
 return <section className="study-page bank-practice"><p className="eyebrow">NGÂN HÀNG CÂU HỎI HIỆN CÓ</p><h1>Luyện câu hỏi & chữa bài</h1><p className="lead">Tải câu hỏi từ hệ thống nội dung. Đáp án và lời giải được mở khi kiểm tra.</p>
 <div className="bank-setup"><label>Chứng chỉ<select aria-label="Chứng chỉ luyện tập" value={certId} disabled={!!busy} onChange={e=>onChangeCert(e.target.value)}>{catalog.certifications.map(c=><option key={c.id} value={c.id} disabled={c.id==='pmp'}>{c.shortName}{c.id==='pmp'?' — dùng workspace riêng':''}</option>)}</select></label><p>{meta?.name}</p></div>
 <p className="muted" role="status">{saved?'Đã lưu vị trí, lựa chọn và kết quả trong trình duyệt.':'Không lưu được tiến độ. Hãy giữ tab này mở.'} Đề, đáp án và lời giải không được lưu vào dữ liệu tiến độ.</p>
 {error&&<div className="error" role="alert"><p>{error}</p>{!question&&<Button onClick={()=>active?resume():window.location.reload()} disabled={!!busy}>Thử lại</Button>}</div>}
 {busy&&<p role="status">{busy==='index'?'Đang tải danh mục câu hỏi…':busy==='prompt'?'Đang tải câu hỏi…':'Đang kiểm tra đáp án…'}</p>}
 {!question&&!active&&!session.finished&&index&&<><div className="bank-setup"><label>Hạng mục<select value={section} onChange={e=>setSection(e.target.value)}><option value="">Tất cả hạng mục</option>{sections.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Số câu<select value={size} onChange={e=>setSize(e.target.value)}>{[5,10,20].map(n=><option key={n} value={n}>{n} câu</option>)}</select></label></div><p>{(index.questions||[]).filter(q=>!section||(q.sectionId||q.section)===section).length} câu trong phạm vi đã chọn. Số câu thực tế có thể ít hơn yêu cầu.</p><Button primary disabled={!!busy||!index.questions?.length} onClick={start}>Bắt đầu luyện<ArrowRight/></Button>{!index.questions?.length&&<div className="scope-note"><Info/><p>Chứng chỉ này chưa có ngân hàng câu hỏi được phục vụ qua API. Các tài liệu học có thể nằm ở workspace riêng.</p></div>}</>}
 {!question&&active&&<div className="resume-strip"><p>Phiên đang dở: câu {session.position+1}/{session.ids.length}. Lựa chọn của bạn vẫn được giữ.</p><Button primary disabled={!!busy} onClick={resume}>Tiếp tục phiên luyện</Button></div>}
 {question&&<><div className="section-heading"><span className="tag">Câu {session.position+1}/{session.ids.length}</span><span>{question.section}</span></div>
 {question.imageUrl&&<img className="bank-source-image" src={question.imageUrl} alt="Hình trong câu hỏi"/>}{question.audioUrl&&<audio controls src={question.audioUrl}>Trình duyệt không hỗ trợ phát âm thanh.</audio>}
 <RichText value={question.passage||question.content?.passage} lang={question.locale}/><RichText value={question.prompt} lang={question.locale}/>
 {custom?<fieldset disabled={!!busy||!!feedback||!!result}><QuestionResponse disabled={!!busy||!!feedback||!!result} question={question} value={response} onChange={v=>update({responses:{...session.responses,[question.id]:v}})}/></fieldset>:question.choices?.length?<fieldset disabled={!!busy||!!feedback||!!result}><legend>{multiple?'Chọn các đáp án phù hợp':'Chọn một đáp án'}</legend>{question.choices.map((c,i)=><label className={`answer-option ${response.includes(i)?'selected':''}`} key={i}><input type={multiple?'checkbox':'radio'} name={question.id} checked={response.includes(i)} onChange={()=>{setError('');update({responses:{...session.responses,[question.id]:multiple?(response.includes(i)?response.filter(v=>v!==i):[...response,i]):[i]}})}}/><span lang={question.locale}>{label(c)}</span></label>)}</fieldset>:<div className="scope-note"><Info/><div><p>Câu này cần chế độ trả lời chuyên biệt. Mở workspace gốc để làm đúng định dạng.</p><a href={`https://thangldw.github.io/${meta?.slug||certId}/`} target="_blank" rel="noreferrer">Mở workspace gốc</a><Button onClick={next} disabled={!!busy}>Bỏ qua câu chưa hỗ trợ</Button></div></div>}
 {(custom||question.choices?.length)&&<Button primary onClick={check} disabled={!!busy||!!feedback}>{result&&!feedback?'Tải lại lời giải':'Kiểm tra đáp án'}</Button>}
 {feedback&&<div className="feedback" ref={feedbackRef} tabIndex={-1}><h2><CheckCircle/>{result==='correct'?'Đáp án đúng':result==='wrong'?'Cần xem lại':'Câu trả lời cần tự đối chiếu'}</h2>{chosen.length>0&&<p>Đáp án tham khảo: {chosen.map(i=>question.choices?.[i]?label(question.choices[i]):String(i)).join(' · ')}</p>}<RichText value={feedback.explanation} lang={question.locale}/>{rubric.length>0&&<section><h3>Tiêu chí tự đối chiếu</h3><p>Đọc từng tiêu chí và so sánh với câu trả lời của bạn. Bài viết không được chấm đúng/sai tự động.</p><ul>{rubric.map((criterion,i)=><li key={i}><RichText value={typeof criterion==='string'?criterion:criterion.description||criterion.label||criterion.text||''} lang={question.locale}/></li>)}</ul></section>}{feedback.vietnamese?.explanation&&<details className="translation"><summary>Giải thích tiếng Việt</summary><RichText value={feedback.vietnamese.explanation} lang="vi"/></details>}{Array.isArray(feedback.choiceExplanations)&&feedback.choiceExplanations.map((e,i)=><div className="answer-reason" key={i}><strong>Lựa chọn {Number.isInteger(e?.choiceIndex)?e.choiceIndex+1:i+1}</strong><RichText value={text(e)} lang={question.locale}/></div>)}{feedback.memoryCue&&<p><strong>Gợi nhớ:</strong> {text(feedback.memoryCue)}</p>}{Array.isArray(feedback.references)&&feedback.references.length>0&&<section><h3>Tài liệu tham khảo</h3><ul className="sources">{feedback.references.map((reference,i)=>{const url=typeof reference==='string'?reference:reference?.url;const title=typeof reference==='string'?reference:reference?.title||reference?.label||url;return <li key={i}>{typeof url==='string'&&/^https?:\/\//.test(url)?<a href={url} target="_blank" rel="noreferrer">{title}</a>:<span>{title||text(reference)}</span>}</li>})}</ul></section>}<p className="muted">Kết quả luyện tập không phải điểm thi quy đổi.</p></div>}
 <div className="actions"><Button onClick={()=>{setQuestion(null);setFeedback(null)}} disabled={!!busy}>Lưu & quay lại</Button>{feedback&&<Button primary onClick={next} disabled={!!busy}>{session.position+1===session.ids.length?'Kết thúc phiên':'Câu tiếp theo'}<ArrowRight/></Button>}</div></>}
 {session.finished&&<><h2>Kết quả phiên luyện</h2><div className="result-rows"><div><strong>Câu được chấm</strong><span>{scored.length}</span></div><div><strong>Đúng</strong><span>{scored.filter(r=>r==='correct').length}/{scored.length}</span></div><div><strong>Cần tự đối chiếu</strong><span>{totals.filter(r=>r==='self_check_required').length}</span></div></div><p>Phiên này không xác nhận độ phủ toàn kỳ thi hoặc khả năng đỗ.</p><Button primary onClick={()=>setSession(empty())}>Chọn phiên mới</Button></>}
 </section>
}
