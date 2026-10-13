import { isEligibleFor } from "./item-eligibility.js";

const LIMITATION = "Vocabulary active recall and Grammar syllabus reference only; Exam is unavailable.";
const LOCKED_REASON = "HSK Exam is unavailable; only Vocabulary active recall and Grammar syllabus reference are in scope.";

function exactStudyOnlyManifest(certification) {
  const sourceManifest = certification.exam && typeof certification.exam === "object";
  return certification.examReadiness?.level === "preview-only"
    && certification.examReadiness.limitation === LIMITATION
    && Number(sourceManifest ? certification.exam.durationMinutes : certification.duration) === 0
    && Number(sourceManifest ? certification.exam.questionCount : certification.count) === 0
    && (!sourceManifest || certification.exam.passingGoal === null)
    && Array.isArray(certification.sections) && certification.sections.length === 0
    && Array.isArray(sourceManifest ? certification.studyDomains : certification.domainDetails)
    && (sourceManifest ? certification.studyDomains : certification.domainDetails).length === 0
    && Array.isArray(certification.practiceSets) && certification.practiceSets.length === 0
    && !Object.hasOwn(certification, "hskQuestionShape");
}

export function projectHskReadiness(certification = {}) {
  const questions = Array.isArray(certification.questions) ? certification.questions : [];
  const published = questions.filter((question) => question?.status === undefined || question.status === "published");
  const eligible = published.filter((question) => isEligibleFor(question, "exam"));
  const inventory = {
    sourceRows: questions.length,
    published: published.length,
    examEligible: eligible.length,
  };

  if (!exactStudyOnlyManifest(certification)) {
    return {
      inventory,
      valid: false,
      reasonCode: "study-only-contract-invalid",
      lockedReason: "HSK app scope must remain Vocabulary active recall and Grammar syllabus reference only.",
    };
  }
  if (questions.length !== 0) {
    return {
      inventory,
      valid: false,
      reasonCode: "question-inventory-not-empty",
      lockedReason: "HSK canonical question inventory must remain empty.",
    };
  }

  return {
    inventory,
    valid: true,
    reasonCode: null,
    lockedReason: null,
    timedSectionReasonCode: "study-only",
    timedSectionLockedReason: LOCKED_REASON,
    fullMockReasonCode: "study-only",
    fullMockLockedReason: LOCKED_REASON,
  };
}
