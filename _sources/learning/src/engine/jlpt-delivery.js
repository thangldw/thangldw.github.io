import { stableOrderedStringDigest, stableStringDigest, validateStableQuestionInventory } from "./question-inventory.js";
import { verifiedJlptTimingAnchorMatches } from "./jlpt-session-auth.js";

const EXPECTED_INVENTORY = Object.freeze({ examEligible: 907, languageReading: 907 });
const EXPECTED_REHEARSAL_COUNT = 50;
const EXPECTED_REHEARSAL_DIGEST = "a444ae6fe21551f369a6a854a91df616af0a437ca114d7135a10289f0208592c";
const EXPECTED_REHEARSAL_ORDER_DIGEST = "a444ae6fe21551f369a6a854a91df616af0a437ca114d7135a10289f0208592c";
const EXPECTED_SECTIONS = Object.freeze([
  Object.freeze({ id: "language-knowledge-reading", label: "Language Knowledge + Reading", durationMinutes: 110 }),
]);
const REHEARSAL_PLAN_KEYS = [
  "id", "title", "mode", "strategy", "eligible", "reasonCode", "lockedReason", "questionIds",
  "questionCount", "durationMinutes", "formatFaithful", "evidenceEligible", "evidenceKind",
  "fullMockEvidenceEligible", "timedFullExamEvidenceEligible", "rehearsalId", "membershipDigest",
  "membershipOrderDigest", "assistancePolicy", "sections", "checkpoints", "sourceCounts",
];
const STRICT_SNAPSHOT_KEYS = [
  "certId", "activePractice", "questionIds", "current", "selected", "result", "answerCommitted",
  "hintRevealed", "hintUsed", "confidence", "reviewRating", "seconds", "paused", "pausedAt",
  "pausedDurationMs", "completedCheckpointIds", "checkpointStartedAt", "sectionStartedAt", "savedAt",
  "sessionResults", "startedAt", "studyMode", "timingAnchor",
];
const STRICT_RESULT_KEYS = ["answer", "outcome", "responseTimeMs", "hintUsed", "confidence", "section", "observed", "answeredAt"];

export const JLPT_STRICT_ASSISTANCE_POLICY = Object.freeze({
  id: "jlpt-section-strict-v1",
  hints: false,
  vietnameseTranslation: false,
  confidenceCapture: false,
  explanations: false,
  repairFlow: false,
  transcript: false,
  synthesis: false,
});

export function isValidJlptStrictAssistancePolicy(policy) {
  return exactKeys(policy, Object.keys(JLPT_STRICT_ASSISTANCE_POLICY))
    && Object.entries(JLPT_STRICT_ASSISTANCE_POLICY).every(([key, value]) => policy[key] === value);
}

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && Object.keys(value).every((key) => keys.includes(key));
}

function sectionName(question) {
  return typeof question?.section === "string" ? question.section : question?.section?.name || "";
}

function isPublishedEligible(question) {
  if (!question || question.examEligible === false) return false;
  if (Object.hasOwn(question, "protectedEligibility")) {
    const eligibility = question.protectedEligibility;
    return eligibility?.source === "protected-index-v1"
      && eligibility.exam === true
      && eligibility.readiness === true;
  }
  if (!Object.hasOwn(question, "tags") && !Object.hasOwn(question, "source")) return false;
  const quality = question.quality || {};
  const qualityStatus = String(quality.status || "").trim().toLocaleLowerCase();
  const qualityRestricted = question.ambiguous === true
    || quality.ambiguous === true
    || question.qualityBlocked === true
    || quality.blocked === true
    || ["ambiguous", "blocked", "quality-blocked", "needs_review"].includes(qualityStatus)
    || quality.answerVerification === "needs_review";
  return !qualityRestricted
    && (!Object.hasOwn(question, "status") || question.status === "published");
}

function deliverySectionId(question) {
  if (!Object.hasOwn(question || {}, "tags")) {
    return question?.jlptDeliverySectionId === "language-knowledge-reading" ? "language-knowledge-reading" : null;
  }
  return sectionName(question) === "聴解" ? null : "language-knowledge-reading";
}

export function isJlptRehearsalQuestion(question) {
  if (!question || deliverySectionId(question) !== "language-knowledge-reading") return false;
  if (!Object.hasOwn(question, "tags")) return question.jlptRehearsalEligible === true;
  return Array.isArray(question.tags)
    && question.tags.includes("2026-07")
    && question.tags.includes("recalled-exam");
}

export function hasUniqueJlptChoiceTexts(question) {
  if (!Object.hasOwn(question || {}, "choices")) return question?.jlptChoiceTextsUnique === true;
  if (!Array.isArray(question.choices) || question.choices.length < 2) return false;
  const normalized = question.choices.map((choice) => (
    typeof choice === "string" ? choice : choice?.text
  )).map((text) => String(text || "").normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase());
  return normalized.every(Boolean) && new Set(normalized).size === normalized.length;
}

export function validateJlptDeliveryContract(certification = {}) {
  const delivery = certification?.examDelivery ?? certification?.exam?.delivery;
  const durationMinutes = certification?.duration ?? certification?.exam?.durationMinutes;
  if (certification?.id !== "jlpt" || durationMinutes !== 110) return null;
  if (!exactKeys(delivery, ["kind", "sections", "transitions"])) return null;
  if (delivery.kind !== "single-section-membership-gated") return null;
  if (!Array.isArray(delivery.sections) || delivery.sections.length !== EXPECTED_SECTIONS.length) return null;
  if (!delivery.sections.every((section, index) => (
    exactKeys(section, ["id", "label", "durationMinutes"])
    && Object.entries(EXPECTED_SECTIONS[index]).every(([key, value]) => section[key] === value)
  ))) return null;
  if (!Array.isArray(delivery.transitions) || delivery.transitions.length !== 0) return null;
  return delivery;
}

function invalid(reasonCode, lockedReason, delivery = null) {
  return {
    valid: false,
    reasonCode,
    lockedReason,
    delivery,
    inventory: { examEligible: 0, languageReading: 0 },
    rehearsal: { available: false, questionIds: [], questionCount: 0, membershipDigest: null, membershipOrderDigest: null },
    fullMock: { available: false },
  };
}

export function projectJlptDeliveryReadiness(certification = {}) {
  if (certification?.id !== "jlpt") return null;
  const delivery = validateJlptDeliveryContract(certification);
  if (!delivery) return invalid("delivery-contract-invalid", "JLPT delivery timing or irreversible section order is invalid.");
  const questions = Array.isArray(certification.questions) ? certification.questions.filter(isPublishedEligible) : [];
  const stableInventory = validateStableQuestionInventory(questions);
  if (!stableInventory.valid) return invalid("inventory-invalid", "JLPT eligible inventory contains a malformed or duplicate stable ID.", delivery);
  const languageReading = questions.filter((question) => deliverySectionId(question) === "language-knowledge-reading");
  if (languageReading.length !== questions.length) return invalid("section-identity-invalid", "JLPT inventory contains an item outside Language Knowledge and Reading.", delivery);
  const inventory = {
    examEligible: questions.length,
    languageReading: languageReading.length,
  };
  if (Object.entries(EXPECTED_INVENTORY).some(([key, value]) => inventory[key] !== value)) {
    return invalid("inventory-contract-drift", "JLPT Language Knowledge and Reading inventory differs from the pinned contract.", delivery);
  }
  const rehearsalQuestions = questions.filter(isJlptRehearsalQuestion);
  if (rehearsalQuestions.some((question) => !hasUniqueJlptChoiceTexts(question))) {
    return invalid("rehearsal-choice-identity-invalid", "JLPT rehearsal choices contain missing or duplicate normalized text.", delivery);
  }
  const questionIds = rehearsalQuestions.map((question) => question.id);
  const membershipDigest = stableStringDigest(questionIds);
  const membershipOrderDigest = stableOrderedStringDigest(questionIds);
  if (
    questionIds.length !== EXPECTED_REHEARSAL_COUNT
    || membershipDigest !== EXPECTED_REHEARSAL_DIGEST
    || membershipOrderDigest !== EXPECTED_REHEARSAL_ORDER_DIGEST
  ) {
    return invalid("rehearsal-membership-invalid", "JLPT July 2026 Language Knowledge + Reading rehearsal membership is invalid.", delivery);
  }
  return {
    valid: true,
    reasonCode: null,
    lockedReason: null,
    delivery,
    inventory,
    rehearsal: {
      available: true,
      id: "jlpt-language-reading-2026-07-rehearsal",
      title: "July 2026 Language Knowledge + Reading section rehearsal",
      sectionId: "language-knowledge-reading",
      questionIds,
      questionCount: questionIds.length,
      durationMinutes: 110,
      membershipDigest,
      membershipOrderDigest,
      evidenceKind: "section-rehearsal",
      assistancePolicy: JLPT_STRICT_ASSISTANCE_POLICY,
    },
    fullMock: { available: false, reasonCode: "section-rehearsal-only", lockedReason: "Only the Language Knowledge + Reading section rehearsal is available." },
  };
}

function sameOrderedIds(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((id, index) => id === right[index]);
}

export function isValidJlptSectionRehearsalPlan(certification = {}, plan = {}) {
  const readiness = projectJlptDeliveryReadiness(certification);
  if (!readiness?.valid || !plan || typeof plan !== "object" || Array.isArray(plan)) return false;
  const rehearsal = readiness.rehearsal;
  const section = Array.isArray(plan.sections) && plan.sections.length === 1 ? plan.sections[0] : null;
  return exactKeys(plan, REHEARSAL_PLAN_KEYS)
    && plan.id === rehearsal.id
    && plan.rehearsalId === rehearsal.id
    && plan.mode === "exam"
    && plan.strategy === "timed-section"
    && plan.eligible === true
    && plan.title === "Language Knowledge + Reading section rehearsal"
    && plan.reasonCode === null
    && plan.lockedReason === null
    && plan.questionCount === rehearsal.questionCount
    && plan.durationMinutes === rehearsal.durationMinutes
    && plan.formatFaithful === false
    && plan.evidenceEligible === true
    && plan.evidenceKind === "section-rehearsal"
    && plan.fullMockEvidenceEligible === false
    && plan.timedFullExamEvidenceEligible === false
    && plan.membershipDigest === rehearsal.membershipDigest
    && plan.membershipOrderDigest === rehearsal.membershipOrderDigest
    && isValidJlptStrictAssistancePolicy(plan.assistancePolicy)
    && sameOrderedIds(plan.questionIds, rehearsal.questionIds)
    && Array.isArray(plan.checkpoints)
    && plan.checkpoints.length === 0
    && section?.id === rehearsal.sectionId
    && exactKeys(section, ["id", "label", "questionCount", "durationMinutes", "questionIds"])
    && section.label === "Language Knowledge + Reading"
    && section.questionCount === rehearsal.questionCount
    && section.durationMinutes === rehearsal.durationMinutes
    && sameOrderedIds(section.questionIds, rehearsal.questionIds)
    && exactKeys(plan.sourceCounts, ["timed"])
    && plan.sourceCounts.timed === rehearsal.questionCount;
}

function validTimestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : null;
}

function validJlptSessionResults(results, certification, questionIds, startedAtMs, savedAtMs) {
  if (!results || typeof results !== "object" || Array.isArray(results)) return false;
  const validIds = new Set(questionIds);
  const questions = new Map((Array.isArray(certification?.questions) ? certification.questions : []).map((question) => [question.id, question]));
  return Object.entries(results).every(([questionId, result]) => {
    const answeredAtMs = validTimestamp(result?.answeredAt);
    return validIds.has(questionId)
      && result
      && typeof result === "object"
      && !Array.isArray(result)
      && exactKeys(result, STRICT_RESULT_KEYS)
      && result.observed === true
      && ["correct", "wrong"].includes(result.outcome)
      && Array.isArray(result.answer)
      && Number.isFinite(result.responseTimeMs)
      && result.responseTimeMs >= 0
      && result.hintUsed === false
      && (result.confidence === null || result.confidence === undefined)
      && result.section === sectionName(questions.get(questionId))
      && answeredAtMs !== null
      && answeredAtMs >= startedAtMs
      && answeredAtMs <= savedAtMs;
  });
}

export function safeJlptResumePrompt(snapshot) {
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    && Array.isArray(snapshot.questionIds) && snapshot.questionIds.length > 0
    ? snapshot
    : null;
}

function sameAnswer(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

export function projectJlptSectionSessionRestore(certification = {}, snapshot = {}, now = Date.now(), verifiedTimingAnchor = null) {
  if (certification?.id !== "jlpt") return null;
  const invalid = { status: "invalid", remainingSeconds: 0, snapshot: null };
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const startedAtMs = validTimestamp(snapshot?.startedAt);
  const savedAtMs = validTimestamp(snapshot?.savedAt);
  const timingAnchor = verifiedTimingAnchor?.anchor;
  const currentQuestionId = Array.isArray(snapshot?.questionIds) && Number.isInteger(snapshot?.current)
    ? snapshot.questionIds[snapshot.current]
    : null;
  const currentResult = snapshot?.sessionResults?.[currentQuestionId];
  const answerStateValid = snapshot?.result === null
    ? snapshot.answerCommitted === false && !currentResult
    : ["correct", "wrong"].includes(snapshot?.result)
      && snapshot.answerCommitted === true
      && currentResult?.outcome === snapshot.result
      && sameAnswer(snapshot.selected, currentResult.answer);
  const expectedSecondsAtSave = startedAtMs === null || savedAtMs === null
    ? null
    : Math.max(0, 110 * 60 - Math.floor((savedAtMs - startedAtMs) / 1000));
  if (
    !Number.isFinite(nowMs)
    || !exactKeys(snapshot, STRICT_SNAPSHOT_KEYS)
    || snapshot?.certId !== "jlpt"
    || snapshot.studyMode !== "exam"
    || !isValidJlptSectionRehearsalPlan(certification, snapshot.activePractice)
    || !sameOrderedIds(snapshot.questionIds, snapshot.activePractice.questionIds)
    || !Number.isInteger(snapshot.current)
    || snapshot.current < 0
    || snapshot.current >= snapshot.questionIds.length
    || !Array.isArray(snapshot.selected)
    || snapshot.selected.some((value) => !Number.isInteger(value) || value < 0)
    || !answerStateValid
    || (snapshot.reviewRating !== null && snapshot.reviewRating !== undefined)
    || snapshot.hintRevealed !== false
    || snapshot.hintUsed !== false
    || (snapshot.confidence !== null && snapshot.confidence !== undefined)
    || snapshot.paused !== false
    || snapshot.pausedAt !== null
    || snapshot.pausedDurationMs !== 0
    || !Array.isArray(snapshot.completedCheckpointIds)
    || snapshot.completedCheckpointIds.length !== 0
    || snapshot.checkpointStartedAt !== null
    || snapshot.sectionStartedAt !== snapshot.startedAt
    || !verifiedJlptTimingAnchorMatches(verifiedTimingAnchor, certification, snapshot.activePractice)
    || JSON.stringify(snapshot.timingAnchor) !== JSON.stringify(timingAnchor)
    || snapshot.startedAt !== timingAnchor.startedAt
    || startedAtMs === null
    || savedAtMs === null
    || startedAtMs > savedAtMs
    || savedAtMs > nowMs
    || !Number.isInteger(snapshot.seconds)
    || expectedSecondsAtSave === null
    || Math.abs(snapshot.seconds - expectedSecondsAtSave) > 1
    || !validJlptSessionResults(snapshot.sessionResults, certification, snapshot.questionIds, startedAtMs, savedAtMs)
  ) return invalid;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const remainingSeconds = Math.max(0, snapshot.activePractice.durationMinutes * 60 - elapsedSeconds);
  return {
    status: remainingSeconds === 0 ? "expired" : "active",
    remainingSeconds,
    snapshot: {
      ...snapshot,
      seconds: remainingSeconds,
      paused: false,
      pausedAt: null,
      pausedDurationMs: 0,
    },
  };
}
