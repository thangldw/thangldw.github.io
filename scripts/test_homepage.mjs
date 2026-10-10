import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, projectTranslations } from '../js/home-locales.mjs';
import { sortProjects, circularIndex, visibleProjects } from '../js/home-project-order.mjs';
const catalog=JSON.parse(await readFile(new URL('../js/projects-data.json',import.meta.url),'utf8'));
const projects=sortProjects(catalog.projects.concat(catalog.learningCollections));
assert.equal(new Set(projects.map(project=>project.id)).size,projects.length);
assert.equal(projects[0].title,'3級FP');
assert.equal(projects.at(-1).title,'Toolbox');
assert.equal(projects.findIndex(project=>project.title==='AP') < projects.findIndex(project=>project.title==='Awesome Maintainer Defense'),true);
for(const count of [1,2,3]) {
 let start=0;
 const visited=new Set();
 for(let index=0;index<projects.length*3;index++) {
  const cards=visibleProjects(projects,start,count);
  assert.equal(cards.length,count);
  assert.equal(new Set(cards.map(project=>project.id)).size,count);
  visited.add(cards[0].id);
  start=circularIndex(start+1,projects.length);
 }
 assert.equal(start,0);
 assert.equal(visited.size,projects.length);
 start=circularIndex(-1,projects.length);
 assert.equal(visibleProjects(projects,start,count)[0].id,projects.at(-1).id);
 for(let index=0;index<projects.length;index++) start=circularIndex(start-1,projects.length);
 assert.equal(start,projects.length-1);
}
for(const locale of ['en','vi','ja','zh']) {
 const t=locales[locale];
 assert.deepEqual(Object.keys(t).sort(),Object.keys(locales.en).sort());
 assert.equal(t.roles.length,3);
 assert.equal(t.process.length,4);
 assert.equal(t.bio.length,2);
 assert.ok(t.count(1,3,projects.length).includes(String(projects.length)));
 if(locale!=='en') for(const project of projects) assert.ok(projectTranslations[locale][project.id],`${locale}: missing ${project.id}`);
}
console.log(`Passed circular navigation in both directions at 1/2/3 cards, A–Z ordering, and complete locale coverage for ${projects.length} projects.`);
