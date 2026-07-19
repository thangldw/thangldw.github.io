(function () {
  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character];
    });
  }

  function renderFeaturedProjects() {
    var rail = document.getElementById('projectRail');
    if (!rail) return;
    var projects = (window.portfolioProjects || [])
      .filter(function (project) { return project.featured; })
      .sort(function (left, right) { return left.featuredOrder - right.featuredOrder; });
    var cards = projects.map(function (project) {
      return '<a class="resume-project" href="' + escapeHtml(project.href) + '">' +
        '<h3>' + escapeHtml(project.title) + '</h3>' +
        '<p>' + escapeHtml(project.featuredDescription || project.description) + '</p>' +
        '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
    });
    var collection = window.portfolioLanguageCollection;
    if (collection) {
      cards.push('<a class="resume-project language-project" href="' + escapeHtml(collection.href) + '">' +
        '<span class="project-kind"><i class="fa-solid fa-book-open" aria-hidden="true"></i>' + escapeHtml(collection.label) + '</span>' +
        '<h3>' + escapeHtml(collection.title) + '</h3><p>' + escapeHtml(collection.description) + '</p>' +
        '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>');
    }
    rail.innerHTML = cards.join('');
  }

  renderFeaturedProjects();

  var root = document.documentElement;
  var themeButton = document.getElementById('themeToggle');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.spotlight-tab'));
  var panel = document.getElementById('spotlightPanel');
  var pauseButton = document.getElementById('spotlightPause');
  var timer = null;
  var paused = false;
  var projectRail = document.getElementById('projectRail');
  var projectCards = projectRail ? Array.prototype.slice.call(projectRail.querySelectorAll('.resume-project')) : [];
  var projectsPrev = document.getElementById('projectsPrev');
  var projectsNext = document.getElementById('projectsNext');
  var projectTimer = null;
  var projectPaused = false;
  var projectVisible = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var demos = {
    'data-copilot': {
      icon: 'fa-comments',
      title: 'Data Copilot',
      description: 'Chat with your data. Ask questions in plain English—across CSVs, SQL, and charts—and get answers, queries, and next steps.',
      purpose: 'Help teams explore, understand, and act on data faster with reliable context and transparent results.',
      href: 'apps/data-copilot/'
    },
    pipeline: {
      icon: 'fa-wave-square',
      title: 'Pipeline Observability',
      description: 'See freshness, coverage, and run history for the ELT pipeline behind Data Copilot—without hiding operational trade-offs.',
      purpose: 'Make data delivery observable, explainable, and easier for teams to operate with confidence.',
      href: 'apps/pipeline/'
    },
    ragops: {
      icon: 'fa-shield-halved',
      title: 'RAGOps',
      description: 'Evaluate RAG and agent releases against an accepted baseline, detect regressions, and preserve the evidence behind a decision.',
      purpose: 'Turn an ambiguous AI request into a defensible release decision with explicit trade-offs and open questions.',
      href: 'https://thangldw.github.io/ragops/'
    }
  };

  function syncTheme() {
    if (!themeButton) return;
    var dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    var icon = themeButton.querySelector('i');
    if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  function renderSpotlight(key, focusTab) {
    var demo = demos[key];
    if (!demo || !panel) return;
    tabs.forEach(function (tab) {
      var active = tab.dataset.spotlight === key;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    panel.innerHTML =
      '<div class="spotlight-icon" aria-hidden="true"><i class="fa-solid ' + demo.icon + '"></i></div>' +
      '<div class="spotlight-copy"><h2>' + demo.title + '</h2><p>' + demo.description + '</p>' +
      '<a href="' + demo.href + '">Open demo <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>' +
      '<div class="spotlight-purpose"><h3>Purpose</h3><p>' + demo.purpose + '</p></div>';
  }

  function activeIndex() {
    return Math.max(0, tabs.findIndex(function (tab) { return tab.classList.contains('active'); }));
  }

  function restartRotation() {
    if (timer) window.clearInterval(timer);
    if (paused || tabs.length < 2) return;
    timer = window.setInterval(function () {
      var next = (activeIndex() + 1) % tabs.length;
      renderSpotlight(tabs[next].dataset.spotlight, false);
    }, 7000);
  }

  function nearestProjectIndex() {
    if (!projectRail || !projectCards.length) return 0;
    var railLeft = projectRail.getBoundingClientRect().left;
    var closest = 0;
    var distance = Infinity;
    projectCards.forEach(function (card, index) {
      var nextDistance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (nextDistance < distance) {
        closest = index;
        distance = nextDistance;
      }
    });
    return closest;
  }

  function showProject(index) {
    if (!projectCards.length) return;
    var target = (index + projectCards.length) % projectCards.length;
    projectRail.scrollTo({
      left: projectCards[target].offsetLeft - projectRail.offsetLeft,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }

  function stepProject(direction) {
    if (!projectRail || !projectCards.length) return;
    var maxScroll = Math.max(0, projectRail.scrollWidth - projectRail.clientWidth);
    var edgeTolerance = 2;
    if (direction > 0 && projectRail.scrollLeft >= maxScroll - edgeTolerance) {
      showProject(0);
      return;
    }
    if (direction < 0 && projectRail.scrollLeft <= edgeTolerance) {
      showProject(projectCards.length - 1);
      return;
    }
    showProject(nearestProjectIndex() + direction);
  }

  function stopProjectRotation() {
    if (projectTimer) window.clearInterval(projectTimer);
    projectTimer = null;
  }

  function restartProjectRotation() {
    stopProjectRotation();
    if (projectPaused || !projectVisible || reducedMotion.matches || projectCards.length < 2 || document.hidden) return;
    projectTimer = window.setInterval(function () {
      stepProject(1);
    }, 3000);
  }

  function setProjectPaused(next) {
    projectPaused = next;
    restartProjectRotation();
  }

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.theme = next;
      syncTheme();
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      renderSpotlight(tab.dataset.spotlight, false);
      restartRotation();
    });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      var direction = event.key === 'ArrowRight' ? 1 : -1;
      var next = (index + direction + tabs.length) % tabs.length;
      renderSpotlight(tabs[next].dataset.spotlight, true);
      restartRotation();
    });
  });

  if (pauseButton) {
    pauseButton.addEventListener('click', function () {
      paused = !paused;
      pauseButton.setAttribute('aria-pressed', String(paused));
      pauseButton.setAttribute('aria-label', paused ? 'Resume spotlight rotation' : 'Pause spotlight rotation');
      pauseButton.querySelector('i').className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
      pauseButton.querySelector('span').textContent = paused ? 'Resume' : 'Pause';
      restartRotation();
    });
  }

  if (projectRail) {
    projectRail.addEventListener('mouseenter', function () { setProjectPaused(true); });
    projectRail.addEventListener('mouseleave', function () { setProjectPaused(false); });
    projectRail.addEventListener('focusin', function () { setProjectPaused(true); });
    projectRail.addEventListener('focusout', function (event) {
      if (!projectRail.contains(event.relatedTarget)) setProjectPaused(false);
    });
    projectRail.addEventListener('pointerdown', function () { setProjectPaused(true); });
    projectRail.addEventListener('keydown', function (event) {
      if (event.target !== projectRail || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      stepProject(event.key === 'ArrowRight' ? 1 : -1);
    });
  }

  window.addEventListener('pointerup', function () {
    if (projectRail && !projectRail.matches(':hover') && !projectRail.contains(document.activeElement)) setProjectPaused(false);
  });

  if (projectRail && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      projectVisible = entries[0].isIntersecting;
      restartProjectRotation();
    }, { threshold: 0.5 }).observe(projectRail);
  } else {
    projectVisible = Boolean(projectRail);
  }

  if (projectsPrev) {
    projectsPrev.addEventListener('click', function () {
      stepProject(-1);
      restartProjectRotation();
    });
  }

  if (projectsNext) {
    projectsNext.addEventListener('click', function () {
      stepProject(1);
      restartProjectRotation();
    });
  }

  reducedMotion.addEventListener('change', restartProjectRotation);
  document.addEventListener('visibilitychange', restartProjectRotation);

  syncTheme();
  restartRotation();
  restartProjectRotation();
})();
