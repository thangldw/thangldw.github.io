import { locales } from './home-locales.mjs?v=20261125-city';
import { bindLocaleSwitch } from './site-locale.mjs';

const root = document.documentElement;
const page = document.body.dataset.page;
const themeButton = document.getElementById('themeToggle');
const localeButtons = [...document.querySelectorAll('.locale-switch button')];
let locale = 'en';

// The home page used to carry #apps and #community sections; keep those links working.
if (page === 'home' && ['#apps', '#community'].includes(location.hash)) {
 location.replace(`/${location.hash.slice(1)}/${location.search}`);
}

function syncTheme() {
 themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? locales[locale].light : locales[locale].dark);
}

// Values for [data-home] keys that are not plain strings in home-locales.
const derived = {
 statement: t => t.headline,
 bio0: t => t.bio[0],
 motto: t => t.motto.join(', ')
};

const tagline = t => t.headline.replace(/[.。]$/, '');
const titles = {
 home: t => tagline(t),
 apps: t => `${t.projects} — ${tagline(t)}`,
 community: t => `${t.communityTitle} — ${tagline(t)}`
};

function renderLocale() {
 const t = locales[locale];
 root.lang = locale === 'zh' ? 'zh-CN' : locale;
 document.title = titles[page](t);
 document.querySelector('.skip-link').textContent = t.skip;
 document.querySelector('.site-brand').setAttribute('aria-label', t.home);
 document.querySelector('.locale-switch').setAttribute('aria-label', t.languageSwitch);
 localeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === locale)));
 document.querySelectorAll('[data-home]').forEach(el => {
  const key = el.dataset.home;
  el.textContent = derived[key] ? derived[key](t) : t[key];
 });
 document.querySelectorAll('[data-area]').forEach(el => { el.textContent = t.areas[el.dataset.area][0]; });
 document.querySelectorAll('[data-area-text]').forEach(el => { el.textContent = t.areas[el.dataset.areaText][1]; });
 const supportLabel = document.querySelector('.support-floating-trigger span');
 if (supportLabel) supportLabel.textContent = t.support;
 syncTheme();
 document.dispatchEvent(new CustomEvent('homelocale', { detail: { locale, copy: t } }));
}
document.addEventListener('themechange', syncTheme);
bindLocaleSwitch(language => { locale = language; renderLocale(); });
