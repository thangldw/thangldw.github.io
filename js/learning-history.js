(function (window, document) {
  'use strict';

  var DB_NAME = 'thang-learning-history';
  var DB_VERSION = 1;
  var EXPORT_VERSION = 1;
  var dbPromise;

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return prefix + '_' + window.crypto.randomUUID();
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) {
        reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
        return;
      }
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        var sessions;
        var answers;
        var items;
        if (!db.objectStoreNames.contains('sessions')) {
          sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('courseId', 'courseId', { unique: false });
          sessions.createIndex('startedAt', 'startedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('answers')) {
          answers = db.createObjectStore('answers', { keyPath: 'id' });
          answers.createIndex('courseId', 'courseId', { unique: false });
          answers.createIndex('sessionId', 'sessionId', { unique: false });
          answers.createIndex('answeredAt', 'answeredAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('items')) {
          items = db.createObjectStore('items', { keyPath: 'key' });
          items.createIndex('courseId', 'courseId', { unique: false });
          items.createIndex('dueAt', 'dueAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('Không thể mở lịch sử học.')); };
    });
    return dbPromise;
  }

  function requestPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function storePut(storeName, value) {
    return openDatabase().then(function (db) {
      return requestPromise(db.transaction(storeName, 'readwrite').objectStore(storeName).put(value));
    });
  }

  function getAll(storeName) {
    return openDatabase().then(function (db) {
      return requestPromise(db.transaction(storeName, 'readonly').objectStore(storeName).getAll());
    });
  }

  function startSession(options) {
    var startedAt = new Date().toISOString();
    var session = {
      id: uid('session'),
      courseId: options.courseId,
      courseTitle: options.courseTitle || options.courseId,
      mode: options.mode || 'practice',
      contentType: options.contentType || 'mixed',
      title: options.title || 'Phiên học',
      requestedCount: Number(options.requestedCount || 0),
      timeLimitSeconds: Number(options.timeLimitSeconds || 0),
      startedAt: startedAt,
      endedAt: null,
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 0,
      durationSeconds: 0,
      status: 'active'
    };
    storePut('sessions', session).catch(function () {});
    return session;
  }

  function recordAnswer(session, data) {
    if (!session || !session.id) return Promise.resolve();
    var answeredAt = new Date().toISOString();
    var itemId = String(data.itemId || 'unknown');
    var answer = {
      id: uid('answer'),
      sessionId: session.id,
      courseId: session.courseId,
      itemId: itemId,
      contentType: data.contentType || session.contentType,
      prompt: String(data.prompt || ''),
      selectedAnswer: data.selectedAnswer == null ? null : String(data.selectedAnswer),
      correctAnswer: data.correctAnswer == null ? null : String(data.correctAnswer),
      isCorrect: Boolean(data.isCorrect),
      timedOut: Boolean(data.timedOut),
      responseTimeSeconds: Number(data.responseTimeSeconds || 0),
      answeredAt: answeredAt
    };

    session.answeredCount += 1;
    if (answer.isCorrect) session.correctCount += 1;
    else session.wrongCount += 1;

    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(['answers', 'items', 'sessions'], 'readwrite');
        var itemStore = transaction.objectStore('items');
        var itemKey = session.courseId + ':' + itemId;
        transaction.objectStore('answers').put(answer);
        transaction.objectStore('sessions').put(session);
        var itemRequest = itemStore.get(itemKey);
        itemRequest.onsuccess = function () {
          var item = itemRequest.result || {
            key: itemKey,
            courseId: session.courseId,
            itemId: itemId,
            contentType: answer.contentType,
            attempts: 0,
            correct: 0,
            wrong: 0,
            streak: 0,
            mastery: 0
          };
          item.attempts += 1;
          if (answer.isCorrect) {
            item.correct += 1;
            item.streak += 1;
          } else {
            item.wrong += 1;
            item.streak = 0;
          }
          item.mastery = Math.min(100, Math.max(0, Math.round((item.correct / item.attempts) * 70 + Math.min(item.streak, 3) * 10)));
          item.lastResult = answer.isCorrect ? 'correct' : 'wrong';
          item.lastAnsweredAt = answeredAt;
          var reviewDays = answer.isCorrect ? [1, 3, 7, 14][Math.min(item.streak - 1, 3)] : 1;
          item.dueAt = new Date(Date.now() + reviewDays * 86400000).toISOString();
          itemStore.put(item);
        };
        transaction.oncomplete = function () { resolve(answer); };
        transaction.onerror = function () { reject(transaction.error); };
      });
    });
  }

  function finishSession(session, summary) {
    if (!session || !session.id || session.status === 'completed') return Promise.resolve(session);
    var endedAt = new Date();
    var startedAt = new Date(session.startedAt);
    session.endedAt = endedAt.toISOString();
    session.durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
    session.status = summary && summary.status ? summary.status : 'completed';
    if (summary) {
      if (summary.answeredCount != null) session.answeredCount = Number(summary.answeredCount);
      if (summary.correctCount != null) session.correctCount = Number(summary.correctCount);
      if (summary.wrongCount != null) session.wrongCount = Number(summary.wrongCount);
    }
    return storePut('sessions', session).then(function () { return session; });
  }

  function migrateLegacy(courseId, storageKey) {
    var migrationKey = 'migration:' + courseId + ':' + storageKey;
    return openDatabase().then(function (db) {
      var transaction = db.transaction('meta', 'readwrite');
      var store = transaction.objectStore('meta');
      return requestPromise(store.get(migrationKey)).then(function (existing) {
        if (existing) return existing;
        var raw = window.localStorage.getItem(storageKey);
        var snapshot = { key: migrationKey, courseId: courseId, source: storageKey, migratedAt: new Date().toISOString(), data: null };
        if (raw) {
          try { snapshot.data = JSON.parse(raw); } catch (error) { snapshot.data = raw; }
        }
        return storePut('meta', snapshot);
      });
    }).catch(function () {});
  }

  function dayKey(value) {
    var date = new Date(value);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function getCourseSummary(courseId) {
    return Promise.all([getAll('sessions'), getAll('answers'), getAll('items')]).then(function (result) {
      var sessions = result[0].filter(function (item) { return item.courseId === courseId && item.status === 'completed'; }).sort(function (a, b) { return b.startedAt.localeCompare(a.startedAt); });
      var answers = result[1].filter(function (item) { return item.courseId === courseId; });
      var items = result[2].filter(function (item) { return item.courseId === courseId; });
      var correct = answers.filter(function (answer) { return answer.isCorrect; }).length;
      var totalSeconds = sessions.reduce(function (sum, session) { return sum + Number(session.durationSeconds || 0); }, 0);
      var activity = {};
      sessions.forEach(function (session) {
        var key = dayKey(session.startedAt);
        if (!activity[key]) activity[key] = { sessions: 0, answers: 0, correct: 0, seconds: 0 };
        activity[key].sessions += 1;
        activity[key].answers += Number(session.answeredCount || 0);
        activity[key].correct += Number(session.correctCount || 0);
        activity[key].seconds += Number(session.durationSeconds || 0);
      });
      var activeDays = Object.keys(activity).sort().reverse();
      var streak = 0;
      var cursor = new Date();
      if (!activity[dayKey(cursor)] && !activity[dayKey(new Date(cursor.getTime() - 86400000))]) cursor = new Date(cursor.getTime() - 86400000);
      while (activity[dayKey(cursor)]) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 86400000);
      }
      return {
        sessions: sessions,
        answers: answers,
        items: items,
        activity: activity,
        activeDays: activeDays.length,
        streak: streak,
        totalAnswers: answers.length,
        correctAnswers: correct,
        accuracy: answers.length ? Math.round(correct / answers.length * 100) : 0,
        totalMinutes: Math.round(totalSeconds / 60),
        masteredItems: items.filter(function (item) { return item.mastery >= 80; }).length,
        dueItems: items.filter(function (item) { return item.dueAt && new Date(item.dueAt) <= new Date(); }).length
      };
    });
  }

  function allData() {
    return Promise.all(['sessions', 'answers', 'items', 'meta'].map(getAll)).then(function (values) {
      return { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), sessions: values[0], answers: values[1], items: values[2], meta: values[3] };
    });
  }

  function exportData() {
    return allData().then(function (data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'learning-history-' + dayKey(new Date()) + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return data;
    });
  }

  function importData(file) {
    return file.text().then(function (text) {
      var data = JSON.parse(text);
      if (!data || data.version !== EXPORT_VERSION || !Array.isArray(data.sessions) || !Array.isArray(data.answers)) throw new Error('File sao lưu không đúng định dạng.');
      return openDatabase().then(function (db) {
        return new Promise(function (resolve, reject) {
          var transaction = db.transaction(['sessions', 'answers', 'items', 'meta'], 'readwrite');
          ['sessions', 'answers', 'items', 'meta'].forEach(function (name) {
            (data[name] || []).forEach(function (item) { transaction.objectStore(name).put(item); });
          });
          transaction.oncomplete = function () { resolve(data); };
          transaction.onerror = function () { reject(transaction.error); };
        });
      });
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function formatDuration(seconds) {
    var minutes = Math.floor(Number(seconds || 0) / 60);
    var remainder = Number(seconds || 0) % 60;
    return minutes ? minutes + ' phút ' + remainder + ' giây' : remainder + ' giây';
  }

  function recentDays(summary) {
    var days = [];
    for (var offset = 13; offset >= 0; offset -= 1) {
      var date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      var key = dayKey(date);
      var item = summary.activity[key] || { answers: 0, correct: 0, seconds: 0 };
      days.push({ key: key, label: String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0'), answers: item.answers, correct: item.correct, seconds: item.seconds });
    }
    return days;
  }

  function dashboardHtml(summary, options) {
    var days = recentDays(summary);
    var maxAnswers = Math.max.apply(null, days.map(function (day) { return day.answers; }).concat([1]));
    var chart = days.map(function (day) {
      var height = Math.max(day.answers ? 8 : 2, Math.round(day.answers / maxAnswers * 100));
      return '<div class="lh-bar-column" title="' + day.label + ': ' + day.correct + '/' + day.answers + ' câu đúng"><span class="lh-bar-value">' + (day.answers || '') + '</span><span class="lh-bar"><i style="height:' + height + '%"></i></span><small>' + day.label.slice(0, 2) + '</small></div>';
    }).join('');
    var sessions = summary.sessions.slice(0, 12).map(function (session) {
      var accuracy = session.answeredCount ? Math.round(session.correctCount / session.answeredCount * 100) : 0;
      var sessionAnswers = summary.answers.filter(function (answer) { return answer.sessionId === session.id; }).sort(function (a, b) { return a.answeredAt.localeCompare(b.answeredAt); });
      var answerRows = sessionAnswers.map(function (answer, index) {
        return '<div class="lh-answer' + (answer.isCorrect ? ' is-correct' : ' is-wrong') + '"><span class="lh-answer-index">' + (index + 1) + '</span><div><strong>' + escapeHtml(answer.prompt || answer.itemId) + '</strong><small>' + (answer.timedOut ? 'Hết giờ · ' : '') + escapeHtml(answer.selectedAnswer || 'Không chọn') + ' → ' + escapeHtml(answer.correctAnswer || '') + '</small></div><span class="lh-answer-state">' + (answer.isCorrect ? 'Đúng' : 'Sai') + '<small>' + answer.responseTimeSeconds + 's</small></span></div>';
      }).join('');
      return '<details class="lh-session"><summary><div><strong>' + escapeHtml(session.title) + '</strong><span>' + formatDate(session.startedAt) + ' · ' + escapeHtml(session.contentType) + '</span></div><div class="lh-session-result"><strong>' + session.correctCount + '/' + session.answeredCount + '</strong><span>' + accuracy + '% · ' + formatDuration(session.durationSeconds) + '</span></div><span class="lh-session-toggle">⌄</span></summary><div class="lh-answer-list">' + answerRows + '</div></details>';
    }).join('');
    return '<section class="lh-dashboard"><header class="lh-header"><div><p class="lh-eyebrow">' + escapeHtml(options.eyebrow || 'LỊCH SỬ HỌC TẬP') + '</p><h1>' + escapeHtml(options.title || 'Tiến bộ theo thời gian') + '</h1><p>' + escapeHtml(options.subtitle || 'Mỗi phiên học và từng lượt trả lời được lưu riêng trên thiết bị này.') + '</p></div><div class="lh-data-status"><span>Lưu trên thiết bị</span><strong>IndexedDB</strong><small>Không gửi dữ liệu lên máy chủ</small></div></header>' +
      '<div class="lh-metrics"><div><strong>' + summary.sessions.length + '</strong><span>phiên đã hoàn thành</span></div><div><strong>' + summary.correctAnswers + ' / ' + summary.totalAnswers + '</strong><span>câu trả lời đúng</span></div><div><strong>' + summary.accuracy + '%</strong><span>độ chính xác tổng</span></div><div><strong>' + summary.totalMinutes + '</strong><span>phút học tập</span></div><div><strong>' + summary.streak + '</strong><span>ngày học liên tiếp</span></div><div><strong>' + summary.masteredItems + '</strong><span>mục đạt ≥ 80%</span></div></div>' +
      '<div class="lh-grid"><section class="lh-panel"><div class="lh-panel-head"><div><span>14 NGÀY GẦN NHẤT</span><h2>Nhịp độ học tập</h2></div><strong>' + summary.activeDays + ' ngày đã học</strong></div><div class="lh-chart" role="img" aria-label="Số câu đã trả lời trong 14 ngày gần nhất">' + chart + '</div></section>' +
      '<section class="lh-panel lh-review-panel"><span>ÔN TẬP NGẮT QUÃNG</span><strong>' + summary.dueItems + '</strong><p>mục đã đến thời điểm nên ôn lại</p><small>Mốc ôn được điều chỉnh theo kết quả và chuỗi trả lời đúng.</small></section></div>' +
      '<section class="lh-panel"><div class="lh-panel-head"><div><span>LỊCH SỬ PHIÊN HỌC</span><h2>Hoạt động gần đây</h2></div></div><div class="lh-session-list">' + (sessions || '<div class="lh-empty"><strong>Chưa có phiên học nào.</strong><p>Hoàn thành một lượt luyện tập để bắt đầu theo dõi tiến bộ.</p></div>') + '</div></section>' +
      '<section class="lh-data-tools"><div><strong>Sao lưu lịch sử học</strong><p>Xuất file JSON để chuyển máy hoặc khôi phục khi xóa dữ liệu trình duyệt.</p></div><div class="lh-tool-actions"><button type="button" data-lh-action="export">Xuất dữ liệu</button><button type="button" data-lh-action="import">Nhập dữ liệu</button><input type="file" accept="application/json,.json" data-lh-file hidden></div><p class="lh-message" data-lh-message aria-live="polite"></p></section></section>';
  }

  function renderDashboard(container, options) {
    container.innerHTML = '<div class="lh-loading" role="status">Đang đọc lịch sử học tập…</div>';
    return getCourseSummary(options.courseId).then(function (summary) {
      container.innerHTML = dashboardHtml(summary, options);
      var message = container.querySelector('[data-lh-message]');
      var fileInput = container.querySelector('[data-lh-file]');
      container.querySelector('[data-lh-action="export"]').addEventListener('click', function () {
        exportData().then(function () { message.textContent = 'Đã xuất bản sao lưu lịch sử học.'; }).catch(function (error) { message.textContent = error.message; });
      });
      container.querySelector('[data-lh-action="import"]').addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (!fileInput.files[0]) return;
        importData(fileInput.files[0]).then(function () { return renderDashboard(container, options); }).catch(function (error) { message.textContent = error.message; });
      });
      return summary;
    }).catch(function (error) {
      container.innerHTML = '<div class="lh-error"><strong>Không thể mở lịch sử học.</strong><p>' + escapeHtml(error.message) + '</p></div>';
    });
  }

  window.LearningHistory = {
    startSession: startSession,
    recordAnswer: recordAnswer,
    finishSession: finishSession,
    migrateLegacy: migrateLegacy,
    getCourseSummary: getCourseSummary,
    exportData: exportData,
    importData: importData,
    renderDashboard: renderDashboard
  };
}(window, document));
