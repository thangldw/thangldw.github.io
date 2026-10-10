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
    if (project.caseStudyHref !== undefined && (typeof project.caseStudyHref !== 'string' || !project.caseStudyHref.startsWith('/case-studies/'))) {
      throw new TypeError('Project ' + project.id + ' has an invalid caseStudyHref.');
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
        description: countLabel + ' with exam practice, notes, and learning history stored in your browser.',
        tags: [manifest.certificationCount + ' certifications', 'Exam practice', 'Local-first']
      });
    });
    var knownPaths = new Set(catalog.projects.map(function (project) { return new URL(project.href, location.origin).pathname; }));
    global.portfolioCertificationProjects = manifest.certifications.filter(function (entry) { return !knownPaths.has(entry.href); }).map(function (entry) {
      var name = entry.shortName, count = entry.availableQuestionCount;
      return {
        id: 'cert-' + entry.id, title: name, href: entry.href,
        description: 'Study ' + name + ' with ' + count.toLocaleString('en') + ' available practice questions.',
        localizedDescriptions: {
          vi: 'Ôn luyện ' + name + ' với ' + count.toLocaleString('vi') + ' câu hỏi hiện có.',
          ja: name + 'を' + count.toLocaleString('ja') + '問の練習問題で学習。',
          zh: '通过 ' + count.toLocaleString('zh') + ' 道练习题学习 ' + name + '。'
        },
        ariaLabel: 'Open ' + name, icon: 'fa-graduation-cap', accent: 'rust', status: 'Live',
        tags: [entry.name, entry.issuer, entry.syllabusVersion], category: 'certification-study',
        categoryLabel: 'Certification preparation', catalogGroup: 'learning', cta: 'Open'
      };
    });
    global.portfolioCertificationManifest = manifest;
    return catalog;
  }

  var catalogRequest = fetchJson('/js/projects-data.json');
  var certificationRequest = fetchJson('/assets/learning/certifications-manifest.json')
    .catch(function () { return null; });

  global.portfolioProjectsReady = Promise.all([catalogRequest, certificationRequest])
    .then(function (results) {
      var catalog = applyCertificationManifest(results[0], results[1]);
      if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.projects) || !Array.isArray(catalog.learningCollections)) {
        throw new TypeError('Unsupported project catalog schema.');
      }

      var projects = catalog.projects.map(requireProject);
      var learningCollections = catalog.learningCollections.map(requireProject);
      if (catalog.languageCollection && catalog.languageCollection.caseStudyHref !== undefined &&
          (typeof catalog.languageCollection.caseStudyHref !== 'string' || !catalog.languageCollection.caseStudyHref.startsWith('/case-studies/'))) {
        throw new TypeError('Certification Library has an invalid caseStudyHref.');
      }
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
