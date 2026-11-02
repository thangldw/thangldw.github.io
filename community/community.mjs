import vi from './locales/vi.mjs?v=20261103-compact';
import ja from './locales/ja.mjs?v=20261103-compact';
import zh from './locales/zh.mjs?v=20261103-compact';

const messages = { en: {}, vi, ja, zh };
const buttons = document.querySelectorAll('.locale-switch button');
const bindings = [];

function bind(key, node) {
  if (node) bindings.push({ key, node, english: node.nodeValue });
}

// Bind text and attribute nodes so switching languages keeps links, icons,
// form values and the open state of individual engineering notes intact.
document.querySelectorAll('[data-copy]').forEach(el => bind(el.dataset.copy, el.firstChild));
const attributes = [
  ['homeLabel', '.site-brand', 'aria-label'],
  ['languageLabel', '.locale-switch', 'aria-label'],
  ['resources', 'footer nav', 'aria-label'],
  ['lead', 'meta[name="description"]', 'content'],
  ['lead', 'meta[property="og:description"]', 'content'],
  ['supportClose', '#supportClose', 'aria-label'],
  ['internationalOptions', '.support-international', 'aria-label'],
  ['kofiAction', '.support-kofi-button', 'aria-label'],
  ['qrAlt', '.support-bank figure img', 'alt'],
];
for (const [key, selector, attribute] of attributes) {
  bind(key, document.querySelector(selector)?.getAttributeNode(attribute));
}

const kofi = document.querySelector('.support-kofi-button');
if (kofi) kofi.textContent = 'Support on Ko-fi';
const supportText = {
  support: '#supportDialogTitle',
  supportKicker: '.support-kicker',
  supportIntro: '#supportDialogIntro',
  international: '.support-international .support-option-label',
  sponsorIntro: '.support-github h3 + p',
  frequency: '.sponsor-frequency legend',
  monthly: 'label[for="sharedSponsorMonthly"]',
  once: 'label[for="sharedSponsorOneTime"]',
  amount: '.sponsor-amount-label',
  continueGithub: '.support-primary',
  amountHelp: '#sharedSponsorAmountHelp',
  kofiCopy: '.support-kofi-copy',
  kofiAction: '.support-kofi-button',
  vietnam: '.support-bank .support-option-label',
  bank: '.support-bank h3',
  qrCaption: '.support-bank figcaption',
};
for (const [key, selector] of Object.entries(supportText)) {
  document.querySelectorAll(selector).forEach(el => bind(key, el.firstChild));
}

function render(language) {
  const copy = messages[language];
  for (const { key, node, english } of bindings) {
    node.nodeValue = copy[key] ?? english;
  }
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  document.title = (copy.pageTitle || 'Contributing to the Community') + ' — Thang Luu';
  document.querySelector('meta[property="og:title"]').content = document.title;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
}

const preference = 'community.site.locale';
buttons.forEach(button => button.addEventListener('click', () => {
  const language = button.dataset.lang;
  render(language);
  const url = new URL(location.href);
  url.searchParams.set('lang', language);
  history.replaceState(null, '', url);
  try { localStorage.setItem(preference, language); } catch { /* The URL retains the selection. */ }
}));
let requested = new URLSearchParams(location.search).get('lang');
if (!requested) {
  try { requested = localStorage.getItem(preference); } catch { /* Default to English. */ }
}
render(Object.hasOwn(messages, requested) ? requested : 'en');

function syncThemeIcon() {
  document.getElementById('themeToggle').textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
}
document.addEventListener('themechange', syncThemeIcon);
syncThemeIcon();
