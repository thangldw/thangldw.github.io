import { locales, projectTranslations } from './home-locales.mjs';
import { sortProjects, circularIndex, visibleProjects } from './home-project-order.mjs';

const root = document.documentElement;
const page = document.querySelector('.page');
const rail = document.getElementById('project-rail');
const status = document.querySelector('.carousel-status');
const dialog = document.querySelector('.contact-dialog');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
const [previousButton, nextButton] = document.querySelectorAll('.carousel-controls button');
const copyButton = document.querySelector('.contact-actions button');
let locale = 'en';
let start = 0;
let count = 3;
let projects = [];
const fallbackProjects = [...rail.querySelectorAll('article')].map(article => ({
 id: article.dataset.projectId,
 title: article.querySelector('h3').textContent,
 href: article.querySelector('a').href,
 description: article.querySelector('.project-description').textContent,
 catalogGroup: article.querySelector('.project-category').textContent === 'Learning' ? 'learning' : 'utilities'
}));
let copyStatus = '';
let catalogFailed = false;
const text = (selector, value) => { document.querySelector(selector).textContent = value; };

function syncTheme() {
 const light = root.dataset.theme !== 'dark';
 page.classList.toggle('light', light);
 themeButton.setAttribute('aria-label', light ? locales[locale].dark : locales[locale].light);
}
function projectGroup(project) {
 if (project.catalogGroup === 'learning') return 'Learning';
 if (project.category === 'games') return 'Games';
 if (['ragops','proofline'].includes(project.id)) return 'Data & AI';
 return 'Tools';
}
function renderProjects() {
 const t = locales[locale];
 const items = projects.length ? projects : fallbackProjects;
 if (!items.length) return;
 const cards = visibleProjects(items, start, count).map(project => {
  const article = document.createElement('article');
  article.dataset.projectId = project.id;
  const group = document.createElement('p');
  group.className = 'project-category';
  group.textContent = t.groups[projectGroup(project)];
  const title = document.createElement('h3');
  title.textContent = project.title;
  const description = document.createElement('p');
  description.className = 'project-description';
  description.textContent = locale === 'en' ? project.featuredDescription || project.catalogDescription || project.description : projectTranslations[locale][project.id] || project.description;
  const link = document.createElement('a');
  link.href = project.href;
  link.textContent = t.view;
  const name = document.createElement('span');
  name.className = 'sr-only';
  name.textContent = ': ' + project.title;
  link.append(name);
  article.append(group,title,description,link);
  return article;
 });
 rail.replaceChildren(...cards);
 if (projects.length) status.textContent = t.count(start+1,circularIndex(start+count-1,projects.length)+1,projects.length);
 if (catalogFailed) status.textContent = t.catalogFailed;
}
function renderLocale() {
 const t = locales[locale];
 root.lang = locale === 'zh' ? 'zh-CN' : locale;
 page.lang = locale;
 document.title = `Thang Luu — ${t.roles[0][0]}`;
 text('.skip',t.skip);
 document.querySelector('.brand').setAttribute('aria-label',t.home);
 document.querySelector('.locale-switch').setAttribute('aria-label',t.languageSwitch);
 localeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.lang===locale)));
 const motto = document.querySelector('.motto');
 motto.replaceChildren(document.createTextNode(t.motto[0]),document.createElement('br'),document.createTextNode(t.motto[1]));
 const sections = document.querySelectorAll('aside .profile');
 sections[0].querySelector('h2').textContent = t.what;
 sections[0].querySelectorAll('article').forEach((article,index)=>{
  article.querySelector('h3').textContent=t.roles[index][0];
  article.querySelector('p').textContent=t.roles[index][1];
 });
 sections[1].querySelector('h2').textContent=t.languages;
 text('.contact h2',t.work);
 text('.contact p',t.invitation);
 text('.contact-trigger',t.discuss);
 text('.support',t.support);
 text('.about .section-title',t.about);
 const emphasis = document.createElement('span');
 emphasis.textContent = t.headline[1];
 document.querySelector('.headline').replaceChildren(document.createTextNode(t.headline[0]),emphasis,document.createTextNode(t.headline[2]));
 document.querySelectorAll('.bio p').forEach((paragraph,index)=>paragraph.textContent=t.bio[index]);
 const details = document.querySelectorAll('.about-experience>div');
 details[0].querySelector('dt').textContent=t.sectors;
 details[0].querySelector('dd').textContent=t.sectorText;
 details[1].querySelector('dt').textContent=t.contribution;
 details[1].querySelector('dd').textContent=t.contributionText;
 text('.process .section-title',t.how);
 document.querySelectorAll('.process-grid article').forEach((article,index)=>{
  article.querySelector('h3').textContent=t.process[index][0];
  article.querySelector('p').textContent=t.process[index][1];
 });
 text('.projects .section-title',t.projects);
 text('.project-actions>a',t.all);
 previousButton.setAttribute('aria-label',t.previous);
 nextButton.setAttribute('aria-label',t.next);
 rail.setAttribute('aria-label',t.carousel);
 text('#contact-title',t.contactTitle);
 text('.contact-dialog>p',t.contactBody);
 document.querySelector('.dialog-close').setAttribute('aria-label',t.close);
 text('.contact-actions button',t.copy);
 const links = document.querySelectorAll('.contact-actions a');
 links[0].textContent=t.gmail;
 links[0].href=`https://mail.google.com/mail/?view=cm&fs=1&to=thangldw%40gmail.com&su=${encodeURIComponent(t.subject)}`;
 links[1].textContent=t.emailApp;
 const mailto=`mailto:thangldw@gmail.com?subject=${encodeURIComponent(t.subject)}`;
 document.querySelector('.email-address').href=mailto;
 links[1].href=mailto;
 text('.copy-status',copyStatus ? t[copyStatus] : '');
 renderProjects();
 syncTheme();
}
function move(direction) {
 if (!projects.length) return;
 start=circularIndex(start+direction,projects.length);
 renderProjects();
}
localeButtons.forEach(button=>button.addEventListener('click',()=>{locale=button.lang;renderLocale();}));
previousButton.addEventListener('click',()=>move(-1));
nextButton.addEventListener('click',()=>move(1));
rail.addEventListener('keydown',event=>{
 if (event.target!==rail || event.isComposing) return;
 if (event.key==='ArrowLeft'||event.key==='ArrowRight') { event.preventDefault(); move(event.key==='ArrowRight'?1:-1); }
});
document.querySelector('.contact-trigger').addEventListener('click',()=>{copyStatus='';text('.copy-status','');dialog.showModal();});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
copyButton.addEventListener('click',async()=>{
 try { await navigator.clipboard.writeText('thangldw@gmail.com'); copyStatus='copied'; }
 catch { copyStatus='copyFailed'; }
 text('.copy-status',locales[locale][copyStatus]);
});
document.addEventListener('themechange',syncTheme);
new ResizeObserver(()=>{
 const visible=Number(getComputedStyle(rail).getPropertyValue('--visible-projects')) || 3;
 if(visible!==count){count=visible;renderProjects();}
}).observe(rail);
renderLocale();
previousButton.disabled=nextButton.disabled=true;
window.portfolioProjectsReady.then(()=>{
 projects=sortProjects(window.portfolioProjects.concat(window.portfolioLearningCollections));
 previousButton.disabled=nextButton.disabled=projects.length<2;
 renderProjects();
}).catch(()=>{
 catalogFailed=true;
 status.textContent=locales[locale].catalogFailed;
});
