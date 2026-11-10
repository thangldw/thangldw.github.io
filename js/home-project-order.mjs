export function sortProjects(projects) {
 return [...projects].sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' }));
}
export const projectGroups = ['engineering', 'utilities', 'learning', 'experiments'];
export function filterProjects(projects, group) {
 return group === 'all' ? projects : projects.filter(project => project.catalogGroup === group);
}
