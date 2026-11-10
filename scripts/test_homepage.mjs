import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, projectTranslations } from '../js/home-locales.mjs';
import { sortProjects, projectGroups, projectGroup, filterProjects } from '../js/home-project-order.mjs';
const catalog=JSON.parse(await readFile(new URL('../js/projects-data.json',import.meta.url),'utf8'));
const projects=sortProjects(catalog.projects);
assert.equal(new Set(projects.map(project=>project.id)).size,projects.length);
assert.equal(projects[0].title,'Awesome Maintainer Defense');
assert.equal(projects.find(p=>p.id==='macinity').title,'Macinity');
assert.equal(projects.find(p=>p.id==='macinity').status,'v3.1.0');
assert.equal(filterProjects(projects,'all').length,projects.length);
let covered=0;
for(const group of projectGroups) {
 const subset=filterProjects(projects,group);
 assert.ok(subset.length>0,`group ${group} has no projects`);
 assert.ok(subset.every(project=>projectGroup(project)===group));
 covered+=subset.length;
}
assert.equal(covered,projects.length,'every project belongs to exactly one filter group');
assert.deepEqual(filterProjects(projects,'Games').map(p=>p.id).includes('bizroll'),true);
for(const locale of ['en','vi','ja','zh']) {
 const t=locales[locale];
 assert.deepEqual(Object.keys(t).sort(),Object.keys(locales.en).sort());
 assert.equal(t.roles.length,3);
 assert.equal(t.process.length,4);
 assert.equal(t.bio.length,2);
 assert.ok(t.count(projects.length,projects.length).includes(String(projects.length)));
 assert.ok(t.count(2,projects.length).includes('2') && t.count(2,projects.length).includes(String(projects.length)));
 for(const group of projectGroups) assert.ok(t.groups[group],`${locale}: missing group label ${group}`);
 assert.ok(t.filterLabel && t.filterAll);
 if(locale!=='en') for(const project of projects) assert.ok(projectTranslations[locale][project.id] || project.localizedDescriptions?.[locale],`${locale}: missing ${project.id}`);
}
console.log(`Passed A–Z ordering, filter groups covering all ${projects.length} projects exactly once, and complete locale coverage.`);
