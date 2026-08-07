(function (global) {
  'use strict';

  function requireProject(project, index) {
    var required = ['id', 'title', 'description', 'href', 'ariaLabel', 'icon', 'accent', 'status', 'tags', 'category', 'categoryLabel', 'cta'];
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

  function fetchJson(url) {
    return fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Could not load ' + url + ': HTTP ' + response.status);
      return response.json();
    });
  }

  function applyCertificationManifest(catalog, manifest) {
    if (!manifest || manifest.schemaVersion !== '1.0' || !Array.isArray(manifest.certifications)) {
      return catalog;
    }
    if (manifest.certificationCount !== manifest.certifications.length) {
      throw new TypeError('Certification manifest count does not match its entries.');
    }
    var names = manifest.certifications.map(function (certification) {
      return certification.shortName;
    });
    var countLabel = manifest.certificationCount + ' certification programs';
    var namesLabel = names.join(', ');

    catalog.languageCollection = Object.assign({}, catalog.languageCollection, {
      description: 'Focused dashboards, exam practice, notes, and local learning history for ' + namesLabel + '.',
      label: countLabel
    });
    catalog.learningCollections = catalog.learningCollections.map(function (collection) {
      if (collection.id !== 'certification-study') return collection;
      return Object.assign({}, collection, {
        description: 'One focused study space for ' + namesLabel + '.',
        tags: [manifest.certificationCount + ' certifications', 'Exam practice', 'Local-first']
      });
    });
    global.portfolioCertificationManifest = manifest;
    return catalog;
  }

  var catalogRequest = fetchJson('/js/projects-data.json');
  var certificationRequest = fetchJson('/apps/cert/certifications-manifest.json')
    .catch(function () { return null; });

  global.portfolioProjectsReady = Promise.all([catalogRequest, certificationRequest])
    .then(function (results) {
      var catalog = applyCertificationManifest(results[0], results[1]);
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
