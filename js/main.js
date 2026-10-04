(async function () {
  'use strict';
  var rail = document.getElementById('projectRail');
  var status = document.getElementById('projectLoadStatus');
  if (!rail) return;
  try {
    await window.portfolioProjectsReady;
  } catch (error) {
    if (status) status.textContent = 'Selected work is unavailable. Please open All projects or contact me.';
    return;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  var collection = window.portfolioLanguageCollection;
  var projects = (window.portfolioProjects || [])
    .filter(function (project) { return project.featured; })
    .concat(collection ? Object.assign({ id: 'certification-study', isLanguageCollection: true }, collection) : [])
    .sort(function (left, right) {
      return (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (right.featuredOrder ?? Number.MAX_SAFE_INTEGER)
        || left.title.localeCompare(right.title, 'en', { numeric: true, sensitivity: 'base' });
    });
  rail.innerHTML = projects.map(function (project) {
    var kind = project.isLanguageCollection ? project.label : project.categoryLabel;
    var evidence = project.evidenceLabel;
    return '<a class="resume-project' + (project.isLanguageCollection ? ' language-project' : '') + '" href="' + escapeHtml(project.caseStudyHref || project.href) + '" data-analytics-event="selected_work_open" data-analytics-project="' + escapeHtml(project.id) + '">' +
      '<span class="project-kind">' + escapeHtml(kind || 'Engineering project') + '</span>' +
      '<h3>' + escapeHtml(project.title) + '</h3>' +
      '<p>' + escapeHtml(project.featuredDescription || project.description) + '</p>' +
      (evidence ? '<span class="project-evidence">' + escapeHtml(evidence) + '</span>' : '') +
      '<span class="project-read">' + (project.caseStudyHref ? 'Read case study' : 'View project') + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>';
  }).join('');
  if (status) {
    status.hidden = projects.length > 0;
    if (!projects.length) status.textContent = 'Selected work is unavailable. Please open All projects or contact me.';
  }
})();
