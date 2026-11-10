import { locales, projectTranslations } from './home-locales.mjs?v=20261111-grid';
import { sortProjects, projectGroups, projectGroup, filterProjects } from './home-project-order.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const page = document.querySelector('.page');
const grid = document.getElementById('project-grid');
const filtersBar = document.querySelector('.filters');
const status = document.querySelector('.result-count');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
let locale = 'en';
let filter = 'all';
let projects = [];
const fallbackProjects = [...grid.querySelectorAll('article')].map(article => ({
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
function renderFilters() {
 const t = locales[locale];
 filtersBar.setAttribute('aria-label', t.filterLabel);
 if (!projects.length) return;
 const groups = ['all', ...projectGroups.filter(group => projects.some(project => projectGroup(project) === group))];
 filtersBar.replaceChildren(...groups.map(group => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.group = group;
  button.setAttribute('aria-pressed', String(group === filter));
  button.textContent = group === 'all' ? t.filterAll : t.groups[group];
  return button;
 }));
 filtersBar.hidden = false;
}
function renderProjects() {
 const t = locales[locale];
 const items = projects.length ? projects : fallbackProjects;
 if (!items.length) return;
 const shown = filterProjects(items, filter);
 const cards = shown.map(project => {
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
 grid.replaceChildren(...cards);
 if (projects.length) status.textContent = t.count(shown.length, items.length);
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
 text('.languages-section h2',t.languages);
 text('.roles .section-title',t.what);
 document.querySelectorAll('.roles-grid article').forEach((article,index)=>{
  article.querySelector('h3').textContent=t.roles[index][0];
  article.querySelector('p').textContent=t.roles[index][1];
 });
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
 text('.projects .section-header a',t.all);
 renderFilters();
 renderProjects();
 syncTheme();
}
filtersBar.addEventListener('click',event=>{
 const button=event.target.closest('button[data-group]');
 if (!button || button.dataset.group===filter) return;
 filter=button.dataset.group;
 filtersBar.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 renderProjects();
});
document.addEventListener('themechange',syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
window.portfolioProjectsReady.then(()=>{
 projects=sortProjects(window.portfolioProjects);
 renderFilters();
 renderProjects();
}).catch(()=>{
 catalogFailed=true;
 status.textContent=locales[locale].catalogFailed;
});
