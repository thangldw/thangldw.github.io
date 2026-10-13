export const REVIEW_RATINGS = ["again", "hard", "good", "easy"];

export const ERROR_TYPES = [
  { id: "guess", label: "Guessed" },
  { id: "knowledge", label: "Knowledge gap" },
  { id: "confusion", label: "Concept confusion" },
  { id: "contrast", label: "Misread contrast or condition" },
  { id: "language", label: "Language" },
  { id: "careless", label: "Careless reading" },
  { id: "slow", label: "Too slow" },
];

export const CONFIDENCE_LEVELS = ["unsure", "somewhat", "confident"];

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const ATTEMPT_HISTORY_LIMIT = 20;
const MISCONCEPTION_SOURCES = new Set(["learner", "observed-rule", "legacy"]);

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function normalizeMisconception(value, legacyType = null, legacyTimestamp = null) {
  const type = ERROR_TYPES.some((item) => item.id === value?.type)
    ? value.type
    : ERROR_TYPES.some((item) => item.id === legacyType)
      ? legacyType
      : null;
  if (!type) return null;
  const source = MISCONCEPTION_SOURCES.has(value?.source)
    ? value.source
    : value
      ? "learner"
      : "legacy";
  return {
    type,
    subtype: typeof value?.subtype === "string" && value.subtype.trim()
      ? value.subtype.trim()
      : null,
    source,
    classifiedAt: validTimestamp(value?.classifiedAt)
      ? value.classifiedAt
      : validTimestamp(legacyTimestamp)
        ? legacyTimestamp
        : null,
  };
}

function normalizeAttemptHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-ATTEMPT_HISTORY_LIMIT).flatMap((attempt) => {
    if (!attempt || typeof attempt !== "object") return [];
    const outcome = ["correct", "wrong", "timeout"].includes(attempt.outcome)
      ? attempt.outcome
      : null;
    if (!outcome) return [];
    const errorType = ERROR_TYPES.some((item) => item.id === attempt.errorType)
      ? attempt.errorType
      : null;
    return [{
      answeredAt: typeof attempt.answeredAt === "string" ? attempt.answeredAt : null,
      outcome,
      responseTimeMs: Number.isFinite(attempt.responseTimeMs)
        ? Math.max(0, Math.round(attempt.responseTimeMs))
        : 0,
      rating: REVIEW_RATINGS.includes(attempt.rating) ? attempt.rating : null,
      errorType,
      hintUsed: Boolean(attempt.hintUsed),
      confidence: CONFIDENCE_LEVELS.includes(attempt.confidence) ? attempt.confidence : null,
      evidenceEventId: typeof attempt.evidenceEventId === "string" && attempt.evidenceEventId.trim()
        ? attempt.evidenceEventId.trim()
        : null,
      misconception: normalizeMisconception(
        attempt.misconception,
        errorType,
        attempt.answeredAt,
      ),
    }];
  });
}

export function answersMatch(selected = [], correct = []) {
  if (selected.length !== correct.length) return false;
  const expected = new Set(correct);
  return expected.size === correct.length
    && new Set(selected).size === selected.length
    && selected.every((answer) => expected.has(answer));
}

function normalizedReview(record = {}) {
  const lastOutcome = ["correct", "wrong", "timeout"].includes(record.lastOutcome)
    ? record.lastOutcome
    : null;
  const lastRating = REVIEW_RATINGS.includes(record.lastRating) ? record.lastRating : null;
  const errorType = ERROR_TYPES.some((item) => item.id === record.errorType)
    ? record.errorType
    : null;
  const misconception = normalizeMisconception(
    record.misconception,
    errorType,
    record.lastAnsweredAt,
  );
  const normalizedHistory = normalizeAttemptHistory(record.attemptHistory);
  const attemptHistory = normalizedHistory.length || !errorType || !lastOutcome
    ? normalizedHistory
    : [{
      answeredAt: typeof record.lastAnsweredAt === "string" ? record.lastAnsweredAt : null,
      outcome: lastOutcome,
      responseTimeMs: Number.isFinite(record.averageTimeMs) ? Math.max(0, record.averageTimeMs) : 0,
      rating: lastRating,
      errorType,
      hintUsed: Boolean(record.lastHintUsed),
      confidence: CONFIDENCE_LEVELS.includes(record.lastConfidence) ? record.lastConfidence : null,
      evidenceEventId: typeof record.evidenceEventId === "string" && record.evidenceEventId.trim()
        ? record.evidenceEventId.trim()
        : null,
      misconception,
    }];
  return {
    attempts: Number.isInteger(record.attempts) ? record.attempts : 0,
    correctCount: Number.isInteger(record.correctCount) ? record.correctCount : 0,
    correctStreak: Number.isInteger(record.correctStreak) ? record.correctStreak : 0,
    lapses: Number.isInteger(record.lapses) ? record.lapses : 0,
    intervalDays: Number.isFinite(record.intervalDays) ? Math.max(0, record.intervalDays) : 0,
    ease: Number.isFinite(record.ease) ? Math.min(3, Math.max(1.3, record.ease)) : 2.5,
    dueAt: typeof record.dueAt === "string" ? record.dueAt : null,
    lastAnsweredAt: typeof record.lastAnsweredAt === "string" ? record.lastAnsweredAt : null,
    lastOutcome,
    lastRating,
    averageTimeMs: Number.isFinite(record.averageTimeMs) ? Math.max(0, record.averageTimeMs) : 0,
    errorType,
    evidenceEventId: typeof record.evidenceEventId === "string" && record.evidenceEventId.trim()
      ? record.evidenceEventId.trim()
      : null,
    misconception,
    lastHintUsed: Boolean(record.lastHintUsed),
    lastConfidence: CONFIDENCE_LEVELS.includes(record.lastConfidence) ? record.lastConfidence : null,
    reviewBaseIntervalDays: Number.isFinite(record.reviewBaseIntervalDays)
      ? Math.max(0, record.reviewBaseIntervalDays)
      : 0,
    reviewBaseEase: Number.isFinite(record.reviewBaseEase)
      ? Math.min(3, Math.max(1.3, record.reviewBaseEase))
      : 2.5,
    repetitions: Number.isInteger(record.repetitions) ? Math.max(0, record.repetitions) : 0,
    phase: ["new", "learning", "review", "relearning"].includes(record.phase)
      ? record.phase
      : record.intervalDays > 0
        ? "review"
        : record.attempts > 0
          ? "learning"
          : "new",
    isLeech: Boolean(record.isLeech),
    suspended: Boolean(record.suspended),
    attemptHistory,
  };
}

export function scheduleReview(record, rating, answeredAt = new Date()) {
  const current = normalizedReview(record);
  const selectedRating = REVIEW_RATINGS.includes(rating) ? rating : "good";
  const baseInterval = current.reviewBaseIntervalDays;
  const baseEase = current.reviewBaseEase;
  let intervalDays;
  let ease;
  let dueAt;
  let phase;
  let repetitions = current.repetitions;

  if (selectedRating === "again") {
    intervalDays = 0;
    ease = Math.max(1.3, baseEase - 0.2);
    dueAt = new Date(answeredAt.getTime() + 10 * MINUTE_MS);
    phase = baseInterval > 0 || current.phase === "review" ? "relearning" : "learning";
    repetitions = 0;
  } else if (selectedRating === "hard") {
    intervalDays = baseInterval === 0 ? 1 : Math.max(1, Math.round(baseInterval * 1.2));
    ease = Math.max(1.3, baseEase - 0.15);
    dueAt = new Date(answeredAt.getTime() + intervalDays * DAY_MS);
    phase = baseInterval === 0 ? "learning" : "review";
  } else if (selectedRating === "easy") {
    intervalDays = baseInterval === 0 ? 4 : Math.max(4, Math.round(baseInterval * baseEase * 1.3));
    ease = Math.min(3, baseEase + 0.15);
    dueAt = new Date(answeredAt.getTime() + intervalDays * DAY_MS);
    phase = "review";
    repetitions += 1;
  } else {
    intervalDays = baseInterval === 0
      ? (current.correctStreak >= 2 ? 3 : 1)
      : Math.max(1, Math.round(baseInterval * baseEase));
    ease = baseEase;
    dueAt = new Date(answeredAt.getTime() + intervalDays * DAY_MS);
    phase = intervalDays >= 3 || baseInterval > 0 ? "review" : "learning";
    repetitions += 1;
  }

  const attemptHistory = current.attemptHistory.map((attempt, index, entries) => (
    index === entries.length - 1
      ? { ...attempt, rating: selectedRating }
      : attempt
  ));
  return {
    ...current,
    intervalDays,
    ease,
    dueAt: dueAt.toISOString(),
    lastRating: selectedRating,
    phase,
    repetitions,
    isLeech: current.lapses >= 8,
    attemptHistory,
  };
}

export function recordQuestionAttempt(
  record,
  outcome,
  responseTimeMs,
  answeredAt = new Date(),
  context = {},
) {
  const current = normalizedReview(record);
  const correct = outcome === "correct";
  const suggestedRating = REVIEW_RATINGS.includes(context.rating)
    ? context.rating
    : correct ? "good" : "again";
  const attempts = current.attempts + 1;
  const misconception = normalizeMisconception(context.misconception);
  const evidenceEventId = typeof context.evidenceEventId === "string" && context.evidenceEventId.trim()
    ? context.evidenceEventId.trim()
    : null;
  const averageTimeMs = Math.round(
    ((current.averageTimeMs * current.attempts) + Math.max(0, responseTimeMs || 0)) / attempts,
  );
  const attempted = {
    ...current,
    attempts,
    correctCount: current.correctCount + (correct ? 1 : 0),
    correctStreak: correct ? current.correctStreak + 1 : 0,
    lapses: current.lapses + (correct ? 0 : 1),
    lastAnsweredAt: answeredAt.toISOString(),
    lastOutcome: outcome,
    averageTimeMs,
    reviewBaseIntervalDays: current.intervalDays,
    reviewBaseEase: current.ease,
    errorType: misconception?.type || null,
    evidenceEventId,
    misconception,
    lastHintUsed: Boolean(context.hintUsed),
    lastConfidence: CONFIDENCE_LEVELS.includes(context.confidence) ? context.confidence : null,
    attemptHistory: [
      ...current.attemptHistory,
      {
        answeredAt: answeredAt.toISOString(),
        outcome,
        responseTimeMs: Math.max(0, Math.round(responseTimeMs || 0)),
        rating: suggestedRating,
        errorType: misconception?.type || null,
        hintUsed: Boolean(context.hintUsed),
        confidence: CONFIDENCE_LEVELS.includes(context.confidence) ? context.confidence : null,
        evidenceEventId,
        misconception,
      },
    ].slice(-ATTEMPT_HISTORY_LIMIT),
  };
  return scheduleReview(attempted, suggestedRating, answeredAt);
}

export function setQuestionErrorType(record, errorType) {
  const current = normalizedReview(record);
  const selectedErrorType = ERROR_TYPES.some((item) => item.id === errorType) ? errorType : null;
  const misconception = selectedErrorType
    ? normalizeMisconception({
      type: selectedErrorType,
      source: "learner",
      classifiedAt: current.lastAnsweredAt,
    })
    : null;
  return {
    ...current,
    errorType: selectedErrorType,
    misconception,
    attemptHistory: current.attemptHistory.map((attempt, index, entries) => (
      index === entries.length - 1
        ? { ...attempt, errorType: selectedErrorType, misconception }
        : attempt
    )),
  };
}

export function isReviewDue(record, now = new Date()) {
  if (!record?.dueAt || record.suspended) return false;
  const dueTime = Date.parse(record.dueAt);
  return Number.isFinite(dueTime) && dueTime <= now.getTime();
}

export function isMasteredRecord(record, now = new Date()) {
  const current = normalizedReview(record);
  if (
    current.lastOutcome !== "correct"
    || current.lastHintUsed
    || current.correctStreak < 2
    || current.repetitions < 2
    || current.intervalDays < 3
    || isReviewDue(current, now)
  ) return false;

  const unassistedCorrect = current.attemptHistory.filter((attempt) => (
    attempt.outcome === "correct" && !attempt.hintUsed && attempt.answeredAt
  ));
  if (unassistedCorrect.length < 2) return current.attemptHistory.length === 0;
  const [previous, latest] = unassistedCorrect.slice(-2);
  const spacingMs = Date.parse(latest.answeredAt) - Date.parse(previous.answeredAt);
  return Number.isFinite(spacingMs) && spacingMs >= 12 * 60 * 60 * 1000;
}

export function reviewForecast(learning = {}, now = new Date()) {
  const endOfWeek = now.getTime() + 7 * DAY_MS;
  const endOfMonth = now.getTime() + 30 * DAY_MS;
  let dueNow = 0;
  let nextSevenDays = 0;
  let nextThirtyDays = 0;

  Object.values(learning).forEach((record) => {
    if (record?.suspended) return;
    const dueTime = Date.parse(record?.dueAt || "");
    if (!Number.isFinite(dueTime)) return;
    if (dueTime <= now.getTime()) dueNow += 1;
    else if (dueTime <= endOfWeek) nextSevenDays += 1;
    else if (dueTime <= endOfMonth) nextThirtyDays += 1;
  });

  return { dueNow, nextSevenDays, nextThirtyDays };
}

export function sanitizeLearningRecord(record) {
  const normalized = normalizedReview(record);
  if (normalized.attempts === 0 && !normalized.dueAt && !normalized.errorType) return null;
  return normalized;
}
