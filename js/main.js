(function () {
  var root = document.documentElement;
  var themeButton = document.getElementById('themeToggle');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.spotlight-tab'));
  var panel = document.getElementById('spotlightPanel');
  var pauseButton = document.getElementById('spotlightPause');
  var timer = null;
  var paused = false;

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

  syncTheme();
  restartRotation();
})();
