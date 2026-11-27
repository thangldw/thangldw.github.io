// Translations for the PR rows on the Community page.
// Page chrome (document language, title, meta) is owned by homepage.js.
import vi from './community-locales/vi.mjs?v=66f9809c';
import ja from './community-locales/ja.mjs?v=43b715a9';
import zh from './community-locales/zh.mjs?v=04c74766';
import { bindLocaleSwitch } from './site-locale.mjs?v=6fd22c76';

const messages = { en: {}, vi, ja, zh };
const bindings = [];

// Bind text nodes rather than elements so switching languages keeps links and
// the open state of individual engineering notes intact.
document.querySelectorAll('#community [data-copy]').forEach(el => {
  const node = el.firstChild;
  if (node) bindings.push({ key: el.dataset.copy, node, english: node.nodeValue });
});

bindLocaleSwitch(language => {
  const copy = messages[language];
  for (const { key, node, english } of bindings) node.nodeValue = copy[key] ?? english;
});
