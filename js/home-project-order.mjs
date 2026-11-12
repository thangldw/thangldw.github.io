export function sortProjects(projects) {
 return [...projects].sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' }));
}
export const projectGroups = ['engineering', 'utilities', 'learning', 'experiments'];
export function featuredProjects(projects) {
 return projects.filter(project => project.featured === true);
}
// Fisher–Yates; `random` is injectable so the order can be tested deterministically.
export function shuffle(items, random = Math.random) {
 const result = [...items];
 for (let index = result.length - 1; index > 0; index--) {
  const swap = Math.floor(random() * (index + 1));
  [result[index], result[swap]] = [result[swap], result[index]];
 }
 return result;
}
export function circularIndex(index, length) {
 return ((index % length) + length) % length;
}
export function visibleProjects(projects, start, count) {
 return Array.from({ length: Math.min(count, projects.length) }, (_, offset) => projects[circularIndex(start + offset, projects.length)]);
}
