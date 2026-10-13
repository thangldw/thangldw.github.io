import React,{useEffect,useState} from 'react';
import {ArrowRight} from '@phosphor-icons/react';
import {loadBankIndex} from './bank-api/index.js';
import {readBankProgress,readBankSession} from './bank-session.js';
import {Button} from './Button.jsx';

export function BankInsights({certification:cert,view,onPractice}){
 const [index,setIndex]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [{session}]=useState(()=>readBankSession(cert.id));const [{progress,available}]=useState(()=>readBankProgress(cert.id));
 useEffect(()=>{let current=true;setIndex(null);setError('');if(cert.id==='pmp')return;loadBankIndex(cert.id).then(data=>{if(current)setIndex(data)}).catch(e=>{if(current)setError(e.message)});return()=>{current=false}},[cert.id,retry]);
 const active=session.ids.length>0&&!session.finished;
 const questions=index?.questions||[];
 const groups=[...new Map(questions.map(q=>[q.sectionId||q.section,{id:q.sectionId||q.section,name:q.section||q.sectionId}])).values()].map(g=>{
  const ids=questions.filter(q=>(q.sectionId||q.section)===g.id).map(q=>q.id);
  const records=ids.map(id=>progress[id]).filter(Boolean);
  return {...g,total:ids.length,seen:records.length,correct:records.filter(r=>r.result==='correct').length,wrong:records.filter(r=>r.result==='wrong').length,self:records.filter(r=>r.result==='self_check_required').length};
 });
 const known=questions.map(q=>progress[q.id]).filter(Boolean);
 const objective=known.filter(r=>r.result!=='self_check_required');
 const wrong=objective.filter(r=>r.result==='wrong').length;
 const correct=objective.length-wrong;
 const title={today:'Hôm nay',explore:'Tổng quan',readiness:'Kiểm tra tiến độ'}[view];
 return <section className="study-page bank-insights"><p className="eyebrow">{cert.shortName}</p><h1>{title}</h1>{!available&&<p className="error" role="alert">Không đọc được tiến độ trong trình duyệt.</p>}
 {cert.id==='pmp'?<a className="ui-button" href="https://thangldw.github.io/pmp/">Mở workspace PMP</a>:error?<div role="alert"><p>{error}</p><Button onClick={()=>setRetry(n=>n+1)}>Thử lại</Button></div>:!index?<p role="status">Đang tải danh mục câu hỏi…</p>:<>
 {view==='today'&&<><h2>{!questions.length?'Chưa có câu hỏi để luyện':active?'Tiếp tục phiên đang dở':wrong?'Ôn lại hạng mục còn sai':'Bắt đầu một phiên luyện'}</h2><p>{active?`Câu ${session.position+1}/${session.ids.length} · ${Object.keys(session.results).length} câu đã kiểm tra trong phiên.`:`${questions.length} câu hiện có · ${known.length} câu đã ghi nhận kết quả.`}</p><Button primary disabled={!questions.length} onClick={()=>onPractice('',active)}>{active?'Tiếp tục phiên luyện':'Luyện đề nhanh'}<ArrowRight/></Button>{!active&&groups.filter(g=>g.wrong>0).sort((a,b)=>b.wrong-a.wrong).slice(0,3).map(g=><article className="insight-row" key={g.id}><div><h3>{g.name}</h3><p>{g.wrong} câu sai ở lần làm gần nhất</p></div><Button onClick={()=>onPractice(g.id)}>Luyện hạng mục</Button></article>)}</>}
 {view==='readiness'&&<><div className="result-rows"><div><strong>Câu đã ghi nhận</strong><span>{known.length}/{questions.length}</span></div><div><strong>Lượt làm đã ghi nhận</strong><span>{known.reduce((sum,r)=>sum+r.attempts,0)}</span></div><div><strong>Đúng lần gần nhất</strong><span>{correct}</span></div><div><strong>Cần xem lại</strong><span>{wrong}</span></div><div><strong>Cần tự đối chiếu</strong><span>{known.length-objective.length}</span></div></div>{!known.length&&<p>Chưa có kết quả luyện của chứng chỉ này trong trình duyệt.</p>}<p className="muted">Thống kê theo câu hỏi đang có trong danh mục và các lượt đã ghi nhận. Lịch sử trước khi bổ sung thống kê chỉ khôi phục được từ phiên còn lưu.</p></>}
 {(view==='explore'||view==='readiness')&&<><h2>{view==='explore'?`${questions.length} câu · ${groups.length} hạng mục`:'Kết quả theo hạng mục'}</h2>{groups.map(g=><article className="insight-row" key={g.id}><div><h3>{g.name}</h3><p>{g.total} câu hiện có · {g.seen} đã làm · {g.correct} đúng · {g.wrong} cần xem lại{g.self?` · ${g.self} tự đối chiếu`:''}</p></div>{view==='explore'&&<Button disabled={active} onClick={()=>onPractice(g.id)}>Luyện hạng mục</Button>}</article>)}{active&&view==='explore'&&<Button primary disabled={!questions.length} onClick={()=>onPractice('',active)}>Tiếp tục phiên đang dở</Button>}</>}
 {!questions.length&&<p>Chứng chỉ này chưa có ngân hàng câu hỏi được phục vụ qua API.</p>}
 </>}
 </section>;
}
