(async function () {
  'use strict';
  var index = document.getElementById('projectIndex');
  var count = document.getElementById('projectCount');
  var empty = document.getElementById('catalogEmpty');
  var search = document.getElementById('projectSearch');
  var buttons = Array.from(document.querySelectorAll('.apps-group-nav button'));
  var activeGroup = 'all';
  var groups = [
    { id: 'engineering', title: 'Engineering', description: 'Build, evaluate, and protect software.' },
    { id: 'utilities', title: 'Utilities', description: 'A little help with everyday tasks.' },
    { id: 'learning', title: 'Learning', description: 'Study by topic and practise at your own pace.' },
    { id: 'experiments', title: 'Experiments', description: 'Games and things to explore.' }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function normalize(value) {
    return String(value).normalize('NFKC').toLocaleLowerCase().trim();
  }

  function renderCard(project) {
    var tags = (project.tags || []).slice(0, 3).map(escapeHtml).join(' <span aria-hidden="true">·</span> ');
    return '<a class="project-card" data-accent="' + escapeHtml(project.accent) + '" data-project-id="' + escapeHtml(project.id) + '" href="' + escapeHtml(project.href) + '" aria-label="' + escapeHtml(project.ariaLabel) + '">' +
      '<span class="project-icon" aria-hidden="true"><i class="fa-solid ' + escapeHtml(project.icon) + '"></i></span>' +
      '<div class="project-copy"><div class="project-card-top"><h4 class="project-title">' + escapeHtml(project.title) + '</h4><span class="project-status">' + escapeHtml(project.status) + '</span></div>' +
      '<p class="project-description">' + escapeHtml(project.catalogDescription || project.description) + '</p>' +
      '<span class="project-tags" aria-label="Project tags">' + tags + '</span></div>' +
      '<span class="project-destination">' + escapeHtml(project.cta) + ' <i class="project-arrow fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>';
  }

  var projects;
  try {
    await window.portfolioProjectsReady;
    projects = (window.portfolioProjects || []).concat(window.portfolioLearningCollections || []);
    projects.sort(function (left, right) {
      return (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (right.featuredOrder ?? Number.MAX_SAFE_INTEGER)
        || left.title.localeCompare(right.title, 'en', { numeric: true, sensitivity: 'base' });
    });
  } catch (error) {
    count.textContent = 'Projects unavailable';
    empty.hidden = false;
    return;
  }

  function render() {
    var tokens = normalize(search.value).split(/\s+/u).filter(Boolean);
    var visible = projects.filter(function (project) {
      var text = normalize([project.title, project.description, project.categoryLabel].concat(project.tags || []).join(' '));
      return (activeGroup === 'all' || project.catalogGroup === activeGroup)
        && tokens.every(function (token) { return text.includes(token); });
    });
    index.innerHTML = groups.map(function (group) {
      var members = visible.filter(function (project) { return project.catalogGroup === group.id; });
      if (!members.length) return '';
      return '<section class="catalog-group" aria-labelledby="' + group.id + '"><header class="catalog-group-heading"><div><h3 id="' + group.id + '">' + group.title + '</h3><p>' + group.description + '</p></div><span>' + members.length + '</span></header>' + members.map(renderCard).join('') + '</section>';
    }).join('');
    count.textContent = visible.length + (visible.length === 1 ? ' project' : ' projects') + (tokens.length ? ' matching your search' : '');
    empty.hidden = visible.length !== 0;
    if (!visible.length) {
      empty.innerHTML = '<h3>No projects found</h3><p>Try another keyword or browse all projects.</p><button type="button" id="resetCatalog">Clear filters</button>';
      document.getElementById('resetCatalog').addEventListener('click', function () {
        search.value = '';
        activeGroup = 'all';
        updateButtons();
        render();
        search.focus();
      });
    }
  }

  function updateButtons() {
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.group === activeGroup));
    });
  }

  search.disabled = false;
  search.addEventListener('input', render);
  buttons.forEach(function (button) {
    var total = button.dataset.group === 'all' ? projects.length : projects.filter(function (project) { return project.catalogGroup === button.dataset.group; }).length;
    button.insertAdjacentHTML('beforeend', ' <span aria-hidden="true">' + total + '</span>');
    button.disabled = false;
    button.addEventListener('click', function () {
      activeGroup = button.dataset.group;
      updateButtons();
      render();
    });
  });
  render();
})();
