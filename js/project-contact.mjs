import { locales } from './home-locales.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const actions = {
  en: { gmail: 'Compose in Gmail (browser)', app: 'Open mail app' },
  vi: { gmail: 'Soạn thư bằng Gmail trên trình duyệt', app: 'Mở ứng dụng mail' },
  ja: { gmail: 'ブラウザーの Gmail で作成', app: 'メールアプリを開く' },
  zh: { gmail: '在浏览器中用 Gmail 写信', app: '打开邮件应用' }
};
const buttons = document.querySelectorAll('.locale-switch button');

function render(lang) {
  const t = locales[lang];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.title = t.discuss + ' — Thang Luu';
  document.querySelector('h1').textContent = t.discuss;
  document.querySelector('[data-footer-name]').textContent = t.discuss;
  document.querySelector('.skip-link').textContent = t.skip;
  document.querySelector('.site-brand').setAttribute('aria-label', t.home);
  document.querySelector('.locale-switch').setAttribute('aria-label', t.languageSwitch);
  document.querySelector('#gmail-link').textContent = actions[lang].gmail;
  document.querySelector('#mail-app-link').textContent = actions[lang].app;
  const supportLabel = document.querySelector('.support-floating-trigger span');
  if (supportLabel) supportLabel.textContent = t.support;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.lang === lang)));
}

bindLocaleSwitch(render, { updateUrl: true });
