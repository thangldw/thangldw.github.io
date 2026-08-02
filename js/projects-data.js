(function (global) {
  'use strict';

  function requireProject(project, index) {
    var required = ['id', 'title', 'description', 'href', 'ariaLabel', 'icon', 'accent', 'status', 'tags', 'category', 'cta'];
    if (!project || typeof project !== 'object') {
      throw new TypeError('Project at index ' + index + ' must be an object.');
    }
    required.forEach(function (key) {
      if (project[key] === undefined || project[key] === null || project[key] === '') {
        throw new TypeError('Project ' + index + ' is missing ' + key + '.');
      }
    });
    if (!Array.isArray(project.tags)) {
      throw new TypeError('Project ' + project.id + ' must provide a tags array.');
    }
    return project;
  }

  global.portfolioProjectsReady = fetch('/js/projects-data.json', {
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Could not load project catalog: HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (catalog) {
      if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.projects) || !Array.isArray(catalog.learningCollections)) {
        throw new TypeError('Unsupported project catalog schema.');
      }

      var projects = catalog.projects.map(requireProject);
      var learningCollections = catalog.learningCollections.map(requireProject);
      var identifiers = projects.concat(learningCollections).map(function (project) { return project.id; });
      if (new Set(identifiers).size !== identifiers.length) {
        throw new TypeError('Project catalog IDs must be unique.');
      }

      global.portfolioProjects = projects;
      global.portfolioLanguageCollection = catalog.languageCollection || null;
      global.portfolioLearningCollections = learningCollections;
      return catalog;
    });
})(window);
