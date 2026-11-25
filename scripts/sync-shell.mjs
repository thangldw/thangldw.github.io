#!/usr/bin/env node
// Keeps the shared header/footer identical across pages and stamps /css and /js references with a
// content hash, so a changed file always gets a new URL. No dependencies; run from anywhere.
//   node scripts/sync-shell.mjs          write changes
//   node scripts/sync-shell.mjs --check  exit 1 if any file would change
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { footer, header } from '../shared/shell.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

// Pages that carry the shared shell, and which variant each uses.
export const shellPages = {
  'index.html': 'localized',
  'apps/index.html': 'localized',
  'community/index.html': 'localized',
  'japan-pr-guide/index.html': 'plain',
  '_sources/japan-pr-guide/index.html': 'plain',
};
// Pages whose /css and /js references are version-stamped (shell pages plus the older product pages).
const stampedPages = [
  '404.html', 'index.html', 'apps/index.html', 'community/index.html', 'japan-pr-guide/index.html',
  'proofline/index.html', 'ragops/index.html', 'awesome-maintainer-defense/index.html',
];

const read = file => readFileSync(join(root, file), 'utf8');
const stripVersion = value => value.replace(/\?v=[^'"\s)]*/g, '');

// Hash of a module plus everything it imports, ignoring the version strings inside it.
const hashes = new Map();
function assetHash(file, trail = []) {
  if (hashes.has(file)) return hashes.get(file);
  if (trail.includes(file)) throw new Error(`Import cycle: ${[...trail, file].join(' -> ')}`);
  const full = join(root, file);
  const body = stripVersion(readFileSync(full, 'utf8'));
  const hash = createHash('sha256').update(body);
  if (/\.m?js$/.test(file)) {
    for (const [, spec] of body.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const target = resolveSpec(file, spec);
      if (target) hash.update(assetHash(target, [...trail, file]));
    }
  }
  const digest = hash.digest('hex').slice(0, 8);
  hashes.set(file, digest);
  return digest;
}

function resolveSpec(fromFile, spec) {
  const clean = stripVersion(spec);
  if (clean.startsWith('/')) return existsSync(join(root, clean)) ? clean.slice(1) : null;
  if (clean.startsWith('.')) {
    const target = posix.normalize(posix.join(posix.dirname(fromFile), clean));
    return existsSync(join(root, target)) ? target : null;
  }
  return null;
}

function stampHtml(page, html) {
  return html.replace(/((?:href|src)=")(\/(?:css|js)\/[^"?]+)(?:\?v=[^"]*)?(")/g, (match, open, path, close) =>
    existsSync(join(root, path)) ? `${open}${path}?v=${assetHash(path.slice(1))}${close}` : match);
}

function stampModule(file, source) {
  return source.replace(/(from\s+['"])([^'"]+?)(?:\?v=[^'"]*)?(['"])/g, (match, open, spec, close) => {
    const target = resolveSpec(file, spec);
    return target ? `${open}${spec}?v=${assetHash(target)}${close}` : match;
  });
}

function syncShell(page, html) {
  const variant = shellPages[page];
  if (!variant) return html;
  const swap = (source, pattern, next, label) => {
    if (!pattern.test(source)) throw new Error(`${page}: no ${label} found`);
    return source.replace(pattern, () => next);
  };
  html = swap(html, /<header[^>]*id="siteHeader"[\s\S]*?<\/header>/, header(variant), 'shared header');
  return swap(html, /<footer class="home-foot"[\s\S]*?<\/footer>/, footer(variant), 'shared footer');
}

const moduleFiles = ['js', 'js/community-locales'].flatMap(dir =>
  readdirSync(join(root, dir)).filter(name => /\.m?js$/.test(name)).map(name => `${dir}/${name}`));

const changed = [];
function apply(file, next) {
  if (read(file) === next) return;
  changed.push(file);
  if (!check) writeFileSync(join(root, file), next);
}

for (const page of new Set([...Object.keys(shellPages), ...stampedPages])) {
  let html = syncShell(page, read(page));
  if (stampedPages.includes(page)) html = stampHtml(page, html);
  apply(page, html);
}
for (const file of moduleFiles) apply(file, stampModule(file, read(file)));

if (changed.length) {
  console.log(`${check ? 'Out of date' : 'Updated'}: ${changed.map(f => relative('.', join(root, f))).join(', ')}`);
  if (check) process.exit(1);
} else {
  console.log('Shell and asset versions are up to date.');
}
