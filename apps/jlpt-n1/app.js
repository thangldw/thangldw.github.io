(function () {
  'use strict';

  var STORAGE_KEY = 'jlpt-n1-hub-v1';
  var appView = document.getElementById('appView');
  var mobileMenu = document.getElementById('mobileMenu');
  var sidebarBody = document.getElementById('sidebarBody');

  var MODULES = {
    vocabulary: {
      title: 'Từ vựng N1',
      jp: '語彙',
      eyebrow: 'JLPT N1 · Từ vựng · 語彙',
      description: 'Nắm vững từ vựng N1 theo hệ thống: nghĩa, cách dùng, Hán tự, collocations và dạng đề.',
      tabs: [
        { id: 'knowledge', label: 'Học kiến thức' },
        { id: 'practice', label: 'Luyện theo dạng' },
        { id: 'exams', label: 'Đề thi thật' }
      ],
      groups: {
        knowledge: [
          { id: 'vocab-tabs', title: 'Kho từ vựng', description: 'Tham khảo và ôn nhanh toàn bộ từ vựng N1.', href: '/apps/n1-vocabulary-tabs/', icon: 'fa-book-open' },
          { id: 'kanji-analysis', title: 'Phân tích Kanji', description: 'Âm đọc, Hán Việt, nghĩa, cách dùng và bẫy thường gặp.', href: '/apps/n1-kanji-analysis/', icon: 'fa-language' },
          { id: 'kanji-collocations', title: 'Kanji & cụm từ', description: 'Collocations, cụm cố định và mẫu câu thường gặp.', href: '/apps/n1-kanji-collocations/', icon: 'fa-puzzle-piece' }
        ],
        practice: [
          { id: 'vocab-context', title: '問題2 · Văn cảnh', description: 'Chọn từ phù hợp nhất với ngữ cảnh của câu.', href: '/apps/n1-vocabulary-context/', icon: 'fa-file-lines' },
          { id: 'vocab-paraphrase', title: '問題3 · Đồng nghĩa', description: 'Chọn cách diễn đạt có nghĩa gần nhất.', href: '/apps/n1-vocabulary-paraphrase/', icon: 'fa-arrows-rotate' }
        ],
        exams: [
          { id: 'vocab-exams', title: 'Đề từ vựng 2010–2025', description: 'Luyện toàn bộ 問題1〜4 theo năm thi.', href: '/apps/n1-vocabulary-exams/', icon: 'fa-graduation-cap' }
        ]
      }
    },
    grammar: {
      title: 'Ngữ pháp N1',
      jp: '文法',
      eyebrow: 'JLPT N1 · Ngữ pháp · 文法',
      description: 'Ghi nhớ mẫu câu, hiểu sắc thái và luyện đúng các dạng ngữ pháp trong đề N1.',
      tabs: [
        { id: 'knowledge', label: 'Học kiến thức' },
        { id: 'practice', label: 'Luyện theo dạng' },
        { id: 'exams', label: 'Đề thi thật' }
      ],
      groups: {
        knowledge: [
          { id: 'grammar-flashcards', title: 'Grammar Flashcards', description: 'Ôn nhanh mẫu câu và ý nghĩa bằng thẻ lật.', href: '/apps/n1-grammar-flashcards/', icon: 'fa-clone' }
        ],
        practice: [
          { id: 'sentence-order', title: 'Sắp xếp câu · 文の文法②', description: '420 câu với thứ tự đúng và hướng dẫn tiếng Việt.', href: '/apps/n1-grammar-sentence-order/', icon: 'fa-arrow-down-a-z' },
          { id: 'sentence-order-drill', title: 'Sentence Ordering Drill', description: '140 câu 問題6 với bộ lọc đề thi và mẫu ngữ pháp.', href: '/apps/n1-grammar-sentence-order-drill/', icon: 'fa-list-ol' }
        ],
        exams: [
          { id: 'grammar-exams', title: 'Đề ngữ pháp 2010–2024', description: 'Câu hỏi ngữ pháp đề thật, có đáp án và giải thích.', href: '/apps/n1-grammar-exams/', icon: 'fa-graduation-cap' }
        ]
      }
    },
    reading: {
      title: 'Đọc hiểu N1',
      jp: '読解',
      eyebrow: 'JLPT N1 · Đọc hiểu · 読解',
      description: 'Luyện đọc có phương pháp, nhận ra từ khóa và xử lý từng dạng bài N1.',
      tabs: [
        { id: 'knowledge', label: 'Luyện theo bài đọc' },
        { id: 'exams', label: 'Luyện theo dạng đề' }
      ],
      groups: {
        knowledge: [
          { id: 'reading-75', title: 'Reading · 75 bài đọc', description: 'Khóa đọc hiểu theo phương pháp anchor word.', href: '/apps/n1-reading-75/', icon: 'fa-book-open-reader' }
        ],
        exams: [
          { id: 'reading-mondai9', title: '問題9 · Đọc đoạn trung', description: 'Luyện 問題9 bằng kỹ thuật B1→B4 và đọc ngược.', href: '/apps/n1-reading-mondai9/', icon: 'fa-newspaper' }
        ]
      }
    }
  };

  var progress = loadProgress();
  var state = parseHash();

  updateWrongCount();

  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        visited: saved.visited || {},
        lastModule: saved.lastModule || 'kanji-analysis'
      };
    } catch (error) {
      return { visited: {}, lastModule: 'kanji-analysis' };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function updateWrongCount() {
    var count = 0;
    try {
      var saved = JSON.parse(localStorage.getItem('jlpt_wrong') || '[]');
      count = Array.isArray(saved) ? saved.length : 0;
    } catch (error) {
      count = 0;
    }
    document.getElementById('wrongCount').textContent = count ? String(count) : '';
  }

  function allModules(section) {
    return Object.keys(section.groups).reduce(function (items, groupId) {
      return items.concat(section.groups[groupId]);
    }, []);
  }

  function programModules() {
    return Object.keys(MODULES).reduce(function (items, key) {
      return items.concat(allModules(MODULES[key]));
    }, []);
  }

  function sectionProgress(section) {
    var items = allModules(section);
    var done = items.filter(function (item) { return Boolean(progress.visited[item.id]); }).length;
    return { done: done, total: items.length, percent: items.length ? Math.round(done / items.length * 100) : 0 };
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    var view = parts[0] || 'vocabulary';
    var tab = parts[1] || 'knowledge';
    if (!MODULES[view] && ['path', 'exams', 'review', 'stats'].indexOf(view) === -1) view = 'vocabulary';
    if (MODULES[view] && !MODULES[view].groups[tab]) tab = MODULES[view].tabs[0].id;
    return { view: view, tab: tab };
  }

  function setHash(view, tab) {
    var next = '#' + view + (tab ? '/' + tab : '');
    if (location.hash === next) {
      state = parseHash();
      render();
    } else {
      location.hash = next;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function icon(name) {
    return '<i class="fa-solid ' + escapeHtml(name) + '" aria-hidden="true"></i>';
  }

  function findModule(id) {
    return programModules().find(function (item) { return item.id === id; });
  }

  function currentModule(section) {
    var items = allModules(section);
    return items.find(function (item) { return item.id === progress.lastModule; }) ||
      items.find(function (item) { return !progress.visited[item.id]; }) || items[0];
  }

  function headerTemplate(section, current) {
    var count = sectionProgress(section);
    return '<header class="view-header">' +
      '<div><p class="eyebrow">' + escapeHtml(section.eyebrow) + '</p>' +
      '<h1 class="view-title">' + escapeHtml(section.title) + '</h1>' +
      '<p class="view-lead">' + escapeHtml(section.description) + '</p></div>' +
      '<div class="progress-panel"><div class="progress-copy"><span>Tiến độ module</span><strong>' + count.percent + '%</strong></div>' +
      '<div class="progress-track" aria-label="Đã mở ' + count.done + ' trên ' + count.total + ' module"><span class="progress-fill" style="width:' + count.percent + '%"></span></div>' +
      '<div class="progress-detail">' + count.done + ' / ' + count.total + ' module đã mở</div>' +
      '<a class="primary-action module-link" data-module="' + escapeHtml(current.id) + '" href="' + escapeHtml(current.href) + '"><span>' + icon('fa-play') + ' Tiếp tục: ' + escapeHtml(current.title) + '</span>' + icon('fa-arrow-right') + '</a></div>' +
      '</header>';
  }

  function renderSection(view) {
    var section = MODULES[view];
    var current = currentModule(section);
    var items = section.groups[state.tab];
    var tabs = section.tabs.map(function (tab) {
      return '<button class="view-tab' + (tab.id === state.tab ? ' is-active' : '') + '" type="button" data-tab="' + tab.id + '">' + escapeHtml(tab.label) + '</button>';
    }).join('');
    var rows = items.map(function (item, index) {
      var complete = Boolean(progress.visited[item.id]);
      var isCurrent = item.id === current.id;
      return '<a class="module-row module-link' + (isCurrent ? ' is-current' : '') + '" data-module="' + escapeHtml(item.id) + '" href="' + escapeHtml(item.href) + '">' +
        '<span class="module-index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="module-icon">' + icon(item.icon) + '</span>' +
        '<span class="module-copy"><h2>' + escapeHtml(item.title) + '</h2><p>' + escapeHtml(item.description) + '</p></span>' +
        (isCurrent ? '<span class="row-action">Học tiếp ' + icon('fa-arrow-right') + '</span>' : '<span class="module-state' + (complete ? ' is-complete' : '') + '"><strong>' + (complete ? 'Đã mở' : 'Chưa bắt đầu') + '</strong>' + (complete ? 'Sẵn sàng ôn lại' : 'Mở module để bắt đầu') + '</span>') +
        '<span class="row-arrow">' + icon('fa-arrow-right') + '</span></a>';
    }).join('');

    var support = '';
    if (view === 'vocabulary' && state.tab === 'knowledge') {
      support = '<section class="support-section"><div class="support-head"><h2>Luyện theo dạng</h2><button type="button" data-jump-tab="practice">Xem tất cả →</button></div>' +
        '<div class="support-grid">' + section.groups.practice.map(supportLink).join('') + '</div></section>' +
        '<a class="exam-row module-link" data-module="vocab-exams" href="/apps/n1-vocabulary-exams/">' + icon('fa-file-lines') + '<span><strong>Đề từ vựng 2010–2025</strong><small>Luyện đề từ vựng theo năm thi.</small></span>' + icon('fa-arrow-right') + '</a>';
    }

    appView.innerHTML = '<section class="view">' + headerTemplate(section, current) + '<div class="view-tabs" role="tablist">' + tabs + '</div><div class="module-list">' + rows + '</div>' + support + '</section>';
  }

  function supportLink(item) {
    return '<a class="support-link module-link" data-module="' + escapeHtml(item.id) + '" href="' + escapeHtml(item.href) + '">' + icon(item.icon) + '<span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.description) + '</small></span>' + icon('fa-arrow-right') + '</a>';
  }

  function renderPath() {
    var total = programModules().length;
    var done = programModules().filter(function (item) { return progress.visited[item.id]; }).length;
    var rows = Object.keys(MODULES).map(function (key, index) {
      var section = MODULES[key];
      var count = sectionProgress(section);
      var names = allModules(section).map(function (item) { return item.title; }).join(' · ');
      return '<button class="track-row" type="button" data-view-target="' + key + '"><span class="track-num">0' + (index + 1) + '</span><span class="track-title"><strong>' + escapeHtml(section.title) + '</strong><small>' + allModules(section).length + ' module</small></span><span class="track-modules">' + escapeHtml(names) + '</span><span class="track-progress"><strong>' + count.percent + '%</strong><span>' + count.done + '/' + count.total + ' đã mở</span></span></button>';
    }).join('');
    appView.innerHTML = '<section class="view"><header class="view-header"><div><p class="eyebrow">JLPT N1 · Lộ trình · 学習プラン</p><h1 class="view-title">Chương trình JLPT N1</h1><p class="view-lead">Mười hai công cụ hiện tại được tổ chức thành ba trụ cột để bạn luôn biết mình đang học gì và nên đi tiếp ở đâu.</p></div><div class="progress-panel"><div class="progress-copy"><span>Tiến độ chương trình</span><strong>' + Math.round(done / total * 100) + '%</strong></div><div class="progress-track"><span class="progress-fill" style="width:' + Math.round(done / total * 100) + '%"></span></div><div class="progress-detail">' + done + ' / ' + total + ' module đã mở</div><button class="primary-action" type="button" data-view-target="vocabulary"><span>' + icon('fa-play') + ' Tiếp tục lộ trình</span>' + icon('fa-arrow-right') + '</button></div></header><div class="overview-list">' + rows + '</div></section>';
  }

  function renderSimple(view) {
    var content = {
      exams: { eyebrow: 'JLPT N1 · Luyện đề · 模擬試験', title: 'Luyện đề N1', lead: 'Đi thẳng vào các bộ câu hỏi đã được sắp theo năm thi và dạng bài.', actions: [
        ['Đề từ vựng 2010–2025', '/apps/n1-vocabulary-exams/'], ['Đề ngữ pháp 2010–2024', '/apps/n1-grammar-exams/'], ['Đọc hiểu 問題9', '/apps/n1-reading-mondai9/']
      ] },
      review: { eyebrow: 'JLPT N1 · Ôn sai · 復習', title: 'Ôn lại điểm yếu', lead: 'Mỗi công cụ vẫn giữ lịch sử và câu sai riêng. Mở lại phần đã luyện để tiếp tục ôn theo dữ liệu hiện có.', actions: [
        ['Ôn từ vựng', '#vocabulary/practice'], ['Ôn ngữ pháp', '/apps/n1-grammar-exams/'], ['Ôn đọc hiểu', '/apps/n1-reading-75/']
      ] },
      stats: { eyebrow: 'JLPT N1 · Thống kê · 学習記録', title: 'Tiến độ học tập', lead: 'Hub ghi nhận những module bạn đã mở; điểm số chi tiết tiếp tục được lưu tại từng công cụ luyện tập.', actions: [
        ['Xem lộ trình', '#path'], ['Tiếp tục từ vựng', '#vocabulary/knowledge']
      ] }
    }[view];
    var actions = content.actions.map(function (action) {
      return '<a href="' + action[1] + '">' + escapeHtml(action[0]) + '&nbsp; →</a>';
    }).join('');
    appView.innerHTML = '<section class="view"><header class="view-header"><div><p class="eyebrow">' + content.eyebrow + '</p><h1 class="view-title">' + content.title + '</h1><p class="view-lead">' + content.lead + '</p></div></header><div class="empty-view"><h2>Một chương trình, nhiều cách luyện</h2><p>Chọn nội dung phù hợp với mục tiêu hiện tại của bạn.</p><div class="empty-actions">' + actions + '</div></div></section>';
  }

  function render() {
    document.querySelectorAll('.nav-item').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.view === state.view);
    });
    if (MODULES[state.view]) renderSection(state.view);
    else if (state.view === 'path') renderPath();
    else renderSimple(state.view);
    bindViewEvents();
    updateThemeButtons();
  }

  function bindViewEvents() {
    appView.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setHash(state.view, button.dataset.tab); });
    });
    appView.querySelectorAll('[data-jump-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setHash(state.view, button.dataset.jumpTab); });
    });
    appView.querySelectorAll('[data-view-target]').forEach(function (button) {
      button.addEventListener('click', function () { setHash(button.dataset.viewTarget); });
    });
    appView.querySelectorAll('.module-link').forEach(function (link) {
      link.addEventListener('click', function () {
        progress.visited[link.dataset.module] = true;
        progress.lastModule = link.dataset.module;
        saveProgress();
      });
    });
  }

  function updateThemeButtons() {
    var active = document.documentElement.dataset.theme;
    document.querySelectorAll('[data-theme-choice]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.themeChoice === active);
    });
  }

  document.querySelectorAll('.nav-item').forEach(function (button) {
    button.addEventListener('click', function () {
      setHash(button.dataset.view);
      sidebarBody.classList.remove('is-open');
      mobileMenu.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('[data-theme-choice]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.documentElement.dataset.theme = button.dataset.themeChoice;
      localStorage.setItem('theme', button.dataset.themeChoice);
      updateThemeButtons();
    });
  });

  mobileMenu.addEventListener('click', function () {
    var open = sidebarBody.classList.toggle('is-open');
    mobileMenu.setAttribute('aria-expanded', String(open));
  });

  window.addEventListener('hashchange', function () {
    state = parseHash();
    render();
  });

  render();
}());
