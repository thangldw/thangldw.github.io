import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, projectTranslations } from '../js/home-locales.mjs';
import { sortProjects, featuredProjects, shuffle, circularIndex, visibleProjects, projectGroups } from '../js/home-project-order.mjs';
const catalog=JSON.parse(await readFile(new URL('../js/projects-data.json',import.meta.url),'utf8'));
const projects=sortProjects(catalog.projects);
assert.equal(new Set(projects.map(project=>project.id)).size,projects.length);
assert.equal(projects[0].title,'Awesome Maintainer Defense');
assert.equal(projects.find(p=>p.id==='macinity').title,'Macinity');
assert.equal(projects.find(p=>p.id==='macinity').status,'v3.1.0');
const featured=featuredProjects(projects);
assert.ok(featured.length>=5 && featured.every(p=>p.featured===true));
assert.equal(featured.length,projects.filter(p=>p.featured).length);
// Shuffle is a permutation, pure, and deterministic for a fixed rng.
const seq=[0.9,0.1,0.5,0.3,0.7,0.2,0.6];let i=0;const rng=()=>seq[i++%seq.length];
const shuffled=shuffle(featured,rng);
assert.deepEqual(shuffled.map(p=>p.id).sort(),featured.map(p=>p.id).sort());
assert.notDeepEqual(featured.map(p=>p.id),featured.map(p=>p.id).reverse());
assert.equal(shuffle([],rng).length,0);
assert.deepEqual(shuffle(featured,()=>0.999999).map(p=>p.id),featured.map(p=>p.id),'rng≈1 keeps order');
let different=false;for(let n=0;n<20&&!different;n++) different=shuffle(featured).map(p=>p.id).join()!==featured.map(p=>p.id).join();
assert.ok(different,'Math.random shuffle changes order');
// Circular window.
for(const count of [1,2,3,5]) {
 for(let s0=-2;s0<featured.length+2;s0++) {
  const w=visibleProjects(featured,s0,count);
  assert.equal(w.length,Math.min(count,featured.length));
  assert.equal(w[0],featured[circularIndex(s0,featured.length)]);
 }
}
assert.equal(visibleProjects(featured,featured.length-1,2)[1],featured[0],'wraps around');
assert.ok(featured.every(p=>projectGroups.includes(p.catalogGroup)),'featured projects use known catalog groups');
for(const locale of ['en','vi','ja','zh']) {
 const t=locales[locale];
 assert.deepEqual(Object.keys(t).sort(),Object.keys(locales.en).sort());
 assert.equal(t.roles.length,3);
 assert.equal(t.process.length,4);
 assert.equal(t.bio.length,2);
 assert.equal(t.groupNames.length,projectGroups.length);
 for(const key of ['previous','next','carousel','pause','play']) assert.ok(t[key],`${locale}: missing ${key}`);
 assert.ok(t.count(1,5,featured.length).includes(String(featured.length)));
 if(locale!=='en') for(const project of projects) assert.ok(projectTranslations[locale][project.id] || project.localizedDescriptions?.[locale],`${locale}: missing ${project.id}`);
}
console.log(`Passed A–Z ordering, shuffle/circular-window logic over ${featured.length} featured projects, and complete locale coverage.`);
