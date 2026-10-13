import React,{useEffect,useState} from 'react';
import {Moon,Sun,ArrowRight,BookOpen,Notebook,ArrowLeft,House,Compass,ChartBar} from '@phosphor-icons/react';
import catalog from './bank-api/catalog.json';
import {readBankSession} from './bank-session.js';
import {Button} from './Button.jsx';
import {BankPractice} from './BankPractice.jsx';
import {BankInsights} from './BankInsights.jsx';

export function LearningHeader({certification}){
 const [dark,setDark]=useState(document.documentElement.dataset.theme==='dark');
 useEffect(()=>{const update=e=>setDark(e.detail.theme==='dark');document.addEventListener('themechange',update);return()=>document.removeEventListener('themechange',update)},[]);
 return <header className="site-header"><div className="site-shell-inner"><div className="brand-group"><a className="site-brand" href="https://thangldw.github.io/"><span className="site-brand-mark">t:&gt;</span><span>thang<span className="site-brand-dot">.</span></span></a><span className="bank-header-label">{certification?.shortName||'Learning'}</span></div><div className="header-tools"><Button id="themeToggle" className="site-theme-toggle">{dark?<Sun size={18}/>:<Moon size={18}/>}</Button></div></div></header>;
}
export function LearningHome(){
 return <div className="site-page prototype"><a className="skip-link" href="#learning-main">Đến nội dung chính</a><LearningHeader/><main id="learning-main" className="learning-directory"><section className="explore-hero"><div><p className="eyebrow">KHÔNG GIAN HỌC CỦA BẠN</p><h1>Chọn chứng chỉ.<br/>Bắt đầu ôn luyện.</h1><p className="lead">Mỗi chứng chỉ có một workspace riêng. Luyện đề nhanh trước, học để nhớ khi cần hiểu sâu hơn.</p></div><img src={`${import.meta.env.BASE_URL}assets/robot-study.png`} alt="Robot đồng hành cùng quyển vở mở"/></section><div className="certificate-grid">{catalog.certifications.map(cert=>{const {session}=readBankSession(cert.id);const active=session.ids.length&&!session.finished;return <article className="certificate-card" key={cert.id}><h2>{cert.shortName}</h2><p>{cert.name}</p><p className="muted">{active?`Phiên đang dở · câu ${session.position+1}/${session.ids.length}`:cert.id==='pmp'?'Workspace PMP hiện có':cert.availableQuestionCount?`${cert.availableQuestionCount} câu trong danh mục hiện có`:'Chưa có ngân hàng câu hỏi'}</p><a className="ui-button" href={`/${cert.slug}/`}>{active?'Tiếp tục ôn':'Mở workspace'}<ArrowRight size={18}/></a></article>})}</div></main></div>;
}
export function LearningNavigation({view,onNavigate}){
 const items=[['today','Hôm nay',House],['explore','Tổng quan',Compass],['learn','Học để nhớ',Notebook],['bank','Luyện đề nhanh',BookOpen],['readiness','Kiểm tra tiến độ',ChartBar]];
 return <nav aria-label="Không gian học">{items.map(([id,label,Icon])=><button key={id} className="nav-item" aria-current={view===id?'page':undefined} onClick={()=>onNavigate(id)}><Icon size={23}/><span>{label}</span></button>)}</nav>;
}
export function CertificateWorkspace({certification:cert}){
 const [view,setView]=useState('bank'),[section,setSection]=useState(''),[resumeBank,setResumeBank]=useState(false),[newBank,setNewBank]=useState(false);
 return <div className="site-page prototype"><a className="skip-link" href="#learning-main">Đến nội dung chính</a><LearningHeader certification={cert}/><div className="workspace"><aside className="sidebar"><LearningNavigation view={view} onNavigate={next=>{setResumeBank(false);setNewBank(false);setView(next)}}/><div className="sidebar-foot"><a className="ui-link-button" href="/learning/"><ArrowLeft size={18}/>Danh sách chứng chỉ</a></div></aside><main id="learning-main">{['today','explore','readiness'].includes(view)?<BankInsights key={view} certification={cert} view={view} onPractice={(scope,resume=false)=>{setSection(scope);setResumeBank(resume);setNewBank(!resume);setView('bank')}}/>:cert.id==='pmp'?<section className="study-page"><h1>{cert.shortName}</h1><a className="ui-button" href="https://thangldw.github.io/pmp/">Mở workspace PMP</a></section>:view==='bank'?<BankPractice certId={cert.id} initialSection={section} resumeOnOpen={resumeBank} newSessionOnOpen={newBank}/>:<section className="study-page"><p className="eyebrow">HỌC ĐỂ NHỚ · {cert.shortName}</p><h1>Chưa có bài học hướng dẫn trong bản này.</h1><p>Bạn có thể luyện câu hỏi hiện có hoặc xem tài liệu trong workspace gốc.</p><Button primary onClick={()=>setView('bank')}>Luyện đề nhanh</Button><p><a href={`https://thangldw.github.io/${cert.slug}/classic.html`}>Xem workspace gốc</a></p></section>}</main></div></div>;
}
