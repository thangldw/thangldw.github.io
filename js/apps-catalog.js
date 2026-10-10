import { locales, projectTranslations } from '/js/home-locales.mjs';
const copy = {
 en: { title:'Apps', intro:'Tools for work, learning and a little play.', home:'Home', cert:'Cert', all:'All', search:'Find an app, topic, or tool…', searchLabel:'Search apps and projects', open:'Open', loading:'Loading projects…', failed:'Projects could not be loaded.', retry:'Try again', empty:'No projects found', hint:'Try another keyword or clear the filters.', clear:'Clear filters', browse:'Browse project groups', count:n=>`${n} ${n===1?'project':'projects'}`, more:n=>`View all ${n} learning projects`, names:['Engineering','Utilities','Learning','Experiments'], descriptions:['Build, evaluate, and protect software.','A little help with everyday tasks.','Study by topic and practise at your own pace.','Games and things to explore.'] },
 vi: {title:'Apps',intro:'Công cụ cho công việc, học tập và giải trí.',home:'Trang chủ',cert:'Chứng chỉ',all:'Tất cả',search:'Tìm ứng dụng, chủ đề hoặc công cụ…',searchLabel:'Tìm ứng dụng và dự án',open:'Mở',loading:'Đang tải dự án…',failed:'Không tải được danh sách dự án.',retry:'Thử lại',empty:'Không tìm thấy dự án',hint:'Thử từ khóa khác hoặc bỏ bộ lọc.',clear:'Bỏ bộ lọc',browse:'Lọc theo nhóm dự án',count:n=>`${n} dự án`,more:n=>`Xem tất cả ${n} dự án học tập`,names:['Kỹ thuật','Tiện ích','Học tập','Thử nghiệm'],descriptions:['Xây dựng, đánh giá và bảo vệ phần mềm.','Hỗ trợ những công việc hằng ngày.','Học theo chủ đề, luyện tập theo nhịp của bạn.','Trò chơi và những điều để khám phá.']},
 ja: {title:'Apps',intro:'仕事、学習、そして遊びのためのツール。',home:'ホーム',cert:'資格学習',all:'すべて',search:'アプリ、テーマ、ツールを検索…',searchLabel:'アプリとプロジェクトを検索',open:'開く',loading:'読み込み中…',failed:'プロジェクトを読み込めませんでした。',retry:'再試行',empty:'該当するプロジェクトがありません',hint:'別のキーワードで検索するか、絞り込みを解除してください。',clear:'絞り込みを解除',browse:'分野で絞り込む',count:n=>`${n}件のプロジェクト`,more:n=>`学習プロジェクト全${n}件を見る`,names:['エンジニアリング','ユーティリティ','学習','実験'],descriptions:['ソフトウェアを構築し、評価し、守る。','日常の作業を少し便利に。','テーマ別に、自分のペースで学ぶ。','ゲームや新しいアイデアを試す。']},
 zh: {title:'Apps',intro:'用于工作、学习和休闲的工具。',home:'首页',cert:'认证学习',all:'全部',search:'搜索应用、主题或工具…',searchLabel:'搜索应用与项目',open:'打开',loading:'正在加载项目…',failed:'无法加载项目列表。',retry:'重试',empty:'未找到项目',hint:'请尝试其他关键词或清除筛选。',clear:'清除筛选',browse:'按项目类别筛选',count:n=>`${n} 个项目`,more:n=>`查看全部 ${n} 个学习项目`,names:['工程','实用工具','学习','实验'],descriptions:['构建、评估和保护软件。','为日常任务提供帮助。','按主题学习，按自己的节奏练习。','探索游戏和新想法。']}
};

const groups=['engineering','utilities','learning','experiments'];
const search=document.getElementById('projectSearch');
const library=document.getElementById('catalog');
const count=document.getElementById('projectCount');
const buttons=[...document.querySelectorAll('[data-group]')];
let lang='en', group='all', projects=[], status='loading';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase().trim();
const description=p=>projectTranslations[lang]?.[p.id]||p.catalogDescription||p.description;
function syncThemeLabel(){document.getElementById('themeToggle').setAttribute('aria-label',document.documentElement.dataset.theme==='dark'?locales[lang].light:locales[lang].dark);}
function syncLanguage(){
 const c=copy[lang],h=locales[lang]; document.documentElement.lang=lang;
 document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=c[el.dataset.copy]);
 document.querySelector('.skip-link').textContent=h.skip;
 document.querySelector('.site-brand').setAttribute('aria-label',h.home);
 document.querySelector('.site-navigation').setAttribute('aria-label',c.home);
 document.querySelector('.locale-switch').setAttribute('aria-label',h.languageSwitch);
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.querySelector('.apps-group-nav').setAttribute('aria-label',c.browse);
 library.setAttribute('aria-label',h.projects);search.placeholder=c.search;
 const support=document.querySelector('.support-floating-trigger');if(support){support.setAttribute('aria-label',h.support);support.querySelector('span').textContent=h.support;}
 syncThemeLabel();
 buttons.forEach(b=>{const id=b.dataset.group;const n=id==='all'?projects.length:projects.filter(p=>p.catalogGroup===id).length;b.innerHTML=escapeHtml(id==='all'?c.all:c.names[groups.indexOf(id)])+' <span aria-hidden="true">'+n+'</span>';b.setAttribute('aria-pressed',String(id===group));b.disabled=status!=='ready';});
}
function render(){
 const c=copy[lang];syncLanguage();library.classList.toggle('filtered',group!=='all');
 if(status!=='ready'){count.textContent=status==='error'?c.failed:c.loading;library.innerHTML='<div class="catalog-state">'+(status==='error'?'<h2>'+c.failed+'</h2><button type="button" class="ui-button" data-retry>'+c.retry+'</button>':c.loading)+'</div>';return;}
 const words=normalize(search.value).split(/\s+/u).filter(Boolean);
 const visible=projects.filter(p=>(group==='all'||p.catalogGroup===group)&&words.every(w=>normalize([p.title,p.description,description(p),p.categoryLabel,...p.tags].join(' ')).includes(w)));
 count.textContent=c.count(visible.length);
 library.innerHTML=groups.map((id,i)=>{
  const members=visible.filter(p=>p.catalogGroup===id);if(!members.length)return '';
  const collapsed=id==='learning'&&group==='all'&&!words.length;const shown=collapsed?members.slice(0,4):members;
  return '<section class="catalog-group" aria-labelledby="'+id+'-title"><header class="group-heading"><h2 id="'+id+'-title">'+c.names[i]+' <span>'+members.length+'</span></h2><p>'+c.descriptions[i]+'</p></header>'+shown.map(p=>'<article class="project-row" data-project-id="'+escapeHtml(p.id)+'"><div><h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(description(p))+'</p></div><a class="project-open" href="'+escapeHtml(p.href)+'" aria-label="'+escapeHtml(c.open+': '+p.title)+'">'+c.open+'<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>').join('')+(collapsed&&members.length>4?'<button type="button" class="ui-link-button more-projects" data-more>'+c.more(members.length)+'<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>':'')+'</section>';
 }).join('');
 if(!visible.length)library.innerHTML='<div class="catalog-state"><h2>'+c.empty+'</h2><p>'+c.hint+'</p><button type="button" class="ui-button" data-clear>'+c.clear+'</button></div>';
}
buttons.forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;render();}));
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;render();}));
search.addEventListener('input',e=>{if(!e.isComposing)render();});search.addEventListener('compositionend',render);
document.addEventListener('themechange',syncThemeLabel);
library.addEventListener('click',e=>{
 if(e.target.closest('[data-more]')){group='learning';render();library.focus();}
 if(e.target.closest('[data-clear]')){search.value='';group='all';render();search.focus();}
 if(e.target.closest('[data-retry]'))location.reload();
});
render();
try{await window.portfolioProjectsReady;projects=[...window.portfolioProjects,...window.portfolioLearningCollections].sort((a,b)=>a.title.localeCompare(b.title,'en',{numeric:true,sensitivity:'base'}));status='ready';search.disabled=false;}catch{status='error';}
render();
