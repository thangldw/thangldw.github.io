// Project catalog for the Apps page: group filter and one card per project.
// Page chrome (document language, title, theme label, skip link) is owned by homepage.js.
import { locales, projectTranslations } from '/js/home-locales.mjs?v=20261125-three';
import { bindLocaleSwitch } from './site-locale.mjs';
const copy = {
 en: { intro:'Tools, utilities, study apps and games I built. The engineering tools link to their source and README on GitHub.', all:'All', search:'Find an app, topic, or tool…', searchLabel:'Search apps and projects', open:'Open', external:'external site', loading:'Loading projects…', failed:'Projects could not be loaded.', retry:'Try again', empty:'No projects found', hint:'Try another keyword or clear the filters.', clear:'Clear filters', browse:'Browse project groups', count:n=>`${n} ${n===1?'project':'projects'}`, more:n=>`View all ${n} learning projects`, names:['Engineering','Utilities','Learning','Games and experiments'], descriptions:['Build, evaluate, and protect software.','A little help with everyday tasks.','Study by topic and practise at your own pace.','Games and things to explore.'] },
 vi: {intro:'Công cụ, tiện ích, ứng dụng học tập và trò chơi do tôi xây dựng. Các công cụ kỹ thuật liên kết thẳng tới mã nguồn và README trên GitHub.',all:'Tất cả',search:'Tìm ứng dụng, chủ đề hoặc công cụ…',searchLabel:'Tìm ứng dụng và dự án',open:'Mở',external:'trang web bên ngoài',loading:'Đang tải dự án…',failed:'Không tải được danh sách dự án.',retry:'Thử lại',empty:'Không tìm thấy dự án',hint:'Thử từ khóa khác hoặc bỏ bộ lọc.',clear:'Bỏ bộ lọc',browse:'Lọc theo nhóm dự án',count:n=>`${n} dự án`,more:n=>`Xem tất cả ${n} dự án học tập`,names:['Kỹ thuật','Tiện ích','Học tập','Trò chơi và thử nghiệm'],descriptions:['Xây dựng, đánh giá và bảo vệ phần mềm.','Hỗ trợ những công việc hằng ngày.','Học theo chủ đề, luyện tập theo nhịp của bạn.','Trò chơi và những điều để khám phá.']},
 ja: {intro:'自作のツール、ユーティリティ、学習アプリ、ゲーム。エンジニアリング系ツールはGitHubのソースとREADMEに直接リンクしています。',all:'すべて',search:'アプリ、テーマ、ツールを検索…',searchLabel:'アプリとプロジェクトを検索',open:'開く',external:'外部サイト',loading:'読み込み中…',failed:'プロジェクトを読み込めませんでした。',retry:'再試行',empty:'該当するプロジェクトがありません',hint:'別のキーワードで検索するか、絞り込みを解除してください。',clear:'絞り込みを解除',browse:'分野で絞り込む',count:n=>`${n}件のプロジェクト`,more:n=>`学習プロジェクト全${n}件を見る`,names:['エンジニアリング','ユーティリティ','学習','ゲームと実験'],descriptions:['ソフトウェアを構築し、評価し、守る。','日常の作業を少し便利に。','テーマ別に、自分のペースで学ぶ。','ゲームや新しいアイデアを試す。']},
 zh: {intro:'我构建的工具、实用程序、学习应用和游戏。工程类工具直接链接到 GitHub 上的源码和 README。',all:'全部',search:'搜索应用、主题或工具…',searchLabel:'搜索应用与项目',open:'打开',external:'外部网站',loading:'正在加载项目…',failed:'无法加载项目列表。',retry:'重试',empty:'未找到项目',hint:'请尝试其他关键词或清除筛选。',clear:'清除筛选',browse:'按项目类别筛选',count:n=>`${n} 个项目`,more:n=>`查看全部 ${n} 个学习项目`,names:['工程','实用工具','学习','游戏与实验'],descriptions:['构建、评估和保护软件。','为日常任务提供帮助。','按主题学习，按自己的节奏练习。','探索游戏和新想法。']}
};

const groups=['engineering','utilities','learning','experiments'];
const section=document.getElementById('apps');
const library=document.getElementById('catalog');
const count=document.getElementById('projectCount');
const nav=section.querySelector('.pills');
const buttons=[...nav.querySelectorAll('[data-group]')];
const initialParams=new URLSearchParams(location.search);
const initialGroup=initialParams.get('group');
let lang='en', group=groups.includes(initialGroup)?initialGroup:'all', projects=[], status='loading';
function syncUrl(){const url=new URL(location.href);
 if(group==='all')url.searchParams.delete('group');else url.searchParams.set('group',group);
 url.searchParams.delete('q');
 if(url.href!==location.href)history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
const isExternal=p=>{try{return new URL(p.href,location.href).origin!==location.origin;}catch{return false;}};
const chips=p=>Array.isArray(p.tags)&&p.tags.length?'<ul class="chips">'+p.tags.slice(0,3).map(t=>'<li>'+escapeHtml(t)+'</li>').join('')+'</ul>':'';
const initials=title=>{const w=title.trim().split(/\s+/);return (w.length>1?w[0][0]+w[1][0]:title.slice(0,2)).toUpperCase();};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const description=p=>p.localizedDescriptions?.[lang] || projectTranslations[lang]?.[p.id]||p.catalogDescription||p.description;
function syncLanguage(){
 const c=copy[lang];
 section.querySelectorAll('[data-copy]').forEach(el=>el.textContent=c[el.dataset.copy]);
 nav.setAttribute('aria-label',c.browse);
 library.setAttribute('aria-label',locales[lang].projects);
 buttons.forEach(b=>{const id=b.dataset.group;b.textContent=id==='all'?c.all:c.names[groups.indexOf(id)];b.setAttribute('aria-pressed',String(id===group));b.disabled=status!=='ready';});
}
function render(){
 const c=copy[lang];syncLanguage();library.classList.toggle('filtered',group!=='all');
 if(status!=='ready'){count.textContent=status==='error'?c.failed:c.loading;library.innerHTML='<div class="catalog-state">'+(status==='error'?'<h3>'+c.failed+'</h3><button type="button" class="ui-button" data-retry>'+c.retry+'</button>':c.loading)+'</div>';return;}
 const visible=projects.filter(p=>group==='all'||p.catalogGroup===group);
 count.textContent=c.count(visible.length);
 library.innerHTML=groups.map((id,i)=>{
  const members=visible.filter(p=>p.catalogGroup===id);if(!members.length)return '';
  const cards=members.map(p=>{const ext=isExternal(p);return '<a class="app-card" href="'+escapeHtml(p.href)+'" data-project-id="'+escapeHtml(p.id)+'" aria-label="'+escapeHtml(p.ariaLabel+(ext?' ('+c.external+')':''))+'"><span class="glyph" aria-hidden="true">'+escapeHtml(initials(p.title))+'</span><h3>'+escapeHtml(p.title)+'</h3><span class="app-cat">'+escapeHtml(p.categoryLabel)+'</span><p>'+escapeHtml(description(p))+'</p>'+chips(p)+'<span class="app-go" aria-hidden="true">'+escapeHtml(p.cta)+'</span></a>';}).join('');
  return '<section class="catalog-group tone-'+id+'" aria-labelledby="'+id+'-title"><h2 class="section-heading" id="'+id+'-title">'+c.names[i]+'</h2><div class="card-grid">'+cards+'</div></section>';
 }).join('');
 if(!visible.length)library.innerHTML='<div class="catalog-state"><h3>'+c.empty+'</h3><p>'+c.hint+'</p><button type="button" class="ui-button" data-clear>'+c.clear+'</button></div>';
 syncUrl();
}
buttons.forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;render();}));
library.addEventListener('click',e=>{
 if(e.target.closest('[data-clear]')){group='all';render();library.focus();}
 if(e.target.closest('[data-retry]'))location.reload();
});
bindLocaleSwitch(language => { lang = language; render(); });
try{await window.portfolioProjectsReady;projects=[...window.portfolioProjects,...window.portfolioLearningCollections].sort((a,b)=>a.title.localeCompare(b.title,'en',{numeric:true,sensitivity:'base'}));status='ready';}catch{status='error';}
render();
