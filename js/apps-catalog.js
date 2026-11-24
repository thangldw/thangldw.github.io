// Searchable project catalog for the #apps section of the home page.
// Page chrome (document language, theme label, skip link) is owned by homepage.js.
import { locales, projectTranslations } from '/js/home-locales.mjs?v=20261124-merge';
import { bindLocaleSwitch } from './site-locale.mjs';
const copy = {
 en: { intro:'Tools for work, learning and a little play.', all:'All', search:'Find an app, topic, or tool…', searchLabel:'Search apps and projects', open:'Open', external:'external site', loading:'Loading projects…', failed:'Projects could not be loaded.', retry:'Try again', empty:'No projects found', hint:'Try another keyword or clear the filters.', clear:'Clear filters', browse:'Browse project groups', count:n=>`${n} ${n===1?'project':'projects'}`, more:n=>`View all ${n} learning projects`, names:['Engineering','Utilities','Learning','Experiments'], descriptions:['Build, evaluate, and protect software.','A little help with everyday tasks.','Study by topic and practise at your own pace.','Games and things to explore.'] },
 vi: {intro:'Công cụ cho công việc, học tập và giải trí.',all:'Tất cả',search:'Tìm ứng dụng, chủ đề hoặc công cụ…',searchLabel:'Tìm ứng dụng và dự án',open:'Mở',external:'trang web bên ngoài',loading:'Đang tải dự án…',failed:'Không tải được danh sách dự án.',retry:'Thử lại',empty:'Không tìm thấy dự án',hint:'Thử từ khóa khác hoặc bỏ bộ lọc.',clear:'Bỏ bộ lọc',browse:'Lọc theo nhóm dự án',count:n=>`${n} dự án`,more:n=>`Xem tất cả ${n} dự án học tập`,names:['Kỹ thuật','Tiện ích','Học tập','Thử nghiệm'],descriptions:['Xây dựng, đánh giá và bảo vệ phần mềm.','Hỗ trợ những công việc hằng ngày.','Học theo chủ đề, luyện tập theo nhịp của bạn.','Trò chơi và những điều để khám phá.']},
 ja: {intro:'仕事、学習、そして遊びのためのツール。',all:'すべて',search:'アプリ、テーマ、ツールを検索…',searchLabel:'アプリとプロジェクトを検索',open:'開く',external:'外部サイト',loading:'読み込み中…',failed:'プロジェクトを読み込めませんでした。',retry:'再試行',empty:'該当するプロジェクトがありません',hint:'別のキーワードで検索するか、絞り込みを解除してください。',clear:'絞り込みを解除',browse:'分野で絞り込む',count:n=>`${n}件のプロジェクト`,more:n=>`学習プロジェクト全${n}件を見る`,names:['エンジニアリング','ユーティリティ','学習','実験'],descriptions:['ソフトウェアを構築し、評価し、守る。','日常の作業を少し便利に。','テーマ別に、自分のペースで学ぶ。','ゲームや新しいアイデアを試す。']},
 zh: {intro:'用于工作、学习和休闲的工具。',all:'全部',search:'搜索应用、主题或工具…',searchLabel:'搜索应用与项目',open:'打开',external:'外部网站',loading:'正在加载项目…',failed:'无法加载项目列表。',retry:'重试',empty:'未找到项目',hint:'请尝试其他关键词或清除筛选。',clear:'清除筛选',browse:'按项目类别筛选',count:n=>`${n} 个项目`,more:n=>`查看全部 ${n} 个学习项目`,names:['工程','实用工具','学习','实验'],descriptions:['构建、评估和保护软件。','为日常任务提供帮助。','按主题学习，按自己的节奏练习。','探索游戏和新想法。']}
};

const groups=['engineering','utilities','learning','experiments'];
const section=document.getElementById('apps');
const library=document.getElementById('catalog');
const count=document.getElementById('projectCount');
const nav=section.querySelector('.apps-group-nav');
const buttons=[...nav.querySelectorAll('[data-group]')];
const initialParams=new URLSearchParams(location.search);
const initialGroup=initialParams.get('group');
let lang='en', group=groups.includes(initialGroup)?initialGroup:'all', projects=[], status='loading';
function syncUrl(){const url=new URL(location.href);
 if(group==='all')url.searchParams.delete('group');else url.searchParams.set('group',group);
 url.searchParams.delete('q');
 if(url.href!==location.href)history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
const isExternal=p=>{try{return new URL(p.href,location.href).origin!==location.origin;}catch{return false;}};
const statusBadge=p=>p.status?'<span class="project-status" data-status="'+(String(p.status).toLowerCase()==='live'?'live':'release')+'">'+escapeHtml(p.status)+'</span>':'';
const metaList=p=>Array.isArray(p.tags)&&p.tags.length?'<ul class="project-meta">'+p.tags.map(t=>'<li>'+escapeHtml(t)+'</li>').join('')+'</ul>':'';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const description=p=>p.localizedDescriptions?.[lang] || projectTranslations[lang]?.[p.id]||p.catalogDescription||p.description;
function syncLanguage(){
 const c=copy[lang];
 section.querySelectorAll('[data-copy]').forEach(el=>el.textContent=c[el.dataset.copy]);
 nav.setAttribute('aria-label',c.browse);
 library.setAttribute('aria-label',locales[lang].projects);
 buttons.forEach(b=>{const id=b.dataset.group;const n=id==='all'?projects.length:projects.filter(p=>p.catalogGroup===id).length;b.innerHTML=escapeHtml(id==='all'?c.all:c.names[groups.indexOf(id)])+' <span aria-hidden="true">'+n+'</span>';b.setAttribute('aria-pressed',String(id===group));b.disabled=status!=='ready';});
}
function render(){
 const c=copy[lang];syncLanguage();library.classList.toggle('filtered',group!=='all');
 if(status!=='ready'){count.textContent=status==='error'?c.failed:c.loading;library.innerHTML='<div class="catalog-state">'+(status==='error'?'<h3>'+c.failed+'</h3><button type="button" class="ui-button" data-retry>'+c.retry+'</button>':c.loading)+'</div>';return;}
 const visible=projects.filter(p=>group==='all'||p.catalogGroup===group);
 count.textContent=c.count(visible.length);
 library.innerHTML=groups.map((id,i)=>{
  const members=visible.filter(p=>p.catalogGroup===id);if(!members.length)return '';
  const collapsed=id==='learning'&&group==='all';const shown=collapsed?members.slice(0,4):members;
  const items=shown.map(p=>{const ext=isExternal(p);return '<li class="project-row" data-project-id="'+escapeHtml(p.id)+'"><div class="project-title"><h4><a href="'+escapeHtml(p.href)+'">'+escapeHtml(p.title)+(ext?'<span class="sr-only"> ('+escapeHtml(c.external)+')</span>':'')+'</a></h4>'+statusBadge(p)+'</div><p>'+escapeHtml(description(p))+'</p>'+metaList(p)+'<span class="project-go" aria-hidden="true">'+(ext?'↗':'→')+'</span></li>';}).join('');
  return '<section class="catalog-group" aria-labelledby="'+id+'-title"><header class="group-heading"><h3 id="'+id+'-title">'+c.names[i]+' <span class="group-count">'+members.length+'</span></h3><p>'+c.descriptions[i]+'</p></header><div class="group-body"><ul class="project-list">'+items+'</ul>'+(collapsed&&members.length>4?'<button type="button" class="ui-link-button more-projects" data-more>'+c.more(members.length)+'</button>':'')+'</div></section>';
 }).join('');
 if(!visible.length)library.innerHTML='<div class="catalog-state"><h3>'+c.empty+'</h3><p>'+c.hint+'</p><button type="button" class="ui-button" data-clear>'+c.clear+'</button></div>';
 syncUrl();
}
buttons.forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;render();}));
library.addEventListener('click',e=>{
 if(e.target.closest('[data-more]')){group='learning';render();library.focus();}
 if(e.target.closest('[data-clear]')){group='all';render();library.focus();}
 if(e.target.closest('[data-retry]'))location.reload();
});
bindLocaleSwitch(language => { lang = language; render(); });
try{await window.portfolioProjectsReady;projects=[...window.portfolioProjects,...window.portfolioLearningCollections].sort((a,b)=>a.title.localeCompare(b.title,'en',{numeric:true,sensitivity:'base'}));status='ready';}catch{status='error';}
render();
