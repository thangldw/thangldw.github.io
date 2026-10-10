import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const catalog = JSON.parse(await readFile(new URL('../js/projects-data.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../js/projects-data.js', import.meta.url), 'utf8');
const manifest = {schemaVersion:'1.0', certificationCount:2, certifications:[
  {id:'ap', slug:'ap', shortName:'AP', name:'Applied Information Technology', issuer:'IPA', syllabusVersion:'2026', href:'/ap/', availableQuestionCount:869},
  {id:'aws', slug:'aws', shortName:'AWS SAA', name:'AWS SAA', issuer:'AWS', syllabusVersion:'SAA-C03', href:'/aws/', availableQuestionCount:704}
]};
const requests = [];
const window = {};
vm.runInNewContext(source, {window, location:{origin:'https://thangldw.github.io'}, URL, fetch:async url => {
  requests.push(url);
  return {ok:true, json:async()=>url.endsWith('projects-data.json')?structuredClone(catalog):manifest};
}});
await window.portfolioProjectsReady;
assert.deepEqual(requests, ['/js/projects-data.json', '/assets/learning/certifications-manifest.json']);
assert.equal(window.portfolioCertificationProjects.length, 1);
assert.equal(window.portfolioCertificationProjects[0].href, '/aws/');
for (const lang of ['vi','ja','zh']) assert.ok(window.portfolioCertificationProjects[0].localizedDescriptions[lang]);
assert.equal(window.portfolioLearningCollections[0].href, '/apps/?group=learning');
assert.equal(window.portfolioCertificationProjects.some(project=>project.href==='/ap/'), false);
console.log('Passed public-manifest discovery, duplicate destination prevention, localized descriptions, and unified catalog navigation.');
