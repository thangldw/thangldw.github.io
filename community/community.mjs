import vi from './locales/vi.mjs?v=20261103-signature';
import ja from './locales/ja.mjs?v=20261103-signature';
import zh from './locales/zh.mjs?v=20261103-signature';


const messages = { en: {}, vi, ja, zh };
const buttons = document.querySelectorAll('.locale-switch button');
const bindings = [];

function bind(key, node) {
  if (node) bindings.push({ key, node, english: node.nodeValue });
}

// Bind text and attribute nodes so switching languages keeps links and
// the open state of individual engineering notes intact.
document.querySelectorAll('[data-copy]').forEach(el => bind(el.dataset.copy, el.firstChild));
const attributes = [
  ['homeLabel', '.site-brand', 'aria-label'],
  ['languageLabel', '.locale-switch', 'aria-label'],
  ['lead', 'meta[name="description"]', 'content'],
  ['lead', 'meta[property="og:description"]', 'content'],
];
for (const [key, selector, attribute] of attributes) {
  bind(key, document.querySelector(selector)?.getAttributeNode(attribute));
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
