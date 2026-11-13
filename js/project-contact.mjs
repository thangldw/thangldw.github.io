import { locales } from './home-locales.mjs';
import { bindLocaleSwitch } from './site-locale.mjs';

const actions = {
  en: { gmail: 'Compose in Gmail (browser)', app: 'Open mail app', fit: 'Good fit', include: 'Helpful to include', includeText: 'The problem you want solved, the current state of your data and systems, and your timeline.' },
  vi: { gmail: 'Soạn thư bằng Gmail trên trình duyệt', app: 'Mở ứng dụng mail', fit: 'Phù hợp với', include: 'Nên nêu trong thư', includeText: 'Vấn đề cần giải quyết, hiện trạng dữ liệu và hệ thống, và mốc thời gian mong muốn.' },
  ja: { gmail: 'ブラウザーの Gmail で作成', app: 'メールアプリを開く', fit: 'ご相談いただける内容', include: 'お知らせいただきたいこと', includeText: '解決したい課題、データとシステムの現状、ご希望のスケジュール。' },
  zh: { gmail: '在浏览器中用 Gmail 写信', app: '打开邮件应用', fit: '适合的合作', include: '建议在邮件中说明', includeText: '需要解决的问题、数据与系统的现状，以及期望的时间安排。' }
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
  const facts = { fit: actions[lang].fit, fitText: t.invitation, languages: t.languages, include: actions[lang].include, includeText: actions[lang].includeText };
  document.querySelectorAll('[data-contact]').forEach(node => { node.textContent = facts[node.dataset.contact]; });
  const supportLabel = document.querySelector('.support-floating-trigger span');
  if (supportLabel) supportLabel.textContent = t.support;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.lang === lang)));
}

bindLocaleSwitch(render, { updateUrl: true });
