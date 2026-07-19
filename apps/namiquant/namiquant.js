(function () {
  var panel = document.getElementById('workspacePanel');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.workspace-tabs [role="tab"]'));
  if (!panel || !tabs.length) return;

  var views = {
    research: {
      title: 'Research queue',
      subtitle: 'Material changes waiting for human review',
      badge: 'SYNTHETIC · 04 ITEMS',
      columns: ['Workspace', 'Review state', 'Evidence', 'Next step'],
      rows: [
        ['MARKET_01', 'Research', '3 changed', 'Review'],
        ['MARKET_02', 'Watch', '1 changed', 'Monitor'],
        ['█████████', 'Hold', 'Redacted', 'Risk check'],
        ['MARKET_04', 'Archive', 'No change', 'Closed']
      ],
      summary: [['04', 'items in queue', 'synthetic workload'], ['02', 'open questions', 'human review'], ['OFF', 'execution', 'research only']]
    },
    risk: {
      title: 'Risk review',
      subtitle: 'Constraints and unresolved concerns before confirmation',
      badge: 'REDACTED · 03 REVIEWS',
      columns: ['Review', 'Boundary', 'Status', 'Owner'],
      rows: [
        ['CONCENTRATION', '████████', 'Open', 'Human'],
        ['THESIS RISK', 'Evidence age', 'Review', 'Human'],
        ['PORTFOLIO FIT', '████████', 'Blocked', 'Human']
      ],
      summary: [['03', 'reviews', 'before decision'], ['01', 'blocked item', 'boundary active'], ['100%', 'human-owned', 'no auto approval']]
    },
    journal: {
      title: 'Decision log',
      subtitle: 'Reviewable context without exposing the private decision edge',
      badge: 'PUBLIC STRUCTURE ONLY',
      columns: ['Decision ref', 'Context', 'Confidence', 'Follow-up'],
      rows: [
        ['NQ-2026-012', 'Thesis revised', '██████', 'Scheduled'],
        ['NQ-2026-011', 'No action', 'Moderate', '30 days'],
        ['NQ-2026-010', 'Research closed', '██████', 'Archived'],
        ['NQ-2026-009', 'Risk changed', 'Low', 'Reopened']
      ],
      summary: [['12', 'journal entries', 'synthetic history'], ['04', 'follow-ups', 'time bounded'], ['ON', 'evidence trail', 'context retained']]
    }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character];
    });
  }

  function render(viewName, focus) {
    var view = views[viewName];
    if (!view) return;
    tabs.forEach(function (tab) {
      var active = tab.dataset.view === viewName;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    var rows = view.rows.map(function (row) {
      return '<div class="public-row">' + row.map(function (cell, index) {
        var className = index === 1 ? ' class="state"' : index === 2 && /Open|Review|Blocked/.test(cell) ? ' class="risk"' : '';
        var content = cell.indexOf('█') >= 0 ? '<span class="redact" aria-label="Redacted value"></span>' : escapeHtml(cell);
        return '<span' + className + '>' + content + '</span>';
      }).join('') + '</div>';
    }).join('');
    var summary = view.summary.map(function (item) {
      return '<article><span>' + escapeHtml(item[1]) + '</span><b>' + escapeHtml(item[0]) + '</b><small>' + escapeHtml(item[2]) + '</small></article>';
    }).join('');
    panel.setAttribute('aria-labelledby', 'tab-' + viewName);
    panel.innerHTML = '<div class="panel-top"><div><h3>' + escapeHtml(view.title) + '</h3><p>' + escapeHtml(view.subtitle) + '</p></div><span class="panel-badge">' + escapeHtml(view.badge) + '</span></div>' +
      '<div class="public-table"><div class="public-row header">' + view.columns.map(function (column) { return '<span>' + escapeHtml(column) + '</span>'; }).join('') + '</div>' + rows + '</div>' +
      '<div class="panel-summary">' + summary + '</div>';
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { render(tab.dataset.view, false); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      var direction = event.key === 'ArrowRight' ? 1 : -1;
      var next = (index + direction + tabs.length) % tabs.length;
      render(tabs[next].dataset.view, true);
    });
  });

  render('research', false);
})();
