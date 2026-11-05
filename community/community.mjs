import vi from './locales/vi.mjs?v=20261103-signature';
import ja from './locales/ja.mjs?v=20261103-signature';
import zh from './locales/zh.mjs?v=20261103-signature';
import { bindLocaleSwitch } from '/js/site-locale.mjs';


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

bindLocaleSwitch(render, { updateUrl: true });

function syncThemeIcon() {
  document.getElementById('themeToggle').textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
}
document.addEventListener('themechange', syncThemeIcon);
syncThemeIcon();
