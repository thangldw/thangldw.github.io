const BJT_EXAM_LIKE_STRATEGIES = new Set([
  "full-exam",
  "full-mock",
  "timed-section",
  "delivery-rehearsal",
  "section-rehearsal",
  "exam-simulation",
]);

export function isBjtExamLikePractice(practice = {}) {
  return practice?.mode === "exam"
    || practice?.sessionMode === "exam"
    || practice?.studyMode === "exam"
    || BJT_EXAM_LIKE_STRATEGIES.has(practice?.strategy);
}

export function sanitizeBjtPersistedState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return state;
  const storedMode = state.studyModes?.bjt;
  const snapshot = state.unfinishedSessions?.bjt;
  const forgedExamResume = snapshot && (
    snapshot.studyMode === "exam"
    || isBjtExamLikePractice(snapshot.activePractice)
  );
  if (storedMode !== "exam" && !forgedExamResume) return state;

  const studyModes = { ...(state.studyModes || {}) };
  if (storedMode === "exam") studyModes.bjt = "practice";
  const unfinishedSessions = { ...(state.unfinishedSessions || {}) };
  if (forgedExamResume) delete unfinishedSessions.bjt;
  return { ...state, studyModes, unfinishedSessions };
}
