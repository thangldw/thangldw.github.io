function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function uniqueVocabulary(items) {
  const seen = new Set();
  return items.filter((item) => {
    const term = String(item?.term || "").trim();
    const meaning = String(item?.meaning || "").trim();
    const key = `${term}\u0000${meaning}`;
    if (!term || !meaning || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function createMiniTestQuestions({ items = [], count = 5, mode = "jp-to-vi", random = Math.random } = {}) {
  const pool = uniqueVocabulary(items).filter((item) => (
    mode !== "context" || String(item.context || "").includes(item.term)
  ));
  if (pool.length < 4) return [];

  return shuffled(pool, random)
    .slice(0, Math.min(Math.max(1, Number(count) || 5), pool.length))
    .map((item, questionIndex) => {
      const choicesUseJapanese = mode === "vi-to-jp" || mode === "context";
      const answerLabel = choicesUseJapanese ? item.term : item.meaning;
      const distractorLabels = shuffled(
        [...new Set(pool.filter((candidate) => candidate !== item).map((candidate) => (
          choicesUseJapanese ? candidate.term : candidate.meaning
        )))],
        random,
      ).slice(0, 3);
      const choices = shuffled([answerLabel, ...distractorLabels], random).map((label, choiceIndex) => ({
        id: `${questionIndex}-${choiceIndex}`,
        label,
        isCorrect: label === answerLabel,
      }));

      return {
        id: `${item.term}-${questionIndex}`,
        mode,
        prompt: mode === "context"
          ? item.context.replace(new RegExp(escapeRegExp(item.term), "gu"), "＿＿＿")
          : mode === "vi-to-jp" ? item.meaning : item.term,
        choices,
        explanation: { ...item },
      };
    });
}

export function summarizeMiniTest(questions = [], answers = []) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.choiceId]));
  const incorrectItems = [];
  let correct = 0;

  for (const question of questions) {
    const selectedChoice = question.choices.find((choice) => choice.id === answerByQuestion.get(question.id));
    if (selectedChoice?.isCorrect) correct += 1;
    else incorrectItems.push(question.explanation);
  }

  return { correct, total: questions.length, incorrectItems };
}

export function getVocabularyItemsForTab(tab, datasets = {}) {
  if (tab === "c") {
    return (datasets.C || []).map((item) => ({
      term: item.k,
      meaning: item.vi,
      context: item.s || item.co?.[0]?.j || "",
      category: item.p || "Từ vựng",
    }));
  }
  if (tab === "adj") {
    return (datasets.DTP || []).map((item) => ({
      term: item.k,
      meaning: item.vi,
      context: item.co?.[0]?.j || "",
      category: item.p || "Tính từ",
    }));
  }
  if (tab === "ptu") {
    return (datasets.PTU || []).map((item) => ({
      term: item.k,
      meaning: item.vi,
      context: item.col || "",
      category: item.cat || "",
    }));
  }
  if (tab === "s1696") {
    return (datasets.C1696 || []).map((item) => ({
      term: String(item.k || "").split("\n")[0],
      meaning: item.vi,
      context: item.co?.[0]?.j || "",
      category: item.sec || "Bộ 1696",
    }));
  }
  if (tab === "dtg") {
    return Object.entries(datasets.DTG || {}).flatMap(([groupName, group]) => (
      (group.words || []).map((item) => ({
        term: item.v,
        meaning: item.vi,
        context: `${item.n || ""} ${item.v || ""}`.trim(),
        category: groupName,
      }))
    ));
  }
  if (tab === "ct") {
    return (datasets.CT || []).map((item) => ({
      term: item.col,
      meaning: item.vi,
      context: `${item.body || ""}${item.col || ""}`,
      category: "Cơ thể",
    }));
  }
  if (tab === "pre") {
    return (datasets.PRE || []).flatMap((group) => (
      (group.w || []).map((item) => ({
        term: item.k,
        meaning: item.v,
        context: "",
        category: group.p || "Tiền tố",
      }))
    ));
  }
  return [];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderMiniTestDrawer({
  stage = "setup",
  scopeLabel = "Từ vựng",
  modeLabel = "",
  currentIndex = 0,
  questions = [],
  selectedChoiceId = "",
  answers = [],
} = {}) {
  let body = "";

  if (stage === "setup") {
    body = `
      <form class="mini-test-setup" data-mini-test-form>
        <fieldset>
          <legend>Dạng câu hỏi</legend>
          <label><input type="radio" name="mini-test-mode" value="jp-to-vi" checked> Nhật → nghĩa Việt</label>
          <label><input type="radio" name="mini-test-mode" value="vi-to-jp"> Nghĩa Việt → từ Nhật</label>
          <label><input type="radio" name="mini-test-mode" value="context"> Điền từ theo ngữ cảnh</label>
        </fieldset>
        <fieldset>
          <legend>Số câu</legend>
          <label><input type="radio" name="mini-test-count" value="5" checked> 5 câu</label>
          <label><input type="radio" name="mini-test-count" value="10"> 10 câu</label>
        </fieldset>
        <p class="mini-test-setup__note">Câu hỏi lấy từ nhóm đang mở. Kết quả chỉ dùng để ôn tập.</p>
        <p class="mini-test-error" data-mini-test-error role="alert" hidden></p>
        <button type="submit" class="mini-test-primary">Bắt đầu</button>
      </form>`;
  } else if (stage === "question") {
    const question = questions[currentIndex];
    if (!question) return "";
    const selectedChoice = question.choices.find((choice) => choice.id === selectedChoiceId);
    const letters = ["A", "B", "C", "D"];
    const choices = question.choices.map((choice, index) => {
      const isSelected = choice.id === selectedChoiceId;
      const revealCorrect = Boolean(selectedChoice) && choice.isCorrect;
      const stateClass = revealCorrect ? " is-correct" : isSelected ? " is-wrong" : "";
      const stateLabel = revealCorrect ? '<span class="mini-test-choice__state">Đúng</span>'
        : isSelected ? '<span class="mini-test-choice__state">Sai</span>' : "";
      return `<button type="button" class="mini-test-choice${stateClass}" data-mini-test-choice="${escapeHtml(choice.id)}"${selectedChoice ? " disabled" : ""}>
        <span class="mini-test-choice__letter">${letters[index]}</span>
        <span class="mini-test-choice__label">${escapeHtml(choice.label)}</span>
        ${stateLabel}
      </button>`;
    }).join("");
    const feedback = selectedChoice ? `
      <div class="mini-test-feedback ${selectedChoice.isCorrect ? "is-correct" : "is-wrong"}" role="status">
        <strong>${selectedChoice.isCorrect ? "Chính xác" : "Chưa đúng"}</strong>
        <p>Đáp án: <b lang="ja">${escapeHtml(question.explanation.term)}</b></p>
        <p>${escapeHtml(question.explanation.meaning)}</p>
        ${question.explanation.context ? `<p lang="ja">${escapeHtml(question.explanation.context)}</p>` : ""}
      </div>
      <div class="mini-test-actions">
        <button type="button" class="mini-test-secondary" data-mini-test-action="review">Xem lại từ này</button>
        <button type="button" class="mini-test-primary" data-mini-test-action="next">${currentIndex + 1 === questions.length ? "Xem kết quả" : "Tiếp tục"}</button>
      </div>` : '<p class="mini-test-keyboard-hint">Dùng phím A / B / C / D để chọn đáp án</p>';
    body = `
      <div class="mini-test-progress-row">
        <strong>Câu ${currentIndex + 1} / ${questions.length}</strong>
        <progress value="${currentIndex + 1}" max="${questions.length}">${currentIndex + 1} / ${questions.length}</progress>
      </div>
      <p class="mini-test-question" lang="ja">${escapeHtml(question.prompt)}</p>
      <div class="mini-test-choices">${choices}</div>
      ${feedback}`;
  } else if (stage === "result") {
    const result = summarizeMiniTest(questions, answers);
    const reviewRows = result.incorrectItems.length
      ? result.incorrectItems.map((item) => `
        <li>
          <button type="button" data-mini-test-review-term="${escapeHtml(item.term)}">
            <b lang="ja">${escapeHtml(item.term)}</b>
            <span>${escapeHtml(item.meaning)}</span>
          </button>
        </li>`).join("")
      : '<li class="mini-test-result__perfect">Không có từ cần ôn lại.</li>';
    body = `
      <div class="mini-test-result" role="status">
        <p class="mini-test-result__label">Kết quả</p>
        <p class="mini-test-result__score">${result.correct} / ${result.total}</p>
        <p>${result.correct === result.total ? "Hoàn thành chính xác toàn bộ." : `Cần ôn lại ${result.incorrectItems.length} từ.`}</p>
      </div>
      <section class="mini-test-review" aria-labelledby="mini-test-review-title">
        <h3 id="mini-test-review-title">Từ cần ôn lại</h3>
        <ul>${reviewRows}</ul>
      </section>
      <div class="mini-test-actions mini-test-actions--result">
        ${result.incorrectItems.length ? '<button type="button" class="mini-test-secondary" data-mini-test-action="retry-incorrect">Làm lại câu sai</button>' : ""}
        <button type="button" class="mini-test-primary" data-mini-test-action="restart">Tạo bài mới</button>
      </div>`;
  } else {
    return "";
  }

  const meta = [scopeLabel];
  if (modeLabel && questions.length) meta.push(modeLabel, `${questions.length} câu`);

  return `
    <aside class="mini-test-drawer" role="dialog" aria-modal="true" aria-labelledby="mini-test-title">
      <div class="mini-test-drawer__header">
        <div>
          <h2 id="mini-test-title">Mini test</h2>
          <p class="mini-test-drawer__meta">${meta.map(escapeHtml).join(" · ")}</p>
        </div>
        <button type="button" class="mini-test-close" data-mini-test-action="close">Đóng</button>
      </div>
      <div class="mini-test-drawer__body">${body}</div>
    </aside>`;
}

const MODE_LABELS = {
  "jp-to-vi": "Nhật → nghĩa Việt",
  "vi-to-jp": "Nghĩa Việt → từ Nhật",
  context: "Ngữ cảnh",
};

function getSelectedAnswer(question, answers) {
  const answer = answers.find((item) => item.questionId === question.id);
  return question.choices.find((choice) => choice.id === answer?.choiceId);
}

export function initVocabularyMiniTest(doc = document, win = window) {
  const launch = doc.querySelector("[data-mini-test-launch]");
  const root = doc.getElementById("mini-test-root");
  if (!launch || !root) return;

  const state = {
    open: false,
    stage: "setup",
    scopeLabel: "Từ vựng",
    tab: "c",
    mode: "jp-to-vi",
    questions: [],
    answers: [],
    currentIndex: 0,
    selectedChoiceId: "",
  };

  const datasets = () => ({
    C: win.C,
    DTP: win.DTP,
    PTU: win.PTU,
    PAT: win.PAT,
    DTG: win.DTG,
    PRE: win.PRE,
    CT: win.CT,
    C1696: win.C1696,
  });

  function setBackgroundInert(inert) {
    const main = root.parentElement;
    if (!main) return;
    [...main.children].forEach((element) => {
      if (element !== root && !element.matches("script")) element.inert = inert;
    });
  }

  function focusFirstControl() {
    win.requestAnimationFrame(() => {
      root.querySelector("button, input")?.focus();
    });
  }

  function render() {
    if (!state.open) {
      root.innerHTML = "";
      doc.body.classList.remove("mini-test-is-open");
      launch.setAttribute("aria-expanded", "false");
      setBackgroundInert(false);
      return;
    }
    root.innerHTML = renderMiniTestDrawer({
      ...state,
      modeLabel: MODE_LABELS[state.mode],
    });
    doc.body.classList.add("mini-test-is-open");
    launch.setAttribute("aria-expanded", "true");
    setBackgroundInert(true);
    focusFirstControl();
  }

  function openSetup() {
    const activeTab = doc.querySelector('.mtab[aria-selected="true"]');
    state.open = true;
    state.stage = "setup";
    state.tab = activeTab?.dataset.tab || "c";
    state.scopeLabel = activeTab?.textContent?.trim() || "Từ vựng";
    state.questions = [];
    state.answers = [];
    state.currentIndex = 0;
    state.selectedChoiceId = "";
    render();
  }

  function closeDrawer() {
    state.open = false;
    render();
    launch.focus();
  }

  function startTest(form) {
    const formData = new win.FormData(form);
    state.mode = String(formData.get("mini-test-mode") || "jp-to-vi");
    const requestedCount = Number(formData.get("mini-test-count")) || 5;
    const items = getVocabularyItemsForTab(state.tab, datasets());
    const questions = createMiniTestQuestions({ items, count: requestedCount, mode: state.mode });
    if (questions.length < 4) {
      const error = root.querySelector("[data-mini-test-error]");
      error.hidden = false;
      error.textContent = state.mode === "context"
        ? "Nhóm này chưa có đủ dữ liệu ngữ cảnh. Hãy chọn dạng dịch nghĩa."
        : "Nhóm này chưa có đủ bốn từ có nghĩa để tạo mini test.";
      return;
    }
    state.questions = questions;
    state.answers = [];
    state.currentIndex = 0;
    state.selectedChoiceId = "";
    state.stage = "question";
    render();
  }

  function answerQuestion(choiceId) {
    if (state.selectedChoiceId) return;
    const question = state.questions[state.currentIndex];
    if (!question?.choices.some((choice) => choice.id === choiceId)) return;
    state.selectedChoiceId = choiceId;
    state.answers.push({ questionId: question.id, choiceId });
    render();
  }

  function nextQuestion() {
    if (!state.selectedChoiceId) return;
    if (state.currentIndex + 1 >= state.questions.length) {
      state.stage = "result";
    } else {
      state.currentIndex += 1;
      state.selectedChoiceId = "";
    }
    render();
  }

  function reviewTerm(term) {
    const search = doc.querySelector(`#pn-${state.tab} input[type="text"]`) || doc.getElementById("sic");
    closeDrawer();
    if (!search) return;
    search.value = term;
    search.dispatchEvent(new win.Event("input", { bubbles: true }));
    search.focus();
  }

  function retryIncorrect() {
    const incorrect = state.questions.filter((question) => !getSelectedAnswer(question, state.answers)?.isCorrect);
    state.questions = incorrect;
    state.answers = [];
    state.currentIndex = 0;
    state.selectedChoiceId = "";
    state.stage = "question";
    render();
  }

  launch.setAttribute("aria-haspopup", "dialog");
  launch.setAttribute("aria-expanded", "false");
  launch.addEventListener("click", openSetup);

  root.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-mini-test-form]")) return;
    event.preventDefault();
    startTest(event.target);
  });

  root.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-mini-test-choice]");
    if (choice) {
      answerQuestion(choice.dataset.miniTestChoice);
      return;
    }
    const review = event.target.closest("[data-mini-test-review-term]");
    if (review) {
      reviewTerm(review.dataset.miniTestReviewTerm);
      return;
    }
    const action = event.target.closest("[data-mini-test-action]")?.dataset.miniTestAction;
    if (action === "close") closeDrawer();
    else if (action === "next") nextQuestion();
    else if (action === "review") reviewTerm(state.questions[state.currentIndex]?.explanation.term || "");
    else if (action === "retry-incorrect") retryIncorrect();
    else if (action === "restart") openSetup();
  });

  doc.addEventListener("keydown", (event) => {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }
    if (state.stage === "question" && !state.selectedChoiceId && /^[a-d1-4]$/iu.test(event.key)) {
      const index = /^[1-4]$/u.test(event.key) ? Number(event.key) - 1 : event.key.toUpperCase().charCodeAt(0) - 65;
      const choice = state.questions[state.currentIndex]?.choices[index];
      if (choice) {
        event.preventDefault();
        answerQuestion(choice.id);
      }
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...root.querySelectorAll('button:not([disabled]), input:not([disabled])')];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

if (typeof document !== "undefined") initVocabularyMiniTest();
