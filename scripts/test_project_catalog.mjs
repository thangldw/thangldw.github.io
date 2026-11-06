import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const catalog = JSON.parse(await readFile(new URL('../js/projects-data.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../js/projects-data.js', import.meta.url), 'utf8');
const requests = [], window = {};
vm.runInNewContext(source, {window, fetch: async url => {
  requests.push(url);
  return {ok: true, json: async () => structuredClone(catalog)};
}});
await window.portfolioProjectsReady;
assert.deepEqual(requests, ['/js/projects-data.json']);
assert.equal(window.portfolioProjects.length, catalog.projects.length);
assert.ok(window.portfolioProjects.some(p => p.id === 'bjt'));
assert.ok(window.portfolioProjects.some(p => p.id === 'jetrise'));
assert.equal(window.portfolioLanguageCollection, null);
assert.equal(window.portfolioLearningCollections.length, 0);
assert.equal(window.portfolioProjects.some(p => ['pmp-studio','jlpt-n1-skills','ap','g-kentei','fp3','learning'].includes(p.id)), false);
console.log('Passed independent project catalog loading without retired certification discovery.');
