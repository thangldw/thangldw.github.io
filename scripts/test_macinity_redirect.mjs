import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../js/macinity-redirect.js', import.meta.url), 'utf8');
for (const path of ['/toolbox', '/toolbox/', '/toolbox/index.html', '/toolbox/guide.html?lang=vi#install', '/toolbox/privacy.html?x=1&x=2#local', '/toolbox/unknown.html']) {
  let redirected;
  runInNewContext(source, {URL, location: {href: 'https://thangldw.github.io' + path, replace: value => { redirected = value; }}});
  assert.equal(redirected, 'https://thangldw.github.io' + path.replace(/^\/toolbox/, '/macinity'));
}
for (const path of ['/macinity/', '/toolbox-other/', '/apps/']) {
  let redirected = false;
  runInNewContext(source, {URL, location: {href: 'https://thangldw.github.io' + path, replace: () => { redirected = true; }}});
  assert.equal(redirected, false);
}
const catalog = JSON.parse(readFileSync(new URL('../js/projects-data.json', import.meta.url)));
assert.equal(catalog.projects.find(p => p.id === 'toolbox').href, 'https://thangldw.github.io/macinity/');
console.log('PASS: Macinity redirects preserve path, query and fragment; unrelated routes unchanged; catalog canonical URL');
