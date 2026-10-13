import { projectExamDeliveryProfile } from "./exam-delivery-profile.js";
import { isEligibleFor } from "./item-eligibility.js";
import { validateStableQuestionInventory } from "./question-inventory.js";

export const PMP_PUBLISHED_FORMAT_CAPACITY = Object.freeze({
  singleChoice: 48,
  passageSingle: 95,
  multipleResponse: 37,
  ordering: 0,
  matching: 0,
  caseSetToolPracticum: 0,
});

const PMP_RESPONSE_FORMATS = new Set(Object.keys(PMP_PUBLISHED_FORMAT_CAPACITY));

export function resolvePmpResponseFormat(question = {}) {
  if (Object.prototype.hasOwnProperty.call(question, "pmpResponseFormat")) {
    return PMP_RESPONSE_FORMATS.has(question.pmpResponseFormat) ? question.pmpResponseFormat : null;
  }
  if (question.type === "single_choice") return "singleChoice";
  if (question.type === "passage_single") return "passageSingle";
  if (question.type === "multiple_choice" || question.type === "multiple") return "multipleResponse";
  if (question.type === "ordered_steps") return "ordering";
  if (question.type === "matching") return "matching";
  if (question.type === "case_set") return "caseSetToolPracticum";
  if (question.type === undefined && typeof question.passage === "string" && question.passage.trim()) return "passageSingle";
  if (question.type === undefined) return "singleChoice";
  return null;
}

export function projectPmpFormatCapacity(questions = []) {
  const capacity = Object.fromEntries(Object.keys(PMP_PUBLISHED_FORMAT_CAPACITY).map((format) => [format, 0]));
  const invalidQuestionIds = [];
  for (const question of Array.isArray(questions) ? questions : []) {
    const format = resolvePmpResponseFormat(question);
    if (!format) {
      invalidQuestionIds.push(question?.id || null);
      continue;
    }
    capacity[format] += 1;
  }
  return {
    valid: invalidQuestionIds.length === 0,
    capacity,
    invalidQuestionIds,
  };
}

export function isPmpDeliveryRehearsalQuestion(question = {}) {
  if (typeof question.pmpRehearsalEligible === "boolean") return question.pmpRehearsalEligible;
  return question.source?.kind === "original"
    && question.tags?.includes("pmp-rehearsal-bank");
}

function exactPublishedCapacity(capacity) {
  return Object.entries(PMP_PUBLISHED_FORMAT_CAPACITY)
    .every(([format, count]) => capacity[format] === count);
}

export function projectPmpReadiness(certification = {}) {
  const questions = Array.isArray(certification.questions) ? certification.questions : [];
  const allEligibleQuestions = questions.filter((question) => isEligibleFor(question, "exam"));
  const eligibleQuestions = allEligibleQuestions.filter(isPmpDeliveryRehearsalQuestion);
  const delivery = projectExamDeliveryProfile(certification);
  const stableInventory = validateStableQuestionInventory(eligibleQuestions);
  const formatProjection = projectPmpFormatCapacity(eligibleQuestions);
  const base = {
    delivery,
    eligibleQuestions,
    stableInventory,
    formatCapacity: formatProjection.capacity,
  };
  if (delivery?.kind !== "segmented-shared-timer") {
    return {
      ...base,
      valid: false,
      reasonCode: "delivery-contract-invalid",
      lockedReason: "PMP delivery metadata is missing or invalid; the exact shared-timer, checkpoint, aggregate-scoring, and format-capacity contract is required.",
    };
  }
  if (!stableInventory.valid) {
    return {
      ...base,
      valid: false,
      reasonCode: "inventory-invalid",
      lockedReason: "PMP eligible inventory is invalid: it contains a malformed or duplicate question ID.",
    };
  }
  if (stableInventory.itemCount !== 180) {
    return {
      ...base,
      valid: false,
      reasonCode: "inventory-count-invalid",
      lockedReason: `PMP delivery rehearsal requires exactly 180 unique exam-eligible questions; found ${stableInventory.itemCount}.`,
    };
  }
  if (!formatProjection.valid || !exactPublishedCapacity(formatProjection.capacity)) {
    return {
      ...base,
      valid: false,
      reasonCode: "format-capacity-invalid",
      lockedReason: "PMP published response-format capacity does not match the pinned 48 single choice, 95 passage single, and 37 multiple response contract.",
    };
  }
  return {
    ...base,
    valid: true,
    reasonCode: null,
    lockedReason: null,
    fullMockReasonCode: "format-capacity-incomplete",
    fullMockLockedReason: "PMP full mock requires native format capacity; current published capacity is ordering 0, matching 0, and case-set/tool-practicum 0.",
  };
}
