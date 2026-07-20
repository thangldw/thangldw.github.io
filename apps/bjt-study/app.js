(function () {
  'use strict';

  var STORAGE_KEY = 'bjt-study-progress-v1';
  var SESSION_LENGTH = 5;
  var appView = document.getElementById('appView');
  var loadingState = document.getElementById('loadingState');
  var toast = document.getElementById('toast');
  var datasets = { vocabulary: [], grammar: [] };
  var itemsById = new Map();
  var currentView = 'today';
  var currentSession = null;
  var selectedAnswer = -1;
  var answered = false;
  var libraryQuery = '';
  var libraryLimit = 40;
  var toastTimer = null;

  var progress = loadProgress();

  var MODULES = [
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: '社内の基本', title: 'Giao tiếp nội bộ', subtitle: 'Chào hỏi, vai trò và quy trình công sở' },
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: '電話応対', title: 'Điện thoại', subtitle: 'Tiếp nhận, chuyển máy và xác nhận' },
    { level: 'Giai đoạn 1', phase: 'Nền tảng', jp: 'メール', title: 'Email công việc', subtitle: 'Cấu trúc, kính ngữ và phản hồi' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '会議', title: 'Họp và thảo luận', subtitle: 'Ý kiến, đồng thuận và biên bản' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '報告・連絡・相談', title: 'Báo cáo và trao đổi', subtitle: 'Tiến độ, vấn đề và đề xuất' },
    { level: 'Giai đoạn 2', phase: 'Thực hành', jp: '顧客対応', title: 'Khách hàng', subtitle: 'Tiếp đón, khiếu nại và theo dõi' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '交渉', title: 'Đàm phán', subtitle: 'Điều kiện, thuyết phục và thỏa thuận' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '経営・契約', title: 'Quản trị và hợp đồng', subtitle: 'Chiến lược, pháp lý và tài chính' },
    { level: 'Giai đoạn 3', phase: 'Chuyên sâu', jp: '総合演習', title: 'Tổng hợp BJT', subtitle: 'Từ vựng và ngữ pháp trong ngữ cảnh' }
  ];

  var DAILY_STEPS = [
    { title: 'Giao tiếp nội bộ', jp: '社内コミュニケーション', note: '5 câu từ vựng công sở', kind: 'vocabulary' },
    { title: 'Ngữ pháp ứng dụng', jp: 'ビジネス文法', note: '5 mẫu dùng trong công việc', kind: 'grammar' },
    { title: 'Luyện tập tổng hợp', jp: '総合練習', note: '5 câu trộn từ hai kho', kind: 'mixed' }
  ];

  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        seen: saved.seen || {},
        correct: saved.correct || {},
        wrong: saved.wrong || {},
        completedSteps: saved.completedSteps || {}
      };
    } catch (error) {
      return { seen: {}, correct: {}, wrong: {}, completedSteps: {} };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    updateWrongCount();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  function dateKey() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function displayDate() {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededShuffle(list, seed) {
    var result = list.slice();
    var state = seed || 1;
    for (var i = result.length - 1; i > 0; i -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      var j = state % (i + 1);
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function normalizeTerms(terms, kind) {
    return terms
      .filter(function (entry) { return entry && entry.term && entry.definition; })
      .map(function (entry, index) {
        return {
          id: kind + ':' + index,
          kind: kind,
          index: index,
          term: String(entry.term).trim(),
          definition: String(entry.definition).replace(/\s+/g, ' ').trim(),
          module: index % MODULES.length
        };
      });
  }

  function shortDefinition(value, limit) {
    var clean = String(value)
      .replace(/【意味[^】]*】/g, '')
      .replace(/[✦Ⓜ■]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    var max = limit || 150;
    if (clean.length <= max) return clean;
    var sliced = clean.slice(0, max);
    var lastSpace = sliced.lastIndexOf(' ');
    return sliced.slice(0, lastSpace > max * .65 ? lastSpace : max).trim() + '…';
  }

  function makeQuestion(item, sessionSeed) {
    var pool = datasets[item.kind];
    var candidates = pool.filter(function (candidate) { return candidate.id !== item.id; });
    var distractors = seededShuffle(candidates, hashString(item.id + ':' + sessionSeed)).slice(0, 3);
    var options = seededShuffle([item].concat(distractors), hashString('options:' + item.id + ':' + sessionSeed));
    return {
      item: item,
      options: options,
      correctIndex: options.findIndex(function (option) { return option.id === item.id; })
    };
  }

  function dailyQueue(stepIndex) {
    var step = DAILY_STEPS[stepIndex];
    var daySeed = hashString(dateKey() + ':' + stepIndex);
    if (step.kind === 'mixed') {
      var vocab = seededShuffle(datasets.vocabulary, daySeed).slice(0, 3);
      var grammar = seededShuffle(datasets.grammar, daySeed + 7).slice(0, 2);
      return seededShuffle(vocab.concat(grammar), daySeed + 19);
    }
    return seededShuffle(datasets[step.kind], daySeed).slice(0, SESSION_LENGTH);
  }

  function createDailySession(stepIndex) {
    currentSession = {
      mode: 'daily',
      stepIndex: stepIndex,
      title: DAILY_STEPS[stepIndex].title,
      jp: DAILY_STEPS[stepIndex].jp,
      queue: dailyQueue(stepIndex),
      index: 0,
      score: 0,
      misses: 0,
      seed: hashString(dateKey() + ':daily:' + stepIndex)
    };
    selectedAnswer = -1;
    answered = false;
  }

  function createCustomSession(options) {
    currentSession = {
      mode: options.mode,
      stepIndex: -1,
      title: options.title,
      jp: options.jp,
      queue: options.queue,
      index: 0,
      score: 0,
      misses: 0,
      seed: hashString(options.mode + ':' + dateKey() + ':' + options.queue.map(function (item) { return item.id; }).join(','))
    };
    selectedAnswer = -1;
    answered = false;
  }

  function currentQuestion() {
    if (!currentSession || !currentSession.queue.length || currentSession.index >= currentSession.queue.length) return null;
    return makeQuestion(currentSession.queue[currentSession.index], currentSession.seed + currentSession.index);
  }

  function completedToday() {
    return progress.completedSteps[dateKey()] || [];
  }

  function sessionLabel() {
    if (currentSession.mode === 'exam') return 'BJT · Luyện đề trộn';
    if (currentSession.mode === 'review') return 'BJT · Ôn lại lỗi sai';
    if (currentSession.mode === 'module') return 'BJT · Lộ trình gợi ý';
    if (currentSession.mode === 'single') return 'BJT · Luyện nhanh';
    return 'BJT Business Japanese Proficiency Test';
  }

  function renderPractice() {
    if (!currentSession) createDailySession(0);
    var question = currentQuestion();
    if (!question) {
      renderSessionComplete();
      return;
    }

    var item = question.item;
    var completed = completedToday();
    var percent = Math.round((currentSession.index / currentSession.queue.length) * 100);
    var optionHtml = question.options.map(function (option, index) {
      var classes = ['answer-option'];
      if (selectedAnswer === index) classes.push('is-selected');
      if (answered && index === question.correctIndex) classes.push('is-correct');
      if (answered && index === selectedAnswer && index !== question.correctIndex) classes.push('is-wrong');
      return '<button class="' + classes.join(' ') + '" type="button" data-answer="' + index + '"' + (answered ? ' disabled' : '') + '>' +
        '<span class="answer-key">' + String.fromCharCode(65 + index) + '</span>' +
        '<span class="answer-text">' + escapeHtml(shortDefinition(option.definition, item.kind === 'grammar' ? 125 : 105)) + '</span>' +
      '</button>';
    }).join('');

    var feedbackHtml = '';
    if (answered) {
      var correct = selectedAnswer === question.correctIndex;
      feedbackHtml = '<div class="feedback' + (correct ? '' : ' is-wrong') + '">' +
        '<strong>' + (correct ? 'Chính xác' : 'Chưa đúng') + '</strong>' +
        '<p>' + escapeHtml(item.definition) + '</p>' +
      '</div>';
    }

    var stepRail = DAILY_STEPS.map(function (step, index) {
      var isActive = currentSession.mode === 'daily' && currentSession.stepIndex === index;
      var isComplete = completed.indexOf(index) !== -1;
      return '<button type="button" class="session-step' + (isActive ? ' is-active' : '') + (isComplete ? ' is-complete' : '') + '" data-action="daily-step" data-step="' + index + '">' +
        '<span class="step-num">' + (index + 1) + '</span>' +
        '<span class="step-copy"><strong>' + escapeHtml(step.title) + '</strong><small>' + escapeHtml(step.note) + '</small></span>' +
      '</button>';
    }).join('');

    var actionLabel = answered
      ? (currentSession.index === currentSession.queue.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo')
      : 'Kiểm tra đáp án';

    appView.innerHTML = '<div class="view-shell">' +
      '<section class="main-column">' +
        '<div class="date-line"><span>' + escapeHtml(sessionLabel()) + '</span><time datetime="' + dateKey() + '">' + displayDate() + '</time></div>' +
        '<h1 class="view-title">' + escapeHtml(currentSession.title) + ' <span class="jp-title">· ' + escapeHtml(currentSession.jp) + '</span></h1>' +
        '<div class="lesson-progress"><strong>Bài ' + (currentSession.index + 1) + ' <span>/ ' + currentSession.queue.length + '</span></strong><span>' + currentSession.score + ' đúng · ' + currentSession.misses + ' cần ôn</span><span class="progress-track"><span class="progress-fill" style="width:' + percent + '%"></span></span></div>' +
        '<p class="scenario">Chọn lời giải thích phù hợp nhất. Sau khi trả lời, app sẽ lưu lại tiến độ và đưa những mục chưa đúng vào phần Ôn sai.</p>' +
        '<button class="listen-button" type="button" data-action="speak"><i class="fa-solid fa-play" aria-hidden="true"></i><span>Nghe tiếng Nhật</span></button>' +
        '<div class="question-block">' +
          '<span class="question-type">' + escapeHtml(item.kind === 'grammar' ? 'Mẫu ngữ pháp' : 'Thuật ngữ BJT') + '</span>' +
          '<h2 class="question-term" lang="ja">' + escapeHtml(item.term) + '</h2>' +
          '<p class="question-hint">' + escapeHtml(item.kind === 'grammar' ? 'Mẫu này diễn đạt ý nghĩa nào?' : 'Thuật ngữ này có nghĩa gần nhất là gì?') + '</p>' +
        '</div>' +
        '<div class="answer-list">' + optionHtml + '</div>' +
        feedbackHtml +
        '<button class="primary-action" type="button" data-action="primary"' + (!answered && selectedAnswer < 0 ? ' disabled' : '') + '><span>' + actionLabel + '</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
      '</section>' +
      '<aside class="session-rail" aria-label="Tiến trình buổi học">' +
        '<h2>Hôm nay: ' + (completed.length) + '/3</h2>' +
        '<p>Ba bước ngắn, khoảng 20 phút</p>' +
        '<div class="session-steps">' + stepRail + '</div>' +
        '<div class="rail-note">Dữ liệu học gồm ' + formatNumber(datasets.grammar.length) + ' mẫu ngữ pháp và ' + formatNumber(datasets.vocabulary.length) + ' thuật ngữ. Tiến độ chỉ được lưu trên thiết bị này.</div>' +
      '</aside>' +
    '</div>';
  }

  function renderSessionComplete() {
    var total = currentSession.queue.length;
    var score = currentSession.score;
    var mode = currentSession.mode;
    if (mode === 'daily') {
      var completed = completedToday();
      if (completed.indexOf(currentSession.stepIndex) === -1) completed.push(currentSession.stepIndex);
      progress.completedSteps[dateKey()] = completed;
      saveProgress();
    }

    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">HOÀN THÀNH BUỔI HỌC</span>' +
      '<h1 class="view-title">Kết quả <span class="jp-title">· 学習結果</span></h1>' +
      '<p class="view-subtitle">Bạn đã hoàn thành ' + total + ' câu trong phần ' + escapeHtml(currentSession.title) + '.</p>' +
      '<div class="summary-grid">' +
        '<div class="summary-item"><strong>' + score + '</strong><span>câu đúng</span></div>' +
        '<div class="summary-item"><strong>' + currentSession.misses + '</strong><span>mục cần ôn</span></div>' +
        '<div class="summary-item"><strong>' + Math.round((score / Math.max(total, 1)) * 100) + '%</strong><span>độ chính xác</span></div>' +
      '</div>' +
      '<button class="primary-action" type="button" data-action="finish-session"><span>' + (mode === 'daily' ? 'Về buổi học hôm nay' : 'Luyện thêm một lượt') + '</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
    '</section>';
  }

  function renderPath() {
    var groups = [0, 1, 2].map(function (groupIndex) {
      var groupModules = MODULES.slice(groupIndex * 3, groupIndex * 3 + 3);
      var groupSeen = groupModules.reduce(function (sum, module, offset) {
        var moduleIndex = groupIndex * 3 + offset;
        return sum + Object.keys(progress.seen).filter(function (id) {
          var item = itemsById.get(id);
          return item && item.module === moduleIndex;
        }).length;
      }, 0);
      var groupTotal = datasets.vocabulary.concat(datasets.grammar).filter(function (item) {
        return item.module >= groupIndex * 3 && item.module < groupIndex * 3 + 3;
      }).length;
      var moduleHtml = groupModules.map(function (module, offset) {
        var moduleIndex = groupIndex * 3 + offset;
        return '<article class="module"><span class="module-index">' + (moduleIndex + 1) + '</span><h3 lang="ja">' + escapeHtml(module.jp) + '</h3><p>' + escapeHtml(module.title) + '<br>' + escapeHtml(module.subtitle) + '</p><button type="button" data-action="module" data-module="' + moduleIndex + '">Bắt đầu 10 câu</button></article>';
      }).join('');
      return '<section class="path-group"><div class="path-level"><strong>0' + (groupIndex + 1) + '</strong><span>' + escapeHtml(groupModules[0].phase) + '</span><small>' + groupSeen + ' / ' + groupTotal + ' mục đã học</small></div><div class="module-list">' + moduleHtml + '</div></section>';
    }).join('');

    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">LỘ TRÌNH GỢI Ý</span>' +
      '<div class="section-head"><div><h1 class="view-title">Lộ trình BJT <span class="jp-title">· ビジネス日本語</span></h1><p class="view-subtitle">Đi từ ngôn ngữ công sở nền tảng tới các tình huống quản trị, đàm phán và tổng hợp.</p></div><span class="stat-inline">' + Object.keys(progress.seen).length + ' mục đã học</span></div>' +
      groups +
      '<p class="rail-note">Lộ trình này là cách sắp xếp học tập gợi ý từ hai bộ dữ liệu đã cung cấp, không phải phân loại cấp độ chính thức của kỳ thi BJT.</p>' +
    '</section>';
  }

  function renderLibrary(kind, query) {
    currentView = kind;
    libraryQuery = query == null ? libraryQuery : query;
    var source = datasets[kind];
    var normalized = libraryQuery.trim().toLocaleLowerCase('vi');
    var filtered = normalized ? source.filter(function (item) {
      return (item.term + ' ' + item.definition).toLocaleLowerCase('vi').indexOf(normalized) !== -1;
    }) : source;
    var visible = filtered.slice(0, libraryLimit);
    var rows = visible.map(function (item) {
      return '<article class="library-row"><strong class="library-term" lang="ja">' + escapeHtml(item.term) + '</strong><span class="library-definition">' + escapeHtml(item.definition) + '</span><button class="row-practice" type="button" data-action="single" data-id="' + item.id + '">Luyện mục này</button></article>';
    }).join('');
    var title = kind === 'grammar' ? 'Ngữ pháp · 文法' : 'Từ vựng · 語彙';
    var eyebrow = kind === 'grammar' ? '84 MẪU DÙNG TRONG NGỮ CẢNH' : '1.565 THUẬT NGỮ BUSINESS JAPANESE';

    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">' + eyebrow + '</span>' +
      '<div class="section-head"><div><h1 class="view-title">' + title + '</h1><p class="view-subtitle">Tra cứu nhanh hoặc chọn một mục để bắt đầu luyện ngay.</p></div><span class="stat-inline">' + formatNumber(filtered.length) + ' kết quả</span></div>' +
      '<div class="search-row"><input class="search-input" id="librarySearch" type="search" value="' + escapeHtml(libraryQuery) + '" placeholder="Tìm tiếng Nhật, cách đọc hoặc nghĩa tiếng Việt…" aria-label="Tìm trong kho học"><button class="secondary-action" type="button" data-action="clear-search">Xóa tìm kiếm</button></div>' +
      (rows ? '<div class="library-list">' + rows + '</div>' : '<p class="empty-state">Không tìm thấy mục phù hợp.</p>') +
      (visible.length < filtered.length ? '<button class="primary-action" type="button" data-action="load-more"><span>Xem thêm ' + Math.min(40, filtered.length - visible.length) + ' mục</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' : '') +
    '</section>';
    var input = document.getElementById('librarySearch');
    if (input && libraryQuery) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function renderExamIntro() {
    var totalSeen = Object.keys(progress.seen).length;
    var totalCorrect = Object.keys(progress.correct).length;
    var accuracy = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0;
    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">LUYỆN ĐỀ TRỘN</span>' +
      '<h1 class="view-title">Mô phỏng nhanh <span class="jp-title">· 総合練習</span></h1>' +
      '<p class="view-subtitle">20 câu được lấy từ cả kho từ vựng và ngữ pháp. Mỗi lượt tạo một bộ khác nhau.</p>' +
      '<div class="summary-grid"><div class="summary-item"><strong>20</strong><span>câu mỗi lượt</span></div><div class="summary-item"><strong>' + accuracy + '%</strong><span>độ chính xác đã ghi nhận</span></div><div class="summary-item"><strong>' + Object.keys(progress.wrong).length + '</strong><span>mục đang cần ôn</span></div></div>' +
      '<div class="exam-intro"><h2>Chuẩn bị trước khi bắt đầu</h2><p>Không giới hạn thời gian. Đáp án và giải thích xuất hiện ngay sau mỗi câu để ưu tiên việc học, không mô phỏng cấu trúc đề thi BJT chính thức.</p></div>' +
      '<button class="primary-action" type="button" data-action="start-exam"><span>Bắt đầu 20 câu</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' +
    '</section>';
  }

  function renderReview() {
    var wrongItems = Object.keys(progress.wrong).map(function (id) { return itemsById.get(id); }).filter(Boolean);
    var rows = wrongItems.map(function (item) {
      return '<article class="library-row"><strong class="library-term" lang="ja">' + escapeHtml(item.term) + '</strong><span class="library-definition">' + escapeHtml(item.definition) + '</span><button class="row-practice" type="button" data-action="single" data-id="' + item.id + '">Ôn mục này</button></article>';
    }).join('');
    appView.innerHTML = '<section class="main-column">' +
      '<span class="context-label">GHI NHỚ CHỦ ĐỘNG</span>' +
      '<div class="section-head"><div><h1 class="view-title">Ôn sai <span class="jp-title">· 復習</span></h1><p class="view-subtitle">Mỗi câu chưa đúng sẽ ở đây cho tới khi bạn trả lời đúng trong một lượt ôn.</p></div><span class="stat-inline">' + wrongItems.length + ' mục</span></div>' +
      (rows ? '<div class="library-list">' + rows + '</div><button class="primary-action" type="button" data-action="start-review"><span>Ôn tất cả lỗi sai</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>' : '<div class="empty-state"><strong>Chưa có lỗi sai cần ôn.</strong><p>Hãy bắt đầu buổi học hôm nay hoặc làm một lượt luyện đề.</p></div>') +
    '</section>';
  }

  function renderCurrentView() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (currentView === 'today') {
      if (!currentSession || currentSession.mode !== 'daily') createDailySession(0);
      renderPractice();
    } else if (currentView === 'path') {
      renderPath();
    } else if (currentView === 'vocabulary' || currentView === 'grammar') {
      renderLibrary(currentView, libraryQuery);
    } else if (currentView === 'exam') {
      renderExamIntro();
    } else if (currentView === 'review') {
      renderReview();
    }
    updateNav();
  }

  function updateNav() {
    document.querySelectorAll('.nav-item').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-view') === currentView);
    });
  }

  function updateWrongCount() {
    var count = Object.keys(progress.wrong).length;
    var badge = document.getElementById('wrongNavCount');
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('[data-theme-choice]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-theme-choice') === theme);
    });
  }

  function speakCurrent() {
    var question = currentQuestion();
    if (!question || !('speechSynthesis' in window)) {
      showToast('Trình duyệt này chưa hỗ trợ đọc tiếng Nhật.');
      return;
    }
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(question.item.term);
    utterance.lang = 'ja-JP';
    utterance.rate = .84;
    var voices = window.speechSynthesis.getVoices();
    var japanese = voices.find(function (voice) { return /^ja[-_]/i.test(voice.lang); });
    if (japanese) utterance.voice = japanese;
    window.speechSynthesis.speak(utterance);
  }

  function checkAnswer() {
    var question = currentQuestion();
    if (!question || selectedAnswer < 0) return;
    answered = true;
    var correct = selectedAnswer === question.correctIndex;
    var id = question.item.id;
    progress.seen[id] = (progress.seen[id] || 0) + 1;
    if (correct) {
      currentSession.score += 1;
      progress.correct[id] = (progress.correct[id] || 0) + 1;
      if (currentSession.mode === 'review' || progress.wrong[id]) delete progress.wrong[id];
    } else {
      currentSession.misses += 1;
      progress.wrong[id] = (progress.wrong[id] || 0) + 1;
    }
    saveProgress();
    renderPractice();
  }

  function advanceQuestion() {
    currentSession.index += 1;
    selectedAnswer = -1;
    answered = false;
    renderPractice();
  }

  document.querySelectorAll('.nav-item').forEach(function (button) {
    button.addEventListener('click', function () {
      currentView = button.getAttribute('data-view');
      libraryQuery = '';
      libraryLimit = 40;
      if (currentView !== 'today') currentSession = null;
      renderCurrentView();
      document.getElementById('primaryNav').classList.remove('is-open');
      document.getElementById('mobileNavToggle').setAttribute('aria-expanded', 'false');
    });
  });

  document.getElementById('mobileNavToggle').addEventListener('click', function () {
    var nav = document.getElementById('primaryNav');
    var open = nav.classList.toggle('is-open');
    this.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('[data-theme-choice]').forEach(function (button) {
    button.addEventListener('click', function () { setTheme(button.getAttribute('data-theme-choice')); });
  });

  appView.addEventListener('input', function (event) {
    if (event.target.id !== 'librarySearch') return;
    libraryLimit = 40;
    renderLibrary(currentView, event.target.value);
  });

  appView.addEventListener('click', function (event) {
    var answerButton = event.target.closest('[data-answer]');
    if (answerButton && !answered) {
      selectedAnswer = Number(answerButton.getAttribute('data-answer'));
      renderPractice();
      return;
    }

    var actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    var action = actionButton.getAttribute('data-action');

    if (action === 'primary') {
      if (answered) advanceQuestion(); else checkAnswer();
    } else if (action === 'speak') {
      speakCurrent();
    } else if (action === 'daily-step') {
      currentView = 'today';
      createDailySession(Number(actionButton.getAttribute('data-step')));
      renderPractice();
      updateNav();
    } else if (action === 'single') {
      var item = itemsById.get(actionButton.getAttribute('data-id'));
      if (item) {
        createCustomSession({ mode: 'single', title: 'Luyện nhanh', jp: item.kind === 'grammar' ? '文法' : '語彙', queue: [item] });
        renderPractice();
      }
    } else if (action === 'load-more') {
      libraryLimit += 40;
      renderLibrary(currentView, libraryQuery);
    } else if (action === 'clear-search') {
      libraryQuery = '';
      libraryLimit = 40;
      renderLibrary(currentView, '');
    } else if (action === 'module') {
      var moduleIndex = Number(actionButton.getAttribute('data-module'));
      var moduleItems = datasets.vocabulary.concat(datasets.grammar).filter(function (item) { return item.module === moduleIndex; });
      var queue = seededShuffle(moduleItems, hashString(dateKey() + ':module:' + moduleIndex)).slice(0, 10);
      createCustomSession({ mode: 'module', title: MODULES[moduleIndex].title, jp: MODULES[moduleIndex].jp, queue: queue });
      renderPractice();
    } else if (action === 'start-exam') {
      var vocab = seededShuffle(datasets.vocabulary, Date.now() >>> 0).slice(0, 15);
      var grammar = seededShuffle(datasets.grammar, (Date.now() + 91) >>> 0).slice(0, 5);
      createCustomSession({ mode: 'exam', title: 'Mô phỏng nhanh', jp: '総合練習', queue: seededShuffle(vocab.concat(grammar), Date.now() >>> 0) });
      renderPractice();
    } else if (action === 'start-review') {
      var reviewItems = Object.keys(progress.wrong).map(function (id) { return itemsById.get(id); }).filter(Boolean);
      createCustomSession({ mode: 'review', title: 'Ôn lại lỗi sai', jp: '復習', queue: seededShuffle(reviewItems, hashString(dateKey() + ':review')) });
      renderPractice();
    } else if (action === 'finish-session') {
      if (currentSession.mode === 'daily') {
        currentView = 'today';
        createDailySession(Math.min(currentSession.stepIndex + 1, 2));
      } else if (currentSession.mode === 'review') {
        currentView = 'review';
        currentSession = null;
      } else {
        currentView = 'exam';
        currentSession = null;
      }
      renderCurrentView();
    }
  });

  Promise.all([
    fetch('data/vocabulary.json').then(function (response) {
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ vựng');
      return response.json();
    }),
    fetch('data/grammar.json').then(function (response) {
      if (!response.ok) throw new Error('Không thể tải dữ liệu ngữ pháp');
      return response.json();
    })
  ]).then(function (results) {
    datasets.vocabulary = normalizeTerms(results[0].terms || [], 'vocabulary');
    datasets.grammar = normalizeTerms(results[1].terms || [], 'grammar');
    datasets.vocabulary.concat(datasets.grammar).forEach(function (item) { itemsById.set(item.id, item); });
    document.getElementById('vocabTotal').textContent = formatNumber(datasets.vocabulary.length);
    document.getElementById('grammarTotal').textContent = formatNumber(datasets.grammar.length);
    loadingState.hidden = true;
    appView.hidden = false;
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    updateWrongCount();
    createDailySession(0);
    renderCurrentView();
  }).catch(function (error) {
    loadingState.innerHTML = '<p><strong>Không thể mở kho học.</strong><br>' + escapeHtml(error.message) + '. Hãy tải lại trang.</p>';
  });
})();
