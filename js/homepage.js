import { locales, projectTranslations } from './home-locales.mjs?v=20261112-rotate';
import { sortProjects, featuredProjects, shuffle, projectGroups, circularIndex, visibleProjects } from './home-project-order.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const ROTATE_MS = 7000;
const root = document.documentElement;
const page = document.querySelector('.page');
const rail = document.getElementById('project-rail');
const controls = document.querySelector('.carousel-controls');
const toggleButton = controls.querySelector('.carousel-toggle');
const previousButton = controls.querySelector('.carousel-prev');
const nextButton = controls.querySelector('.carousel-next');
const status = document.querySelector('.carousel-status');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
let locale = 'en';
let projects = [];
let start = 0;
let timer = null;
let hovered = false;
let focused = false;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// The button reflects the user's choice; hover/focus pauses are temporary and do not change it.
let userPaused = reduceMotion.matches;
const fallbackProjects = [...rail.querySelectorAll('article')].map(article => ({
 id: article.dataset.projectId,
 title: article.querySelector('h3').textContent,
 href: article.querySelector('a').href,
 description: article.querySelector('.project-description').textContent,
 catalogGroup: article.dataset.group
}));
let catalogFailed = false;
const text = (selector, value) => { document.querySelector(selector).textContent = value; };

function syncTheme() {
 const light = root.dataset.theme !== 'dark';
 page.classList.toggle('light', light);
 themeButton.setAttribute('aria-label', light ? locales[locale].dark : locales[locale].light);
}
const visibleCount = () => Math.max(1, Number.parseInt(getComputedStyle(rail).getPropertyValue('--visible-projects'), 10) || 3);
// Phones show a static stacked list: no rotation, no carousel controls.
const stacked = () => getComputedStyle(rail).getPropertyValue('--rail-columns').trim() === '1';
const items = () => projects.length ? projects : fallbackProjects;
const rotating = () => timer !== null;
function renderProjects() {
 const t = locales[locale];
 const list = items();
 if (!list.length) return;
 const count = Math.min(visibleCount(), list.length);
 start = circularIndex(start, list.length);
 const shown = visibleProjects(list, start, count);
 rail.replaceChildren(...shown.map(project => {
  const article = document.createElement('article');
  article.dataset.projectId = project.id;
  const group = document.createElement('p');
  group.className = 'project-category';
  group.textContent = t.groupNames[projectGroups.indexOf(project.catalogGroup)] || '';
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
  article.append(group,title);
  if (project.status) {
   const badge = document.createElement('span');
   badge.className = 'project-status';
   badge.dataset.status = String(project.status).toLowerCase() === 'live' ? 'live' : 'release';
   badge.textContent = project.status;
   article.append(badge);
  }
  article.append(description,link);
  return article;
 }));
 rail.setAttribute('aria-label', t.carousel);
 previousButton.setAttribute('aria-label', t.previous);
 nextButton.setAttribute('aria-label', t.next);
 if (projects.length) status.textContent = t.count(start + 1, circularIndex(start + count - 1, list.length) + 1, list.length);
 else status.textContent = catalogFailed ? t.catalogFailed : '';
 syncToggle();
}
function syncToggle() {
 const t = locales[locale];
 const paused = userPaused;
 toggleButton.setAttribute('aria-label', paused ? t.play : t.pause);
 toggleButton.setAttribute('aria-pressed', String(paused));
 toggleButton.firstElementChild.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
 // Announce position changes only when the user drives them; auto-rotation stays silent.
 status.setAttribute('aria-live', rotating() ? 'off' : 'polite');
}
function move(direction) {
 const list = items();
 if (list.length <= visibleCount()) return;
 start = circularIndex(start + direction, list.length);
 renderProjects();
}
function stop() {
 if (timer !== null) { clearInterval(timer); timer = null; }
 syncToggle();
}
function play() {
 if (timer !== null || userPaused || hovered || focused || stacked() || reduceMotion.matches || !projects.length || projects.length <= visibleCount()) return syncToggle();
 timer = setInterval(() => { if (!document.hidden) move(1); }, ROTATE_MS);
 syncToggle();
}
function updateControls() {
 controls.hidden = !projects.length || projects.length <= visibleCount() || stacked();
 if (controls.hidden) stop();
 else play();
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
 details[2].querySelector('dt').textContent=t.languages;
 text('.process .section-title',t.how);
 document.querySelectorAll('.process-grid article').forEach((article,index)=>{
  article.querySelector('h3').textContent=t.process[index][0];
  article.querySelector('p').textContent=t.process[index][1];
 });
 text('.projects .section-title',t.projects);
 text('.project-actions > a',t.all);
 renderProjects();
 syncTheme();
}
toggleButton.addEventListener('click',()=>{
 if (userPaused) { userPaused = false; hovered = false; focused = false; play(); }
 else { userPaused = true; stop(); }
});
// Manual navigation ends autoplay until the user resumes it explicitly.
const manual = direction => { userPaused = true; stop(); move(direction); };
previousButton.addEventListener('click',()=>manual(-1));
nextButton.addEventListener('click',()=>manual(1));
rail.addEventListener('keydown',event=>{
 if (event.key === 'ArrowLeft') { event.preventDefault(); manual(-1); }
 if (event.key === 'ArrowRight') { event.preventDefault(); manual(1); }
});
const section = document.querySelector('.projects');
section.addEventListener('mouseenter',()=>{ hovered = true; stop(); });
section.addEventListener('mouseleave',()=>{ hovered = false; play(); });
section.addEventListener('focusin',()=>{ focused = true; stop(); });
section.addEventListener('focusout',event=>{ if (!section.contains(event.relatedTarget)) { focused = false; play(); } });
reduceMotion.addEventListener('change',()=>{ if (reduceMotion.matches) { userPaused = true; stop(); } });
window.addEventListener('resize',()=>{ updateControls(); renderProjects(); });
document.addEventListener('themechange',syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
window.portfolioProjectsReady.then(()=>{
 projects=shuffle(featuredProjects(sortProjects(window.portfolioProjects)));
 start=0;
 renderProjects();
 updateControls();
 play();
}).catch(()=>{
 catalogFailed=true;
 status.textContent=locales[locale].catalogFailed;
});
