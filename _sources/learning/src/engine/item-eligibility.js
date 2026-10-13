const PURPOSES = new Set(["study", "transfer", "exam", "readiness"]);

function readProtectedEligibility(question) {
  const eligibility = question?.protectedEligibility;
  if (
    eligibility?.source !== "protected-index-v1"
    || typeof eligibility.transfer !== "boolean"
    || typeof eligibility.exam !== "boolean"
    || typeof eligibility.readiness !== "boolean"
    || typeof eligibility.qualityTier !== "string"
    || !Array.isArray(eligibility.reasonCodes)
  ) return null;
  return {
    study: true,
    transfer: eligibility.transfer,
    exam: eligibility.exam,
    readiness: eligibility.readiness,
    qualityTier: eligibility.qualityTier,
    reasonCodes: [...eligibility.reasonCodes],
  };
}

function qualityRestriction(question) {
  const quality = question?.quality || {};
  const status = String(quality.status || "").trim().toLocaleLowerCase();
  if (question?.ambiguous === true || quality.ambiguous === true || status === "ambiguous") {
    return "quality-ambiguous";
  }
  if (
    question?.qualityBlocked === true
    || quality.blocked === true
    || ["blocked", "quality-blocked", "needs_review"].includes(status)
    || quality.answerVerification === "needs_review"
  ) {
    return "quality-blocked";
  }
  return null;
}

function qualityTier(question, restricted) {
  if (restricted) return "restricted";
  if (question?.quality?.answerVerification === "verified_current") return "verified";
  if (question?.quality?.answerVerification === "source_matched") return "source-matched";
  return "legacy-valid";
}

export function deriveItemEligibility(question = {}) {
  const protectedEligibility = readProtectedEligibility(question);
  if (protectedEligibility) return protectedEligibility;
  const reasonCodes = [];
  const restricted = qualityRestriction(question);
  const validAnswer = Array.isArray(question.answer)
    && question.answer.length > 0
    && question.answer.every((index) => Number.isInteger(index) && index >= 0);
  const validDomain = typeof question.section === "string" && question.section.trim().length > 0;

  if (restricted) reasonCodes.push(restricted);
  if (!validAnswer) reasonCodes.push("invalid-answer");
  if (!validDomain) reasonCodes.push("missing-domain");
  if (question.examEligible === false) reasonCodes.push("exam-ineligible");

  const transferable = !restricted && validAnswer && validDomain;
  const exam = transferable && question.examEligible !== false;
  return {
    study: true,
    transfer: transferable,
    exam,
    readiness: exam,
    qualityTier: qualityTier(question, restricted),
    reasonCodes,
  };
}

export function isEligibleFor(question, purpose) {
  if (!PURPOSES.has(purpose)) return false;
  const eligibility = deriveItemEligibility(question);
  return eligibility[purpose] === true && question?.[purpose] !== false;
}
