import { locales, projectTranslations } from './home-locales.mjs?v=20261111-grid';
import { sortProjects, projectGroups, filterProjects } from './home-project-order.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const page = document.querySelector('.page');
const grid = document.getElementById('project-grid');
const loadState = document.querySelector('.project-load-state');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
const filterButtons = [...document.querySelectorAll('.project-filters [data-group]')];
let locale = 'en';
let group = 'all';
let projects = [];
let catalogFailed = false;
const text = (selector, value) => { document.querySelector(selector).textContent = value; };

function syncTheme() {
 const light = root.dataset.theme !== 'dark';
 page.classList.toggle('light', light);
 themeButton.setAttribute('aria-label', light ? locales[locale].dark : locales[locale].light);
}
function renderFilters() {
 const t = locales[locale];
 filterButtons.forEach(button => {
  const id = button.dataset.group;
  const total = id === 'all' ? projects.length : projects.filter(project => project.catalogGroup === id).length;
  const label = document.createTextNode(id === 'all' ? t.filterAll : t.groupNames[projectGroups.indexOf(id)]);
  button.replaceChildren(label);
  if (projects.length) {
   const badge = document.createElement('span');
   badge.setAttribute('aria-hidden', 'true');
   badge.textContent = total;
   button.append(' ', badge);
  }
  button.setAttribute('aria-pressed', String(id === group));
  button.disabled = !projects.length;
 });
}
function renderProjects() {
 const t = locales[locale];
 renderFilters();
 if (!projects.length) {
  loadState.textContent = catalogFailed ? t.catalogFailed : '';
  return;
 }
 const cards = filterProjects(projects, group).map(project => {
  const article = document.createElement('article');
  article.setAttribute('role', 'listitem');
  article.dataset.projectId = project.id;
  const meta = document.createElement('div');
  meta.className = 'project-card-meta';
  const category = document.createElement('p');
  category.className = 'project-category';
  category.textContent = t.groupNames[projectGroups.indexOf(project.catalogGroup)] || '';
  meta.append(category);
  if (project.status) {
   const badge = document.createElement('span');
   badge.className = 'project-status';
   badge.dataset.status = String(project.status).toLowerCase() === 'live' ? 'live' : 'release';
   badge.textContent = project.status;
   meta.append(badge);
  }
  const title = document.createElement('h3');
  title.textContent = project.title;
  const description = document.createElement('p');
  description.className = 'project-description';
  description.textContent = locale === 'en' ? project.featuredDescription || project.catalogDescription || project.description : projectTranslations[locale][project.id] || project.localizedDescriptions?.[locale] || project.description;
  const link = document.createElement('a');
  link.className = 'project-link';
  link.href = project.href;
  link.textContent = t.view;
  const name = document.createElement('span');
  name.className = 'sr-only';
  name.textContent = ': ' + project.title;
  link.append(name);
  article.append(meta, title, description, link);
  return article;
 });
 grid.replaceChildren(...cards);
 loadState.textContent = '';
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
 document.querySelector('.project-filters').setAttribute('aria-label',t.filterLabel);
 grid.setAttribute('aria-label',t.projects);
 renderProjects();
 syncTheme();
}
filterButtons.forEach(button => button.addEventListener('click', () => { group = button.dataset.group; renderProjects(); }));
document.addEventListener('themechange',syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
window.portfolioProjectsReady.then(()=>{
 projects=sortProjects(window.portfolioProjects);
 renderProjects();
}).catch(()=>{
 catalogFailed=true;
 loadState.textContent=locales[locale].catalogFailed;
});
