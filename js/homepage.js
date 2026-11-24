import { locales } from './home-locales.mjs?v=20261124-merge';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const page = document.querySelector('.page');
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
let locale = 'en';
const text = (selector, value) => { document.querySelector(selector).textContent = value; };

function syncTheme() {
 const light = root.dataset.theme !== 'dark';
 page.classList.toggle('light', light);
 themeButton.setAttribute('aria-label', light ? locales[locale].dark : locales[locale].light);
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
 document.querySelectorAll('.process-grid article').forEach((article,index)=>{
  article.querySelector('h3').textContent=t.process[index][0];
  article.querySelector('p').textContent=t.process[index][1];
 });
 text('.projects .section-title',t.projects);
 syncTheme();
}
document.addEventListener('themechange',syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
