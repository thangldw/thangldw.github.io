import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, projectTranslations } from '../js/home-locales.mjs';
import { sortProjects, projectGroups, filterProjects } from '../js/home-project-order.mjs';
const catalog=JSON.parse(await readFile(new URL('../js/projects-data.json',import.meta.url),'utf8'));
const projects=sortProjects(catalog.projects);
assert.equal(new Set(projects.map(project=>project.id)).size,projects.length);
assert.equal(projects[0].title,'Awesome Maintainer Defense');
assert.equal(projects.find(p=>p.id==='macinity').title,'Macinity');
assert.equal(projects.find(p=>p.id==='macinity').status,'v3.1.0');
assert.deepEqual(filterProjects(projects,'all'),projects);
let grouped=0;
for(const group of projectGroups) {
 const members=filterProjects(projects,group);
 assert.ok(members.length>0,`group ${group} is empty`);
 assert.ok(members.every(project=>project.catalogGroup===group));
 grouped+=members.length;
}
assert.equal(grouped,projects.length,'every project belongs to exactly one filter group');
for(const locale of ['en','vi','ja','zh']) {
 const t=locales[locale];
 assert.deepEqual(Object.keys(t).sort(),Object.keys(locales.en).sort());
 assert.equal(t.roles.length,3);
 assert.equal(t.process.length,4);
 assert.equal(t.bio.length,2);
 assert.equal(t.groupNames.length,projectGroups.length);
 assert.ok(t.filterAll&&t.filterLabel);
 if(locale!=='en') for(const project of projects) assert.ok(projectTranslations[locale][project.id] || project.localizedDescriptions?.[locale],`${locale}: missing ${project.id}`);
}
console.log(`Passed A–Z ordering, filter groups covering all ${projects.length} projects, and complete locale coverage.`);
