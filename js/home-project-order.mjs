export function sortProjects(projects) {
 return [...projects].sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' }));
}
export function circularIndex(index, length) {
 return ((index % length) + length) % length;
}
export function visibleProjects(projects, start, count) {
 return Array.from({ length: Math.min(count, projects.length) }, (_, offset) => projects[circularIndex(start + offset, projects.length)]);
}
