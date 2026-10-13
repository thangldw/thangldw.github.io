const smartStudyMeta = {
  label: "Smart Study",
  subtitle: "Recall, get feedback, and schedule the next review",
  timingLabel: "Self-paced",
};

export const STUDY_MODE_META = {
  study: smartStudyMeta,
  learn: smartStudyMeta,
  practice: smartStudyMeta,
  exam: {
    label: "Exam",
    subtitle: "Simulate the official pace without learning aids",
    timingLabel: "Time remaining",
  },
};

export function normalizeStudyMode(mode) {
  return mode === "exam" ? "exam" : "study";
}

export function isTimedStudyMode(mode) {
  return mode === "exam";
}

export function timerWarningLevel(remainingSeconds, limitSeconds) {
  const remaining = Number(remainingSeconds);
  const limit = Number(limitSeconds);
  if (!Number.isFinite(remaining) || !Number.isFinite(limit) || limit <= 0) return null;
  if (remaining <= 0) return "expired";
  if (remaining <= limit * 0.05) return "five-percent";
  if (remaining <= limit * 0.1) return "ten-percent";
  return null;
}

export function sessionTimeLimitSeconds(certification, mode) {
  if (!isTimedStudyMode(mode)) return null;
  const durationMinutes = Number(certification?.duration);
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return Math.max(1, Math.round(durationMinutes * 60));
  }
  return 60 * 60;
}

export function sessionTimeRemainingSeconds(certification, mode, startedAt, now = Date.now(), pauseState = {}) {
  const limitSeconds = sessionTimeLimitSeconds(certification, mode);
  if (limitSeconds === null) return null;
  const startedAtMs = Date.parse(startedAt || "");
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) return limitSeconds;
  const completedPauseMs = Math.max(0, Number(pauseState.pausedDurationMs) || 0);
  const pausedAtMs = Date.parse(pauseState.pausedAt || "");
  const activePauseMs = Number.isFinite(pausedAtMs)
    ? Math.max(0, nowMs - Math.max(startedAtMs, pausedAtMs))
    : 0;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs - completedPauseMs - activePauseMs) / 1000));
  return Math.max(0, limitSeconds - elapsedSeconds);
}

export function completedTimedSessionDurationSeconds(
  certification,
  mode,
  startedAt,
  completedAt = Date.now(),
  pauseState = {},
) {
  const startedAtMs = Date.parse(startedAt || "");
  const completedAtMs = completedAt instanceof Date ? completedAt.getTime() : Date.parse(completedAt || "");
  const limitSeconds = sessionTimeLimitSeconds(certification, mode);
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(completedAtMs) || limitSeconds === null) return null;
  const remainingSeconds = sessionTimeRemainingSeconds(
    certification,
    mode,
    startedAt,
    completedAtMs,
    pauseState,
  );
  return Math.max(1, limitSeconds - remainingSeconds);
}

export function updateSessionPause(pauseState = {}, shouldPause, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const pausedAtMs = Date.parse(pauseState.pausedAt || "");
  const pausedDurationMs = Math.max(0, Number(pauseState.pausedDurationMs) || 0);
  if (shouldPause) {
    if (Number.isFinite(pausedAtMs)) return pauseState;
    return {
      pausedAt: new Date(safeNowMs).toISOString(),
      pausedDurationMs,
    };
  }
  if (
    !Number.isFinite(pausedAtMs)
    && pauseState.pausedAt === null
    && pauseState.pausedDurationMs === pausedDurationMs
  ) return pauseState;
  return {
    pausedAt: null,
    pausedDurationMs: pausedDurationMs + (Number.isFinite(pausedAtMs) ? Math.max(0, safeNowMs - pausedAtMs) : 0),
  };
}

export function questionPaceTargetMs(certification) {
  const durationMinutes = Number(certification?.duration);
  const questionCount = Number(certification?.count);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  if (!Number.isFinite(questionCount) || questionCount <= 0) return null;
  return Math.round((durationMinutes * 60 * 1000) / questionCount);
}

export function classifyFluency({ outcome, responseTimeMs, targetMs, assisted = false } = {}) {
  const validTiming = Number.isFinite(responseTimeMs) && responseTimeMs >= 0
    && Number.isFinite(targetMs) && targetMs > 0;
  const paceRatio = validTiming ? Math.round((responseTimeMs / targetMs) * 100) / 100 : null;
  const evidenceEligible = validTiming && !assisted && ["correct", "wrong", "timeout"].includes(outcome);
  if (!evidenceEligible) return { status: "unobserved", paceRatio, evidenceEligible: false };
  if (outcome === "timeout") return { status: "timeout", paceRatio, evidenceEligible: true };
  if (outcome === "wrong") return { status: "fast_error", paceRatio, evidenceEligible: true };
  return {
    status: paceRatio > 1.2 ? "accurate_slow" : "fluent",
    paceRatio,
    evidenceEligible: true,
  };
}
