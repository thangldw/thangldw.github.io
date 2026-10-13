const EXAM_STRATEGIES = new Set(["full-exam", "full-mock", "timed-section", "delivery-rehearsal", "section-rehearsal", "exam-simulation"]);

export function isHskExamLikePractice(practice = {}) {
  return practice?.mode === "exam"
    || practice?.sessionMode === "exam"
    || practice?.studyMode === "exam"
    || EXAM_STRATEGIES.has(practice?.strategy)
    || practice?.questionTags?.includes?.("recalled-exam");
}

export function isHskLockedSessionRequest(certification = {}, request = {}) {
  if (certification?.id !== "hsk-3-0") return false;
  return request?.mode === "exam"
    || EXAM_STRATEGIES.has(request?.mode)
    || isHskExamLikePractice(request?.practice)
    || (request?.practice?.questionIds?.length ?? 0) > 0;
}

export function sanitizeHskPersistedState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return state;
  let sanitized = state;
  const mode = state.studyModes?.["hsk-3-0"];
  if (mode === "exam") {
    sanitized = { ...sanitized, studyModes: { ...state.studyModes, "hsk-3-0": "practice" } };
  }
  for (const field of ["unfinishedSessions", "history", "sessions"]) {
    if (!Object.hasOwn(state[field] || {}, "hsk-3-0")) continue;
    const collection = { ...state[field] };
    delete collection["hsk-3-0"];
    sanitized = { ...sanitized, [field]: collection };
  }
  const hskProgress = state.progress?.["hsk-3-0"];
  if (hskProgress && typeof hskProgress === "object") {
    const termLearning = hskProgress.termLearning;
    sanitized = { ...sanitized, progress: { ...state.progress, "hsk-3-0": {
      answers: {},
      reviewed: [],
      learning: {},
      ...(termLearning && typeof termLearning === "object" ? { termLearning } : {}),
    } } };
  }
  return sanitized;
}
