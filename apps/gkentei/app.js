(function (window, document) {
  'use strict';

  var COURSE_ID = 'gkentei-syllabus-v14';
  var COURSE_TITLE = 'G検定 Study Program';
  var CATEGORY_ORDER = [
    '01_ai_fundamentals',
    '02_ai_history_search',
    '03_machine_learning',
    '04_deep_learning_basics',
    '05_deep_learning_methods',
    '06_ai_applications',
    '07_genai_foundation_models',
    '08_math_statistics',
    '09_social_implementation',
    '10_law_contracts',
    '11_ethics_governance_security'
  ];
  var CATEGORY_ICONS = [
    'fa-wand-magic-sparkles',
    'fa-arrows-rotate',
    'fa-chart-line',
    'fa-book-open',
    'fa-layer-group',
    'fa-graduation-cap',
    'fa-wand-magic-sparkles',
    'fa-chart-area',
    'fa-database',
    'fa-file-lines',
    'fa-shield-halved'
  ];
  var CATEGORY_GUIDES = {
    '01_ai_fundamentals': {
      title: '人工知能とは',
      remember: ['人工知能の4つのレベルとAI効果を区別する', 'AIとロボットの違いを具体例で説明する', '人工知能分野で議論される代表的な問題を整理する'],
      keywords: ['人工知能', 'AI効果', 'エージェント', 'シンギュラリティ', 'チューリングテスト', '中国語の部屋', 'フレーム問題', '強いAIと弱いAI']
    },
    '02_ai_history_search': {
      title: '人工知能をめぐる動向',
      remember: ['探索木と幅優先・深さ優先探索の違いを押さえる', '知識表現とエキスパートシステムの役割を理解する', '機械学習・ディープラーニング発展の背景を時系列で整理する'],
      keywords: ['探索木', '幅優先探索', '深さ優先探索', 'Mini-Max法', '意味ネットワーク', 'オントロジー', 'DENDRAL', 'MYCIN']
    },
    '03_machine_learning': {
      title: '機械学習の概要',
      remember: ['教師あり・教師なし・強化学習の目的とデータの違いを区別する', '回帰・分類・クラスタリングの代表手法を選べるようにする', '検証方法と評価指標をタスクに応じて使い分ける'],
      keywords: ['線形回帰', 'ロジスティック回帰', 'SVM', 'ランダムフォレスト', 'k-means法', 'PCA', 'Q学習', '交差検証', '混同行列']
    },
    '04_deep_learning_basics': {
      title: 'ディープラーニングの概要',
      remember: ['ニューラルネットワークの層構造と計算資源の役割を理解する', '活性化関数・誤差関数・正則化を目的別に整理する', '誤差逆伝播法と最適化手法の流れを説明できるようにする'],
      keywords: ['多層パーセプトロン', 'ReLU関数', 'ソフトマックス関数', '交差エントロピー', 'L1正則化', 'ドロップアウト', '誤差逆伝播法', 'Adam']
    },
    '05_deep_learning_methods': {
      title: 'ディープラーニングの要素技術',
      remember: ['全結合・畳み込み・正規化・プーリング層の役割を比較する', 'RNNとAttentionが系列データを扱う仕組みを理解する', 'オートエンコーダとデータ拡張の用途を整理する'],
      keywords: ['CNN', 'バッチ正規化', 'GAP', 'ResNet', 'LSTM', 'Transformer', 'Self-Attention', 'VAE', 'Mixup']
    },
    '06_ai_applications': {
      title: 'ディープラーニングの応用例',
      remember: ['画像認識・自然言語処理・音声処理の代表タスクを区別する', '深層強化学習とデータ生成モデルの用途を理解する', '転移学習・マルチモーダル・解釈性・軽量化を整理する'],
      keywords: ['YOLO', 'BERT', 'MFCC', 'DQN', 'Diffusion Model', '転移学習', 'CLIP', 'SHAP', '量子化']
    },
    '07_genai_foundation_models': {
      title: '生成AI・大規模言語モデル・基盤モデル',
      remember: ['TransformerとAttentionが文脈を扱う仕組みを理解する', '事前学習・ファインチューニング・RLHFの関係を整理する', '生成AIの限界と安全な利用時の確認事項を押さえる'],
      keywords: ['生成AI', '大規模言語モデル（LLM）', '基盤モデル', 'Transformer', 'Multi-Head Attention', 'RLHF', 'Few-shot', 'Zero-shot', 'マルチモーダル']
    },
    '08_math_statistics': {
      title: 'AIに必要な数理・統計知識',
      remember: ['確率分布・期待値・分散・標準偏差の意味を理解する', '条件付き確率・最尤法・仮説検定の基本を整理する', '距離・類似度・相関と因果を混同しない'],
      keywords: ['期待値', '分散', '標準偏差', '正規分布', '条件付き確率', '最尤法', '帰無仮説', '相互情報量', 'コサイン類似度']
    },
    '09_social_implementation': {
      title: 'AIの社会実装に向けて',
      remember: ['PoCから運用までのAIプロジェクト全体像を理解する', 'MLOpsでデータ・モデル・監視を継続管理する', 'データ収集・加工時のリーケージや品質問題を防ぐ'],
      keywords: ['CRISP-DM', 'PoC', 'MLOps', 'Docker', 'Web API', 'モニタリング', 'アノテーション', 'データリーケージ']
    },
    '10_law_contracts': {
      title: 'AIに関する法律と契約',
      remember: ['個人情報・著作権・特許・営業秘密の適用場面を区別する', 'AI開発の各フェーズに適した契約関係を理解する', 'データ利用権・知的財産の帰属・精度保証を確認する'],
      keywords: ['個人情報', '要配慮個人情報', '著作権', '特許権', '営業秘密', '限定提供データ', 'NDA', '準委任契約', 'SaaS']
    },
    '11_ethics_governance_security': {
      title: 'AI倫理・AIガバナンス',
      remember: ['公平性・プライバシー・安全性のリスクを具体例で判断する', '透明性・説明可能性と人間の関与が必要な理由を理解する', '組織として監査・モニタリング・トレーサビリティを設計する'],
      keywords: ['AI倫理', 'AIガバナンス', 'リスクベースアプローチ', 'プライバシー・バイ・デザイン', 'アルゴリズムバイアス', 'Adversarial Attack', '説明可能性', '人間の関与', 'トレーサビリティ']
    }
  };
  var DEFAULT_STATE = {
    view: 'path',
    completedIds: [],
    wrongIds: []
  };

  var appView = document.getElementById('appView');
  var loadingState = document.getElementById('loadingState');
  var sidebarBody = document.getElementById('sidebarBody');
  var mobileMenu = document.getElementById('mobileMenu');
  var questions = [];
  var categories = [];
  var state = Object.assign({}, DEFAULT_STATE);
  var quizSize = 10;
  var practiceCategory = 'all';
  var practiceDifficulty = 'all';
  var topicCategory = 'all';
  var topicDifficulty = 'all';
  var topicQuery = '';
  var quizSession = null;
  var quizTimer = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function icon(name) {
    return '<i class="fa-solid ' + name + '" aria-hidden="true"></i>';
  }

  function shuffle(items) {
    var output = items.slice();
    for (var index = output.length - 1; index > 0; index -= 1) {
      var target = Math.floor(Math.random() * (index + 1));
      var value = output[index];
      output[index] = output[target];
      output[target] = value;
    }
    return output;
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function categoryFor(code) {
    return categories.find(function (category) { return category.code === code; });
  }

  function buildCategories() {
    categories = CATEGORY_ORDER.map(function (code, index) {
      var members = questions.filter(function (question) { return question.categoryCode === code; });
      var guide = CATEGORY_GUIDES[code];
      return {
        code: code,
        ja: guide ? guide.title : (members[0] ? members[0].categoryJa : code),
        remember: guide ? guide.remember : [],
        keywords: guide ? guide.keywords : [],
        icon: CATEGORY_ICONS[index],
        questions: members
      };
    });
  }

  function updateThemeControl() {
    var button = document.getElementById('themeToggle');
    var dark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-label', dark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え');
    button.setAttribute('title', dark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え');
    button.innerHTML = icon(dark ? 'fa-sun' : 'fa-moon');
  }

  function setMenu(open) {
    sidebarBody.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }

  function saveState() {
    if (window.LearningHistory) window.LearningHistory.saveCourseState(COURSE_ID, state).catch(function () {});
  }

  function updateNavigation() {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.view === state.view);
    });
    document.getElementById('wrongCount').textContent = state.wrongIds.length || '';
  }

  function navigate(view) {
    closeQuiz('abandoned');
    if (view === 'practice' && [5, 10, 20].indexOf(quizSize) === -1) quizSize = 10;
    state.view = view;
    saveState();
    setMenu(false);
    render();
    document.getElementById('main').focus({ preventScroll: true });
  }

  function headerHtml(eyebrow, title, lead, aside, simple) {
    return '<header class="gk-view-header' + (simple ? ' is-simple' : '') + '">' +
      '<div><p class="gk-eyebrow">' + eyebrow + '</p><h1 class="gk-view-title">' + title + '</h1><p class="gk-view-lead">' + lead + '</p></div>' +
      (aside || '') + '</header>';
  }

  function completedSet() {
    return new Set(state.completedIds);
  }

  function renderPath() {
    var completed = completedSet();
    var progress = Math.round(completed.size / questions.length * 100);
    var progressPanel = '<div class="gk-progress-panel"><span>全体の進捗</span><strong>' + progress + '%</strong>' +
      '<progress class="gk-progress" max="' + questions.length + '" value="' + completed.size + '">進捗 ' + progress + '%</progress>' +
      '<small>' + completed.size + ' / ' + questions.length + ' 問学習済み</small>' +
      '<button class="gk-primary-action" type="button" data-action="open-practice"><span>' + icon('fa-play') + ' 問題演習を始める</span>' + icon('fa-arrow-right') + '</button></div>';

    var rows = categories.map(function (category, index) {
      var done = category.questions.filter(function (question) { return completed.has(question.id); }).length;
      var categoryProgress = Math.round(done / category.questions.length * 100);
      return '<button class="gk-module-row' + (done ? ' is-started' : '') + '" type="button" data-category="' + category.code + '">' +
        '<span class="gk-module-index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="gk-module-icon">' + icon(category.icon) + '</span>' +
        '<span class="gk-module-copy"><strong lang="ja">' + escapeHtml(category.ja) + '</strong><small>シラバス2024 v1.4</small></span>' +
        '<span class="gk-module-state"><strong>' + (done ? categoryProgress + '%' : '未学習') + '</strong><small>' + done + ' / ' + category.questions.length + ' 問</small></span>' +
        icon('fa-arrow-right') + '</button>';
    }).join('');

    appView.innerHTML = '<section class="gk-view">' +
      headerHtml('G検定 · シラバス2024 · 学習ロードマップ', 'G検定ロードマップ', 'シラバスv1.4の495キーワードを、人工知能の基礎から法律・ガバナンスまで体系的に学習します。', progressPanel, false) +
      '<section class="gk-summary-strip" aria-label="問題集の概要"><div><strong>900</strong><span>監査済み問題</span></div><div><strong>495</strong><span>シラバスキーワード</span></div><div><strong>55</strong><span>学習項目</span></div><div><strong>11</strong><span>重点分野</span></div></section>' +
      '<div class="gk-section-heading"><div><span>11の重点分野</span><h2>シラバス順に学ぶ</h2></div><p>苦手な分野から始めるか、上から順に学習してください。</p></div>' +
      '<section class="gk-module-list">' + rows + '</section></section>';
  }

  function categoryOptions(selected, includeAll) {
    var options = includeAll ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>全11分野</option>' : '';
    return options + categories.map(function (category) {
      return '<option value="' + category.code + '"' + (selected === category.code ? ' selected' : '') + '>' + escapeHtml(category.ja) + ' (' + category.questions.length + ')</option>';
    }).join('');
  }

  function difficultyOptions(selected) {
    return '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>すべての難易度</option>' +
      '<option value="easy"' + (selected === 'easy' ? ' selected' : '') + '>基礎</option>' +
      '<option value="medium"' + (selected === 'medium' ? ' selected' : '') + '>標準</option>' +
      '<option value="hard"' + (selected === 'hard' ? ' selected' : '') + '>応用</option>';
  }

  function difficultyLabel(value) {
    return value === 'easy' ? '基礎' : (value === 'medium' ? '標準' : '応用');
  }

  function filteredQuestions(category, difficulty) {
    return questions.filter(function (question) {
      return (category === 'all' || question.categoryCode === category) &&
        (difficulty === 'all' || question.difficulty === difficulty);
    });
  }

  function renderPracticeSetup(examMode) {
    var lengths = examMode ? [145] : [5, 10, 20];
    if (examMode) quizSize = 145;
    var available = examMode ? questions.length : filteredQuestions(practiceCategory, practiceDifficulty).length;
    var sizes = lengths.map(function (size) {
      return '<button class="gk-quiz-size' + (quizSize === size ? ' is-active' : '') + '" type="button" data-quiz-size="' + size + '" aria-pressed="' + (quizSize === size) + '"><strong>' + size + '</strong><span>問</span></button>';
    }).join('');
    var filters = examMode ? '' : '<span class="gk-field-label gk-filter-label">' + icon('fa-table-cells-large') + ' 出題範囲</span>' +
      '<div class="gk-filter-row"><label><span>分野</span><select data-practice-filter="category">' + categoryOptions(practiceCategory, true) + '</select></label>' +
      '<label><span>難易度</span><select data-practice-filter="difficulty">' + difficultyOptions(practiceDifficulty) + '</select></label></div>';
    var eyebrow = examMode ? 'G検定 · 模擬試験 · 145問' : 'G検定 · 問題演習 · 練習';
    var title = examMode ? '本番形式の模擬試験' : '記憶定着トレーニング';
    var lead = examMode ? '全11分野から145問を出題し、120分で本番同様の演習を行います。' : '分野と難易度を選択してください。1問30秒で、回答後にベトナム語の解説を表示します。';

    appView.innerHTML = '<section class="gk-view">' + headerHtml(eyebrow, title, lead, '', true) +
      '<div class="gk-setup-grid"><div><span class="gk-field-label">1回の問題数</span><div class="gk-quiz-sizes" role="group" aria-label="問題数を選択">' + sizes + '</div>' + filters +
      '<button class="gk-primary-action gk-start-action" type="button" data-action="start-quiz"' + (available ? '' : ' disabled') + '><span>' + icon('fa-play') + ' ' + Math.min(quizSize, available) + '問を始める</span>' + icon('fa-arrow-right') + '</button><p class="gk-availability">現在の条件に該当する問題は' + available + '問です。</p></div>' +
      '<aside class="gk-setup-rules"><div>' + icon('fa-graduation-cap') + '<p><strong>' + (examMode ? '120分' : '30秒') + '</strong><span>' + (examMode ? '試験全体' : '1問あたり') + '</span></p></div>' +
      '<div>' + icon('fa-table-cells-large') + '<p><strong>' + (examMode ? '11分野' : '分野を選択') + '</strong><span>シラバスv1.4準拠</span></p></div>' +
      '<div>' + icon('fa-book-open') + '<p><strong>ベトナム語解説</strong><span>回答後に表示</span></p></div></aside></div></section>';
  }

  function normalizeStudyText(value) {
    return String(value || '').toLowerCase().replace(/[\s・（）()]/g, '');
  }

  function exampleRelevance(category, question) {
    var text = normalizeStudyText([question.question, question.topic, question.syllabusSection, question.syllabusKeywords.join(' ')].join(' '));
    var score = text.indexOf(normalizeStudyText(category.ja)) !== -1 ? 5 : 0;
    category.keywords.forEach(function (keyword) {
      if (text.indexOf(normalizeStudyText(keyword)) !== -1) score += 1;
    });
    return score;
  }

  function topicQuestions(category) {
    var query = topicQuery.trim().toLowerCase();
    return category.questions.filter(function (question) {
      var haystack = [question.question, question.topic, question.syllabusSection, question.syllabusKeywords.join(' ')].join(' ').toLowerCase();
      return (topicDifficulty === 'all' || question.difficulty === topicDifficulty) && (!query || haystack.indexOf(query) !== -1);
    }).sort(function (first, second) { return exampleRelevance(category, second) - exampleRelevance(category, first); });
  }

  function topicGuideMatches(category) {
    if (topicCategory !== 'all' && category.code !== topicCategory) return false;
    if (topicDifficulty !== 'all' && !category.questions.some(function (question) { return question.difficulty === topicDifficulty; })) return false;
    var query = topicQuery.trim().toLowerCase();
    if (!query) return true;
    var guideText = [category.ja, category.remember.join(' '), category.keywords.join(' ')].join(' ').toLowerCase();
    return guideText.indexOf(query) !== -1 || category.questions.some(function (question) {
      return [question.question, question.topic, question.syllabusSection, question.syllabusKeywords.join(' ')].join(' ').toLowerCase().indexOf(query) !== -1;
    });
  }

  function exampleQuestionHtml(question) {
    return '<article class="gk-example-question"><div><span>' + difficultyLabel(question.difficulty) + '</span><span lang="ja">' + escapeHtml(question.syllabusKeywords.slice(0, 2).join(' · ')) + '</span></div>' +
      '<strong lang="ja">' + escapeHtml(question.question) + '</strong><button type="button" data-example-id="' + escapeHtml(question.id) + '">この例題を解く ' + icon('fa-arrow-right') + '</button></article>';
  }

  function topicGuideHtml(category, index) {
    var candidates = topicQuestions(category);
    if (!candidates.length && topicQuery) candidates = category.questions.filter(function (question) { return topicDifficulty === 'all' || question.difficulty === topicDifficulty; });
    var exampleLimit = topicCategory === 'all' ? 2 : 4;
    var examples = candidates.slice(0, exampleLimit).map(exampleQuestionHtml).join('');
    var remembered = category.remember.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    var keywords = category.keywords.map(function (keyword) { return '<span lang="ja">' + escapeHtml(keyword) + '</span>'; }).join('');
    return '<article class="gk-topic-guide"><header><span class="gk-topic-number">' + String(index + 1).padStart(2, '0') + '</span><span class="gk-topic-icon">' + icon(category.icon) + '</span><div><h2 lang="ja">' + escapeHtml(category.ja) + '</h2><p>' + category.questions.length + '問 · シラバス2024 v1.4</p></div></header>' +
      '<div class="gk-topic-guide-grid"><section><span class="gk-topic-label">この分野で覚えること</span><ul>' + remembered + '</ul></section><section><span class="gk-topic-label">重要キーワード</span><div class="gk-topic-keywords">' + keywords + '</div></section></div>' +
      '<section class="gk-topic-examples"><div class="gk-topic-examples-head"><span class="gk-topic-label">例題</span><small>' + candidates.length + '問から抜粋</small></div>' + (examples || '<p class="gk-no-example">現在の条件に該当する例題はありません。</p>') + '</section></article>';
  }

  function renderTopics() {
    var visibleCategories = categories.filter(topicGuideMatches);
    var availableQuestions = visibleCategories.reduce(function (sum, category) {
      return sum + category.questions.filter(function (question) { return topicDifficulty === 'all' || question.difficulty === topicDifficulty; }).length;
    }, 0);
    var guides = visibleCategories.map(function (category) { return topicGuideHtml(category, CATEGORY_ORDER.indexOf(category.code)); }).join('');
    appView.innerHTML = '<section class="gk-view">' + headerHtml('G検定 · シラバス2024 · 出題分野', '出題分野と覚えるポイント', '各分野の学習目標、重要キーワード、例題を確認してから問題演習に進みます。', '', true) +
      '<section class="gk-bank-toolbar"><label class="gk-search-field"><span class="gk-visually-hidden">キーワードを検索</span>' + icon('fa-magnifying-glass') + '<input data-topic-filter="query" value="' + escapeHtml(topicQuery) + '" placeholder="キーワード・学習内容を検索…"></label>' +
      '<label class="gk-visually-hidden" for="topicCategory">出題分野</label><select id="topicCategory" data-topic-filter="category" lang="ja">' + categoryOptions(topicCategory, true) + '</select>' +
      '<label class="gk-visually-hidden" for="topicDifficulty">難易度</label><select id="topicDifficulty" data-topic-filter="difficulty" lang="ja">' + difficultyOptions(topicDifficulty) + '</select></section>' +
      '<div class="gk-bank-heading"><strong>' + visibleCategories.length + '分野 · ' + availableQuestions + '問</strong><button class="gk-primary-action" type="button" data-action="practice-topic"' + (availableQuestions ? '' : ' disabled') + '>' + icon('fa-play') + ' この条件で演習する</button></div>' +
      '<section class="gk-topic-guide-list" aria-label="出題分野と学習ポイント">' + (guides || '<div class="gk-empty-state"><h2>該当する分野がありません</h2><p>検索語またはフィルターを変更してください。</p></div>') + '</section></section>';
  }

  function closeQuiz(status) {
    if (quizTimer) window.clearInterval(quizTimer);
    quizTimer = null;
    if (quizSession && quizSession.history && quizSession.history.status === 'active' && window.LearningHistory) {
      window.LearningHistory.finishSession(quizSession.history, {
        status: status || 'abandoned',
        answeredCount: quizSession.answers.length,
        correctCount: quizSession.score,
        wrongCount: quizSession.answers.length - quizSession.score
      }).catch(function () {});
    }
    quizSession = null;
  }

  function startQuiz(pool, size, examMode) {
    var selectedQuestions = shuffle(pool).slice(0, Math.min(size, pool.length));
    quizSession = {
      questions: selectedQuestions,
      index: 0,
      score: 0,
      selected: null,
      locked: false,
      timedOut: false,
      examMode: Boolean(examMode),
      returnView: state.view,
      seconds: examMode ? 120 * 60 : 30,
      answers: [],
      questionStartedAt: Date.now(),
      history: window.LearningHistory ? window.LearningHistory.startSession({
        courseId: COURSE_ID,
        courseTitle: COURSE_TITLE,
        mode: examMode ? 'mock-exam' : 'practice',
        contentType: practiceCategory === 'all' ? 'mixed' : practiceCategory,
        title: examMode ? '模擬試験 145問' : '問題演習 ' + selectedQuestions.length + '問',
        requestedCount: selectedQuestions.length,
        timeLimitSeconds: examMode ? 120 * 60 : 30
      }) : null
    };
    renderQuizQuestion();
  }

  function formatTimer(seconds) {
    if (!quizSession || !quizSession.examMode) return seconds + 's';
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  function startTimer() {
    if (quizTimer) window.clearInterval(quizTimer);
    quizTimer = window.setInterval(function () {
      if (!quizSession || quizSession.locked) return;
      quizSession.seconds -= 1;
      var timer = document.getElementById('quizTimer');
      if (timer) timer.textContent = formatTimer(quizSession.seconds);
      if (quizSession.seconds <= 0) {
        if (quizSession.examMode) renderQuizResult();
        else submitQuizAnswer(null, true);
      }
    }, 1000);
  }

  function feedbackBody(question) {
    var answer = question.answer;
    var prefix = 'Đáp án đúng là ' + answer + ' — ' + question.options[answer] + '.';
    return question.explanationVi.indexOf(prefix) === 0 ? question.explanationVi.slice(prefix.length).trim() : question.explanationVi;
  }

  function renderQuizQuestion() {
    var question = quizSession.questions[quizSession.index];
    var answered = quizSession.locked;
    var options = Object.keys(question.options).map(function (letter) {
      var status = '';
      var stateIcon = '';
      if (answered && letter === question.answer) {
        status = ' is-correct';
        stateIcon = '<span class="gk-answer-state" aria-label="正解">✓</span>';
      } else if (answered && letter === quizSession.selected) {
        status = ' is-wrong';
        stateIcon = '<span class="gk-answer-state" aria-label="選択した不正解">×</span>';
      }
      return '<button class="gk-answer' + status + '" type="button" data-answer="' + letter + '"' + (answered ? ' disabled' : '') + '><span>' + letter + '</span><strong lang="ja">' + escapeHtml(question.options[letter]) + '</strong>' + stateIcon + '</button>';
    }).join('');
    var feedback = '';
    if (answered) {
      var correct = quizSession.selected === question.answer;
      feedback = '<div class="gk-feedback' + (correct ? '' : ' is-wrong') + '"><strong>' + (correct ? '正解です' : (quizSession.timedOut ? '時間切れです' : '不正解です')) + '</strong>' +
        '<p><b>正解：' + question.answer + '</b> — <span lang="ja">' + escapeHtml(question.options[question.answer]) + '</span></p>' +
        '<div class="gk-bilingual-explanation"><section><span>解説（日本語）</span><p lang="ja">' + escapeHtml(question.explanationJa) + '</p></section><section><span>Giải thích (Tiếng Việt)</span><p lang="vi">' + escapeHtml(feedbackBody(question)) + '</p></section></div>' +
        '<div class="gk-keywords">' + question.syllabusKeywords.slice(0, 5).map(function (keyword) { return '<span lang="ja">' + escapeHtml(keyword) + '</span>'; }).join('') + '</div></div>';
    }
    var total = quizSession.questions.length;
    var progress = quizSession.index + (answered ? 1 : 0);

    appView.innerHTML = '<section class="gk-view"><div class="gk-quiz-topline"><button class="gk-quit-quiz" type="button" data-action="quit-quiz">← 演習を終了</button>' +
      '<div><span>第' + (quizSession.index + 1) + '問 / ' + total + '</span><strong>正解 ' + quizSession.score + ' / ' + total + '</strong></div><time id="quizTimer">' + formatTimer(quizSession.seconds) + '</time></div>' +
      '<progress class="gk-quiz-progress" max="' + total + '" value="' + progress + '">全' + total + '問中' + (quizSession.index + 1) + '問目</progress>' +
      '<div class="gk-quiz-card"><div class="gk-question-meta"><span>最も適切なものを選んでください</span><div class="gk-question-tags"><span>' + difficultyLabel(question.difficulty) + '</span><span>' + escapeHtml(categoryFor(question.categoryCode).ja) + '</span></div></div>' +
      '<h1 class="gk-question-title" lang="ja">' + escapeHtml(question.question) + '</h1><div class="gk-answer-list">' + options + '</div>' + feedback +
      (answered ? '<button class="gk-primary-action gk-next-action" type="button" data-action="next-question"><span>' + (quizSession.index + 1 === total ? '結果を見る' : '次の問題') + '</span>' + icon('fa-arrow-right') + '</button>' : '') + '</div></section>';
    bindViewEvents();
    if (!answered) startTimer();
  }

  function submitQuizAnswer(letter, timedOut) {
    if (!quizSession || quizSession.locked) return;
    var question = quizSession.questions[quizSession.index];
    var correct = letter === question.answer;
    quizSession.selected = letter;
    quizSession.timedOut = Boolean(timedOut);
    quizSession.locked = true;
    if (quizTimer && !quizSession.examMode) window.clearInterval(quizTimer);
    if (correct) quizSession.score += 1;
    quizSession.answers.push({ id: question.id, correct: correct, selected: letter });

    var wrong = new Set(state.wrongIds);
    if (correct) wrong.delete(question.id); else wrong.add(question.id);
    state.wrongIds = Array.from(wrong);
    state.completedIds = unique(state.completedIds.concat(question.id));
    saveState();

    if (quizSession.history && window.LearningHistory) {
      window.LearningHistory.recordAnswer(quizSession.history, {
        itemId: question.id,
        contentType: question.categoryCode,
        prompt: question.question,
        selectedAnswer: timedOut ? '時間切れ' : letter + ' — ' + question.options[letter],
        correctAnswer: question.answer + ' — ' + question.options[question.answer],
        isCorrect: correct,
        timedOut: Boolean(timedOut),
        responseTimeSeconds: Math.max(0, Math.round((Date.now() - quizSession.questionStartedAt) / 1000))
      }).catch(function () {});
    }
    updateNavigation();
    renderQuizQuestion();
  }

  function nextQuestion() {
    if (quizSession.index + 1 >= quizSession.questions.length) {
      renderQuizResult();
      return;
    }
    quizSession.index += 1;
    quizSession.selected = null;
    quizSession.locked = false;
    quizSession.timedOut = false;
    quizSession.questionStartedAt = Date.now();
    if (!quizSession.examMode) quizSession.seconds = 30;
    renderQuizQuestion();
  }

  function renderQuizResult() {
    if (!quizSession) return;
    if (quizTimer) window.clearInterval(quizTimer);
    quizTimer = null;
    var result = {
      score: quizSession.score,
      total: quizSession.questions.length,
      answered: quizSession.answers.length,
      examMode: quizSession.examMode
    };
    if (quizSession.history && window.LearningHistory) {
      window.LearningHistory.finishSession(quizSession.history, {
        status: 'completed',
        answeredCount: result.answered,
        correctCount: result.score,
        wrongCount: result.answered - result.score
      }).catch(function () {});
    }
    quizSession = null;
    var percent = result.total ? Math.round(result.score / result.total * 100) : 0;
    var title = percent >= 80 ? 'よくできました！' : (percent >= 60 ? '着実に伸びています' : 'もう一度復習しましょう');
    appView.innerHTML = '<section class="gk-result"><div class="gk-result-icon">' + icon('fa-graduation-cap') + '</div><p class="gk-eyebrow">演習完了</p><h1>' + title + '</h1><p><strong>' + result.score + ' / ' + result.total + '</strong>問正解しました。</p>' +
      '<div class="gk-result-score"><strong>' + percent + '%</strong><span>正答率</span></div><div class="gk-result-actions"><button class="gk-primary-action" type="button" data-action="restart-setup">' + icon('fa-arrows-rotate') + ' 新しい演習</button><button class="gk-secondary-action" type="button" data-action="go-path">ロードマップへ</button></div></section>';
    bindViewEvents();
  }

  function renderReview() {
    var wrong = questions.filter(function (question) { return state.wrongIds.indexOf(question.id) !== -1; });
    var content = wrong.length ? '<section class="gk-empty-state">' + icon('fa-arrows-rotate') + '<h2>復習が必要な問題：' + wrong.length + '問</h2><p>間違えた問題を優先すると、短時間でも効率よく弱点を補強できます。</p><button class="gk-primary-action" type="button" data-action="start-review">' + icon('fa-play') + ' 間違い問題を復習 ' + icon('fa-arrow-right') + '</button></section>' :
      '<section class="gk-empty-state">' + icon('fa-graduation-cap') + '<h2>間違い問題はありません</h2><p>問題演習を完了すると、間違えた問題がここに表示されます。</p></section>';
    appView.innerHTML = '<section class="gk-view">' + headerHtml('G検定 · 間違い復習', '間違えた問題を復習', '間違えた問題はこの端末に保存され、正解すると復習リストから自動的に外れます。', '', true) + content + '</section>';
  }

  function renderStats() {
    if (!window.LearningHistory) {
      appView.innerHTML = '<section class="gk-load-error"><strong>学習記録を開けません。</strong><p>履歴モジュールを読み込めませんでした。</p></section>';
      return;
    }
    appView.innerHTML = '<div class="lh-loading" role="status">学習記録を読み込んでいます…</div>';
    window.LearningHistory.getCourseSummary(COURSE_ID).then(function (summary) {
      var recent = summary.sessions.slice(0, 8).map(function (session) {
        var accuracy = session.answeredCount ? Math.round(session.correctCount / session.answeredCount * 100) : 0;
        var date = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(session.startedAt));
        var title = session.mode === 'mock-exam' ? '模擬試験 145問' : '問題演習 ' + session.requestedCount + '問';
        return '<article class="gk-history-row"><div><strong>' + title + '</strong><span>' + date + '</span></div><div><strong>' + session.correctCount + ' / ' + session.answeredCount + '</strong><span>正答率 ' + accuracy + '%</span></div></article>';
      }).join('');
      appView.innerHTML = '<section class="lh-dashboard"><header class="lh-header"><div><p class="lh-eyebrow">G検定 · 学習記録</p><h1>学習の進捗</h1><p>演習履歴と回答結果は、この端末内にのみ保存されます。</p></div><div class="lh-data-status"><span>端末内保存</span><strong>IndexedDB</strong><small>サーバーには送信されません</small></div></header>' +
        '<div class="lh-metrics"><div><strong>' + summary.sessions.length + '</strong><span>完了した演習</span></div><div><strong>' + summary.correctAnswers + ' / ' + summary.totalAnswers + '</strong><span>正解数</span></div><div><strong>' + summary.accuracy + '%</strong><span>総合正答率</span></div><div><strong>' + summary.totalMinutes + '</strong><span>学習時間（分）</span></div><div><strong>' + summary.streak + '</strong><span>連続学習日数</span></div><div><strong>' + summary.masteredItems + '</strong><span>習熟度80%以上</span></div></div>' +
        '<section class="lh-panel"><div class="lh-panel-head"><div><span>最近の学習</span><h2>演習履歴</h2></div><strong>' + summary.activeDays + '日学習</strong></div><div class="gk-history-list">' + (recent || '<div class="lh-empty"><strong>学習履歴はまだありません。</strong><p>問題演習を完了すると、ここに記録されます。</p></div>') + '</div></section>' +
        '<section class="lh-data-tools"><div><strong>学習履歴のバックアップ</strong><p>JSONファイルに書き出すと、端末変更後も履歴を復元できます。</p></div><div class="lh-tool-actions"><button type="button" data-gk-history="export">データを書き出す</button><button type="button" data-gk-history="import">データを読み込む</button><input type="file" accept="application/json,.json" data-gk-history-file hidden></div><p class="lh-message" data-gk-history-message aria-live="polite"></p></section></section>';
      var message = appView.querySelector('[data-gk-history-message]');
      var fileInput = appView.querySelector('[data-gk-history-file]');
      appView.querySelector('[data-gk-history="export"]').addEventListener('click', function () {
        window.LearningHistory.exportData().then(function () { message.textContent = '学習履歴を書き出しました。'; }).catch(function () { message.textContent = '書き出しに失敗しました。'; });
      });
      appView.querySelector('[data-gk-history="import"]').addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (!fileInput.files[0]) return;
        window.LearningHistory.importData(fileInput.files[0]).then(renderStats).catch(function () { message.textContent = '読み込みに失敗しました。'; });
      });
    }).catch(function () {
      appView.innerHTML = '<section class="gk-load-error"><strong>学習記録を開けません。</strong><p>しばらくしてからもう一度お試しください。</p></section>';
    });
  }

  function render() {
    updateNavigation();
    if (state.view === 'path') renderPath();
    else if (state.view === 'topics') renderTopics();
    else if (state.view === 'exam') renderPracticeSetup(true);
    else if (state.view === 'practice') renderPracticeSetup(false);
    else if (state.view === 'review') renderReview();
    else if (state.view === 'stats') renderStats();
    else renderPath();
    if (state.view !== 'stats') bindViewEvents();
  }

  function bindViewEvents() {
    appView.querySelectorAll('[data-category]').forEach(function (button) {
      button.addEventListener('click', function () {
        topicCategory = button.dataset.category;
        state.view = 'topics';
        saveState();
        render();
      });
    });
    appView.querySelectorAll('[data-quiz-size]').forEach(function (button) {
      button.addEventListener('click', function () {
        quizSize = Number(button.dataset.quizSize);
        renderPracticeSetup(state.view === 'exam');
        bindViewEvents();
      });
    });
    appView.querySelectorAll('[data-practice-filter]').forEach(function (select) {
      select.addEventListener('change', function () {
        if (select.dataset.practiceFilter === 'category') practiceCategory = select.value;
        else practiceDifficulty = select.value;
        renderPracticeSetup(false);
        bindViewEvents();
      });
    });
    appView.querySelectorAll('[data-topic-filter]').forEach(function (control) {
      var eventName = control.dataset.topicFilter === 'query' ? 'input' : 'change';
      control.addEventListener(eventName, function () {
        if (control.dataset.topicFilter === 'query') topicQuery = control.value;
        else if (control.dataset.topicFilter === 'category') topicCategory = control.value;
        else topicDifficulty = control.value;
        renderTopics();
        bindViewEvents();
        if (eventName === 'input') {
          var input = appView.querySelector('[data-topic-filter="query"]');
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });
    });
    appView.querySelectorAll('[data-answer]').forEach(function (button) {
      button.addEventListener('click', function () { submitQuizAnswer(button.dataset.answer, false); });
    });
    appView.querySelectorAll('[data-example-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        var example = questions.find(function (question) { return question.id === button.dataset.exampleId; });
        if (example) startQuiz([example], 1, false);
      });
    });
    appView.querySelectorAll('[data-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.dataset.action;
        if (action === 'open-practice') navigate('practice');
        else if (action === 'start-quiz') {
          var examMode = state.view === 'exam';
          var pool = examMode ? questions : filteredQuestions(practiceCategory, practiceDifficulty);
          startQuiz(pool, quizSize, examMode);
        } else if (action === 'practice-topic') {
          practiceCategory = topicCategory;
          practiceDifficulty = topicDifficulty;
          navigate('practice');
        } else if (action === 'quit-quiz') {
          var returnView = quizSession && quizSession.returnView;
          closeQuiz('abandoned');
          if (returnView === 'topics') renderTopics();
          else renderPracticeSetup(state.view === 'exam');
          bindViewEvents();
        } else if (action === 'next-question') nextQuestion();
        else if (action === 'restart-setup') navigate('practice');
        else if (action === 'go-path') navigate('path');
        else if (action === 'start-review') {
          var wrong = questions.filter(function (question) { return state.wrongIds.indexOf(question.id) !== -1; });
          startQuiz(wrong, Math.min(20, wrong.length), false);
        }
      });
    });
  }

  document.querySelectorAll('[data-view]').forEach(function (button) {
    button.addEventListener('click', function () { navigate(button.dataset.view); });
  });

  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateThemeControl();
  });

  mobileMenu.addEventListener('click', function () {
    setMenu(mobileMenu.getAttribute('aria-expanded') !== 'true');
  });

  window.addEventListener('beforeunload', function () { closeQuiz('abandoned'); });
  updateThemeControl();

  var statePromise = window.LearningHistory ? window.LearningHistory.loadCourseState(COURSE_ID, DEFAULT_STATE) : Promise.resolve(DEFAULT_STATE);
  Promise.all([
    window.fetch('questions.json').then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }),
    statePromise
  ]).then(function (result) {
    questions = result[0];
    state = Object.assign({}, DEFAULT_STATE, result[1] || {});
    if (!Array.isArray(state.completedIds)) state.completedIds = [];
    if (!Array.isArray(state.wrongIds)) state.wrongIds = [];
    if (['path', 'topics', 'exam', 'practice', 'review', 'stats'].indexOf(state.view) === -1) state.view = 'path';
    buildCategories();
    loadingState.hidden = true;
    appView.hidden = false;
    render();
  }).catch(function (error) {
    loadingState.hidden = true;
    appView.hidden = false;
    appView.innerHTML = '<section class="gk-load-error"><strong>問題データを読み込めません。</strong><p>通信状態を確認して、もう一度お試しください。</p><button class="gk-secondary-action" type="button" data-action="reload">再読み込み</button></section>';
    appView.querySelector('[data-action="reload"]').addEventListener('click', function () { window.location.reload(); });
  });
}(window, document));
