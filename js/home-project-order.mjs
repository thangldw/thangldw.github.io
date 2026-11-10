export function sortProjects(projects) {
 return [...projects].sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' }));
}
export const projectGroups = ['Tools', 'Data & AI', 'Games', 'Learning'];
export function projectGroup(project) {
 if (project.catalogGroup === 'learning') return 'Learning';
 if (project.category === 'games') return 'Games';
 if (['ragops', 'proofline'].includes(project.id)) return 'Data & AI';
 return 'Tools';
}
export function filterProjects(projects, group) {
 return group === 'all' ? projects : projects.filter(project => projectGroup(project) === group);
}
