import { locales } from './home-locales.mjs?v=20261124-merge';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
let locale = 'en';

function syncTheme() {
 themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? locales[locale].light : locales[locale].dark);
}

// Values for [data-home] keys that are not plain strings in home-locales.
const derived = {
 role: t => t.roles[0][0],
 statement: t => t.headline.join(''),
 motto: t => t.motto.join(', ')
};

function renderLocale() {
 const t = locales[locale];
 root.lang = locale === 'zh' ? 'zh-CN' : locale;
 document.title = `Thang Luu — ${t.roles[0][0]}`;
 document.querySelector('.skip-link').textContent = t.skip;
 document.querySelector('.site-brand').setAttribute('aria-label', t.home);
 document.querySelector('.locale-switch').setAttribute('aria-label', t.languageSwitch);
 localeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === locale)));
 document.querySelectorAll('[data-home]').forEach(el => {
  const key = el.dataset.home;
  el.textContent = derived[key] ? derived[key](t) : t[key];
 });
 document.querySelectorAll('.bio p').forEach((paragraph, index) => { paragraph.textContent = t.bio[index]; });
 document.querySelectorAll('.process-steps li').forEach((step, index) => {
  step.querySelector('h3').textContent = t.process[index][0];
  step.querySelector('p').textContent = t.process[index][1];
 });
 const supportLabel = document.querySelector('.support-floating-trigger span');
 if (supportLabel) supportLabel.textContent = t.support;
 syncTheme();
}
document.addEventListener('themechange', syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
