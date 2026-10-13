import { isEligibleFor } from "./item-eligibility.js";
import { stableQuestionIdDigest, validateStableQuestionInventory } from "./question-inventory.js";
import { detectQuestionCapabilities, resolveFp2PracticeRoute } from "./specialist-experience.js";

const RESPONSE_FORMATS = new Set(["singleChoice", "passageSingle", "written", "numeric"]);
const CONTENT_CUES = new Set(["passage", "markdownTable", "math"]);
const PROVENANCE_TIERS = new Set(["verifiedCurrent", "sourceMatched"]);

export const FP2_ELIGIBLE_ID_SHA256 = "fb65f9153e0c1e7f4a875d9f5e82d7517c5ebd8f5f3fe0c6d37f691d9729c3e1";

export const FP2_FORMAT_CAPACITY = Object.freeze({
  academicSelectable: Object.freeze({ total: 859, singleChoice: 785, passageSingle: 74 }),
  guidedPracticeRouting: Object.freeze({ academic: 859 }),
  contentCues: Object.freeze({ passage: 86, markdownTable: 45, math: 30 }),
  provenance: Object.freeze({ verifiedCurrent: 59, sourceMatched: 800 }),
});

function rawEligibilityShape(question) {
  if (question?.status === undefined) return question;
  return {
    ...question,
    section: question.section?.name,
    answer: (question.correctAnswer || []).map((answerId) => (
      (question.choices || []).findIndex((choice) => choice.id === answerId)
    )),
  };
}

function eligibleQuestions(questions) {
  return (Array.isArray(questions) ? questions : []).filter((question) => (
    (question?.status === undefined || question.status === "published")
    && isEligibleFor(rawEligibilityShape(question), "exam")
  ));
}

export function resolveFp2ResponseFormat(question = {}) {
  if (question.type !== undefined) {
    if (question.type === "single_choice") return "singleChoice";
    if (question.type === "passage_single") return "passageSingle";
    if (question.type === "written_response") return "written";
    if (question.type === "numeric_input") return "numeric";
    return null;
  }
  if (Object.hasOwn(question, "fp2ResponseFormat")) {
    return RESPONSE_FORMATS.has(question.fp2ResponseFormat) ? question.fp2ResponseFormat : null;
  }
  return null;
}

export function resolveFp2ContentCues(question = {}) {
  if (Object.hasOwn(question, "fp2ContentCues")) {
    if (
      !Array.isArray(question.fp2ContentCues)
      || new Set(question.fp2ContentCues).size !== question.fp2ContentCues.length
      || question.fp2ContentCues.some((cue) => !CONTENT_CUES.has(cue))
    ) return null;
    return [...question.fp2ContentCues];
  }
  const capabilities = detectQuestionCapabilities(question);
  return [
    ...(capabilities.hasPassage ? ["passage"] : []),
    ...(capabilities.hasMarkdownTable ? ["markdownTable"] : []),
    ...(capabilities.hasMath ? ["math"] : []),
  ];
}

export function resolveFp2ProvenanceTier(question = {}) {
  if (Object.hasOwn(question, "fp2ProvenanceTier")) {
    return PROVENANCE_TIERS.has(question.fp2ProvenanceTier) ? question.fp2ProvenanceTier : null;
  }
  const answerVerification = question?.quality?.answerVerification;
  if (answerVerification === "verified_current") return "verifiedCurrent";
  if (answerVerification === "source_matched") return "sourceMatched";
  const protectedTier = question?.protectedEligibility?.qualityTier;
  if (protectedTier === "verified") return "verifiedCurrent";
  if (protectedTier === "source-matched") return "sourceMatched";
  return null;
}

function projectCapacity(questions) {
  const capacity = {
    academicSelectable: { total: 0, singleChoice: 0, passageSingle: 0 },
    guidedPracticeRouting: { academic: 0 },
    contentCues: { passage: 0, markdownTable: 0, math: 0 },
    provenance: { verifiedCurrent: 0, sourceMatched: 0 },
  };
  const invalid = { response: [], routing: [], content: [], provenance: [] };
  for (const question of questions) {
    const responseFormat = resolveFp2ResponseFormat(question);
    if (!responseFormat) invalid.response.push(question.id);
    else if (responseFormat === "singleChoice" || responseFormat === "passageSingle") {
      capacity.academicSelectable[responseFormat] += 1;
      capacity.academicSelectable.total += 1;
    } else invalid.response.push(question.id);

    const route = resolveFp2PracticeRoute(question);
    if (!route) invalid.routing.push(question.id);
    else capacity.guidedPracticeRouting[route] += 1;

    const cues = resolveFp2ContentCues(question);
    if (!cues) invalid.content.push(question.id);
    else cues.forEach((cue) => { capacity.contentCues[cue] += 1; });

    const provenance = resolveFp2ProvenanceTier(question);
    if (!provenance) invalid.provenance.push(question.id);
    else capacity.provenance[provenance] += 1;
  }
  return { capacity, invalid };
}

function exactCapacity(actual, expected = FP2_FORMAT_CAPACITY) {
  if (!actual || typeof actual !== "object") return false;
  const actualDimensions = Object.keys(actual).sort();
  const expectedDimensions = Object.keys(expected).sort();
  if (
    actualDimensions.length !== expectedDimensions.length
    || actualDimensions.some((dimension, index) => dimension !== expectedDimensions[index])
  ) return false;
  return Object.entries(expected).every(([dimension, counts]) => {
    const actualKeys = Object.keys(actual[dimension] || {}).sort();
    const expectedKeys = Object.keys(counts).sort();
    return actualKeys.length === expectedKeys.length
      && actualKeys.every((key, index) => key === expectedKeys[index])
      && Object.entries(counts).every(([key, count]) => actual[dimension][key] === count);
  });
}

function exactMembership(questions) {
  return stableQuestionIdDigest(questions) === FP2_ELIGIBLE_ID_SHA256;
}

export function projectFp2Readiness(certification = {}) {
  const questions = eligibleQuestions(certification.questions);
  const inventory = validateStableQuestionInventory(questions);
  const projection = projectCapacity(questions);
  const configuredCapacity = certification.examFormatCapacity ?? certification.exam?.formatCapacity;
  const base = {
    formatCapacity: projection.capacity,
    eligibleQuestions: questions,
    inventory,
    eligibleIdDigest: FP2_ELIGIBLE_ID_SHA256,
    readinessDimensions: {
      academicSelectable: { available: projection.capacity.academicSelectable.total === 859, questionCount: projection.capacity.academicSelectable.total },
    },
  };
  if (!exactCapacity(configuredCapacity)) {
    return { ...base, valid: false, reasonCode: "format-contract-invalid", lockedReason: "FP2 Academic practice-capacity contract is missing or does not match the pinned selectable, routing, content, and provenance capacity." };
  }
  if (!inventory.valid) {
    return { ...base, valid: false, reasonCode: "inventory-invalid", lockedReason: "FP2 eligible inventory is invalid: it contains a malformed or duplicate question ID." };
  }
  if (inventory.itemCount !== FP2_FORMAT_CAPACITY.academicSelectable.total) {
    return { ...base, valid: false, reasonCode: "inventory-count-invalid", lockedReason: `FP2 requires exactly 859 published exam-eligible selectable questions; found ${inventory.itemCount}.` };
  }
  if (!exactMembership(questions)) {
    return { ...base, valid: false, reasonCode: "inventory-membership-invalid", lockedReason: `FP2 eligible inventory does not match the pinned exact eligible ID membership (${FP2_ELIGIBLE_ID_SHA256}).` };
  }
  if (projection.invalid.response.length || !exactCapacity({
    ...FP2_FORMAT_CAPACITY,
    academicSelectable: projection.capacity.academicSelectable,
  })) {
    return { ...base, valid: false, reasonCode: "response-format-capacity-invalid", lockedReason: "FP2 published response-format capacity does not match exactly 785 single choice and 74 passage single questions." };
  }
  if (projection.invalid.routing.length || !Object.entries(FP2_FORMAT_CAPACITY.guidedPracticeRouting).every(([key, count]) => projection.capacity.guidedPracticeRouting[key] === count)) {
    return { ...base, valid: false, reasonCode: "guided-routing-capacity-invalid", lockedReason: "FP2 guided practice routing does not match exactly 859 academic question IDs." };
  }
  if (projection.invalid.content.length || !Object.entries(FP2_FORMAT_CAPACITY.contentCues).every(([key, count]) => projection.capacity.contentCues[key] === count)) {
    return { ...base, valid: false, reasonCode: "content-cue-capacity-invalid", lockedReason: "FP2 content-cue capacity does not match exactly 86 passage, 45 markdown-table, and 30 math records." };
  }
  if (projection.invalid.provenance.length || !Object.entries(FP2_FORMAT_CAPACITY.provenance).every(([key, count]) => projection.capacity.provenance[key] === count)) {
    return { ...base, valid: false, reasonCode: "provenance-capacity-invalid", lockedReason: "FP2 provenance capacity does not match exactly 59 verified-current and 800 source-matched records." };
  }
  return {
    ...base,
    valid: true,
    reasonCode: null,
    lockedReason: null,
    fullMockReasonCode: "academic-practice-only",
    fullMockLockedReason: "FP2 is published as Academic selectable practice only; Exam is unavailable.",
  };
}
