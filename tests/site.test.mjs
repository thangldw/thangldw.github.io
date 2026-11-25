import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(join(root, file), 'utf8');
const pages = ['404.html', 'index.html', 'apps/index.html', 'community/index.html', 'japan-pr-guide/index.html',
  'proofline/index.html', 'ragops/index.html', 'awesome-maintainer-defense/index.html'];

// Files that nothing in this repo references but other repositories load by URL.
const externalConsumers = new Set([
  'css/app-brand.css', // thangldw/cert product pages
  'css/support-tokens.css', // isolated export for independent project sites (README)
]);

test('shared header, footer and asset versions are in sync', () => {
  try {
    execFileSync(process.execPath, [join(root, 'scripts/sync-shell.mjs'), '--check'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    assert.fail(`Run "npm run sync-shell".\n${error.stdout}`);
  }
});

test('every local href and src resolves to a file', () => {
  const missing = [];
  for (const page of pages) {
    for (const [, url] of read(page).matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)) {
      const path = decodeURIComponent(url.split(/[?#]/)[0]);
      const target = path.endsWith('/') ? join(path, 'index.html') : path;
      if (!existsSync(join(root, target))) missing.push(`${page}: ${url}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('sitemap lists only pages that exist', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>https:\/\/thangldw\.github\.io(\/[^<]*)<\/loc>/g)].map(m => m[1]);
  assert.ok(urls.length > 0);
  for (const path of urls) assert.ok(existsSync(join(root, path.endsWith('/') ? join(path, 'index.html') : path)), path);
});

test('every stylesheet and script is used or deliberately kept for another repository', () => {
  const files = ['css', 'js', 'js/community-locales'].flatMap(dir =>
    readdirSync(join(root, dir)).map(name => `${dir}/${name}`).filter(file => statSync(join(root, file)).isFile()));
  const corpus = [...pages, ...files].map(read).join('\n');
  const unused = files.filter(file => !externalConsumers.has(file)
    && !corpus.includes(`/${file}`) && !corpus.includes(`./${file.split('/').pop()}`) && !corpus.includes(`/${file.split('/').pop()}`));
  assert.deepEqual(unused, []);
});

test('pages follow the CSP: no inline styles or inline scripts', () => {
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /\sstyle="/, `${page} has an inline style attribute`);
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(m => !/application\/ld\+json/.test(m[1]));
    assert.equal(inline.length, 0, `${page} has an inline script`);
  }
});

test('shell pages carry the same landmarks', () => {
  for (const page of ['index.html', 'apps/index.html', 'community/index.html', 'japan-pr-guide/index.html']) {
    const html = read(page);
    for (const needle of ['id="siteHeader"', 'id="supportSlot"', 'id="themeToggle"', 'class="home-foot"', 'data-footer-year']) {
      assert.ok(html.includes(needle), `${page} is missing ${needle}`);
    }
  }
});

test('project catalog entries are complete and translated', async () => {
  const { projects } = JSON.parse(read('js/projects-data.json'));
  const { projectTranslations } = await import('../js/project-translations.mjs');
  const required = ['id', 'title', 'description', 'href', 'ariaLabel', 'icon', 'accent', 'status', 'tags', 'category', 'categoryLabel', 'cta'];
  const ids = new Set();
  for (const project of projects) {
    for (const key of required) assert.ok(project[key] !== undefined && project[key] !== '', `${project.id}: missing ${key}`);
    assert.ok(!ids.has(project.id), `duplicate id ${project.id}`);
    ids.add(project.id);
    assert.match(project.href, /^(https:\/\/|\/)/, `${project.id}: href`);
    for (const lang of ['vi', 'ja', 'zh']) {
      assert.ok(projectTranslations[lang][project.id] || project.localizedDescriptions?.[lang], `${project.id}: no ${lang} description`);
    }
  }
  for (const lang of Object.keys(projectTranslations)) {
    for (const id of Object.keys(projectTranslations[lang])) assert.ok(ids.has(id), `${lang} translates unknown project ${id}`);
  }
});

test('locale files define the same keys in every language', async () => {
  const { locales } = await import('../js/home-locales.mjs');
  const expected = Object.keys(locales.en).sort();
  for (const lang of ['vi', 'ja', 'zh']) assert.deepEqual(Object.keys(locales[lang]).sort(), expected, `home locale ${lang}`);

  const community = Object.fromEntries(await Promise.all(['vi', 'ja', 'zh'].map(async lang =>
    [lang, (await import(`../js/community-locales/${lang}.mjs`)).default])));
  const base = Object.keys(community.vi).sort();
  for (const lang of ['ja', 'zh']) assert.deepEqual(Object.keys(community[lang]).sort(), base, `community locale ${lang}`);
});
