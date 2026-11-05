import { locales, projectTranslations } from './home-locales.mjs?v=20261103-icons';
import { sortProjects, circularIndex, visibleProjects } from './home-project-order.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const page = document.querySelector('.page');
const rail = document.getElementById('project-rail');
const status = document.querySelector('.carousel-status');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
const [previousButton, nextButton] = document.querySelectorAll('.carousel-controls button');
let locale = 'en';
let start = 0;
function visibleProjectCount() {
 return Number(getComputedStyle(rail).getPropertyValue('--visible-projects')) || 1;
}
let count = visibleProjectCount();
let projects = [];
const fallbackProjects = [...rail.querySelectorAll('article')].map(article => ({
 id: article.dataset.projectId,
 title: article.querySelector('h3').textContent,
 href: article.querySelector('a').href,
 description: article.querySelector('.project-description').textContent,
 catalogGroup: article.querySelector('.project-category').textContent === 'Learning' ? 'learning' : 'utilities',
 category: article.querySelector('.project-category').textContent === 'Games' ? 'games' : undefined
}));
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
  description.textContent = locale === 'en' ? project.featuredDescription || project.catalogDescription || project.description : projectTranslations[locale][project.id] || project.localizedDescriptions?.[locale] || project.description;
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
 if (projects.length) status.textContent = t.count(start+1,circularIndex(start+cards.length-1,projects.length)+1,projects.length);
 else status.textContent = catalogFailed ? t.catalogFailed : '';
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
 document.querySelectorAll('[data-contact-label]').forEach(link => {
  const label = t[link.dataset.contactLabel];
  link.setAttribute('aria-label', label);
  link.title = label;
 });
 const supportLabel = document.querySelector('.support-floating-trigger span');
 if (supportLabel) supportLabel.textContent = t.support;
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
 renderProjects();
 syncTheme();
}
function move(direction) {
 if (!projects.length) return;
 start=circularIndex(start+direction,projects.length);
 renderProjects();
}
previousButton.addEventListener('click',()=>move(-1));
nextButton.addEventListener('click',()=>move(1));
rail.addEventListener('keydown',event=>{
 if (event.target!==rail || event.isComposing) return;
 if (event.key==='ArrowLeft'||event.key==='ArrowRight') { event.preventDefault(); move(event.key==='ArrowRight'?1:-1); }
});
document.addEventListener('themechange',syncTheme);
new ResizeObserver(()=>{
 const visible=visibleProjectCount();
 if(visible!==count){count=visible;renderProjects();}
}).observe(rail);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
previousButton.disabled=nextButton.disabled=true;
window.portfolioProjectsReady.then(()=>{
 projects=sortProjects(window.portfolioProjects);
 previousButton.disabled=nextButton.disabled=projects.length<2;
 renderProjects();
}).catch(()=>{
 catalogFailed=true;
 status.textContent=locales[locale].catalogFailed;
});
