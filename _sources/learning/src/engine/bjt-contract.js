import { isEligibleFor } from "./item-eligibility.js";
import { stableOrderedStringDigest, stableQuestionIdDigest, validateStableQuestionInventory } from "./question-inventory.js";

export const BJT_INVENTORY_CONTRACT = Object.freeze({
  sourceRows: Object.freeze({ count: 2351, membershipDigest: "483ffef694b5dbf836c7e559f3b7f13b4dc3a4cd5d4f8d0edb112cddf6537199", orderDigest: "31c0666c014428322c4b5fc86e2e45e36174a753180dfdd18a087a9c334ccff4" }),
  readingPractice: Object.freeze({ count: 728, membershipDigest: "d37804a27c29b79ae751d70855fd1350fecc5c426ac9432e13dd44e3400c9554", orderDigest: "2ca332fcc6099966dfda6635c19d0fecabbdecd71433adee4353348ce25707e4" }),
  archived: Object.freeze({ count: 1623, membershipDigest: "d549438a1821deb5094b5ca02174b813a47d577c406e76ca854e078396ef92fe", orderDigest: "a6655535b5b8627fa917e528665a1f55d886dd06a43c031898785968af1dd69f" }),
  vocabularyDrills: Object.freeze({ count: 1539, membershipDigest: "a012d8d8df96be98828dba41e896117770c97d235737f91f6e0527cf2a8ef383", orderDigest: "a012d8d8df96be98828dba41e896117770c97d235737f91f6e0527cf2a8ef383" }),
  grammarDrills: Object.freeze({ count: 84, membershipDigest: "fa0cc53db2fcb7d0bfeec6bf7e05700d0fa90a8d263406b235c25f734839676d", orderDigest: "fa0cc53db2fcb7d0bfeec6bf7e05700d0fa90a8d263406b235c25f734839676d" }),
});

export const BJT_VISUAL_PROMPT_CONTRACT = Object.freeze({
  count: 83,
  membershipDigest: "f0b7d7e743d239e4c1c38028e2ed9a2c135e149bf4f0633a0d4312567c68792b",
  orderDigest: "f0b7d7e743d239e4c1c38028e2ed9a2c135e149bf4f0633a0d4312567c68792b",
});

export const BJT_QUESTION_SHAPES = Object.freeze({
  compiledFull: "compiled-full-v1",
  protectedIndex: "protected-index-v1",
});

function isRawQuestion(question) {
  return question?.status !== undefined || (question?.section && typeof question.section === "object");
}

function hasSectionIdentity(question, sectionId, sectionName) {
  return (question?.sectionId === sectionId && question?.section === sectionName)
    || (question?.section?.id === sectionId && question?.section?.name === sectionName);
}

export function resolveBjtDeliverySection(question = {}) {
  if (Object.hasOwn(question, "bjtDeliverySection")) {
    return ["reading", "term-drill"].includes(question.bjtDeliverySection)
      ? question.bjtDeliverySection
      : null;
  }
  if (hasSectionIdentity(question, "section-02", "読解")) return "reading";
  if (hasSectionIdentity(question, "section-04", "語彙") || hasSectionIdentity(question, "section-05", "文法")) return "term-drill";
  return null;
}

export function hasBjtSourceAudio(question = {}) {
  return typeof question?.media?.audioUrl === "string" && question.media.audioUrl.trim().length > 0;
}

export function hasBjtVisualPrompt(question = {}) {
  if (!isRawQuestion(question) && Object.hasOwn(question, "bjtVisualPrompt")) return question.bjtVisualPrompt === true;
  return typeof question?.media?.imageUrl === "string" && question.media.imageUrl.trim().length > 0;
}

export function projectBjtProtectedIdentity(question = {}, questionShape = null) {
  return {
    bjtDeliverySection: resolveBjtDeliverySection(question),
    bjtVisualPrompt: hasBjtVisualPrompt(question),
    ...(Object.values(BJT_QUESTION_SHAPES).includes(questionShape)
      ? { bjtQuestionShape: questionShape }
      : {}),
  };
}

function hasExactProjectedIdentity(question) {
  return ["reading", "term-drill"].includes(question?.bjtDeliverySection)
    && typeof question?.bjtVisualPrompt === "boolean"
    && !Object.hasOwn(question, "bjtSourceAudio");
}

function hasExactProtectedEligibility(question) {
  const eligibility = question?.protectedEligibility;
  const expectedReasonCodes = ["exam-ineligible"];
  return eligibility
    && Object.keys(eligibility).sort().join("|") === "exam|qualityTier|readiness|reasonCodes|source|transfer"
    && eligibility.source === "protected-index-v1"
    && eligibility.transfer === true
    && eligibility.exam === false
    && eligibility.readiness === false
    && eligibility.qualityTier === "legacy-valid"
    && Array.isArray(eligibility.reasonCodes)
    && eligibility.reasonCodes.length === expectedReasonCodes.length
    && eligibility.reasonCodes.every((reasonCode, index) => reasonCode === expectedReasonCodes[index])
    && question.examEligible === false;
}

const PROTECTED_REQUIRED_FIELDS = Object.freeze([
  "bjtDeliverySection", "bjtQuestionShape", "bjtVisualPrompt", "examEligible", "id",
  "protectedEligibility", "section", "sectionId",
]);
const PROTECTED_INDEX_FIELDS = Object.freeze(["answerChunkIndex", "handle", "promptChunkIndex"]);
const PROTECTED_ALLOWED_FIELDS = new Set([
  ...PROTECTED_REQUIRED_FIELDS,
  ...PROTECTED_INDEX_FIELDS,
]);

function hasExactCompiledShape(question) {
  return question?.bjtQuestionShape === BJT_QUESTION_SHAPES.compiledFull
    && hasExactProjectedIdentity(question)
    && typeof question.prompt === "string"
    && Array.isArray(question.choices)
    && Array.isArray(question.answer)
    && !Object.hasOwn(question, "protectedEligibility")
    && !Object.hasOwn(question, "handle")
    && !Object.hasOwn(question, "promptChunkIndex")
    && !Object.hasOwn(question, "answerChunkIndex");
}

function hasExactProtectedShape(question) {
  const keys = Object.keys(question || {});
  const indexFieldCount = PROTECTED_INDEX_FIELDS.filter((key) => Object.hasOwn(question || {}, key)).length;
  const exactIndexFields = indexFieldCount === 0 || (
    indexFieldCount === PROTECTED_INDEX_FIELDS.length
    && /^[a-f0-9]{24}$/u.test(question.handle)
    && Number.isInteger(question.promptChunkIndex) && question.promptChunkIndex >= 0
    && Number.isInteger(question.answerChunkIndex) && question.answerChunkIndex >= 0
  );
  return question?.bjtQuestionShape === BJT_QUESTION_SHAPES.protectedIndex
    && keys.every((key) => PROTECTED_ALLOWED_FIELDS.has(key))
    && PROTECTED_REQUIRED_FIELDS.every((key) => Object.hasOwn(question, key))
    && typeof question.id === "string"
    && typeof question.section === "string"
    && typeof question.sectionId === "string"
    && question.examEligible === false
    && exactIndexFields
    && hasExactProjectedIdentity(question)
    && hasExactProtectedEligibility(question);
}

function validateQuestionShape(certification, questions) {
  const declaredShape = certification?.bjtQuestionShape;
  if (questions.every(isRawQuestion)) {
    return declaredShape === undefined
      && questions.every((question) => !Object.hasOwn(question, "bjtQuestionShape") && !hasBjtSourceAudio(question))
      ? { valid: true, kind: "source-raw" }
      : { valid: false, reasonCode: "source-contract-invalid", lockedReason: "BJT raw source inventory contains an unsupported shape marker or audio field." };
  }
  if (declaredShape === BJT_QUESTION_SHAPES.compiledFull) {
    return questions.every(hasExactCompiledShape)
      ? { valid: true, kind: declaredShape }
      : { valid: false, reasonCode: "compiled-contract-invalid", lockedReason: "BJT compiled inventory is missing its exact Reading Practice identity contract." };
  }
  if (declaredShape === BJT_QUESTION_SHAPES.protectedIndex) {
    return questions.every(hasExactProtectedShape)
      ? { valid: true, kind: declaredShape }
      : { valid: false, reasonCode: "protected-contract-invalid", lockedReason: "BJT protected inventory is missing its exact Reading Practice identity contract or contains learner content." };
  }
  return { valid: false, reasonCode: "question-shape-invalid", lockedReason: "BJT non-source inventory is missing an exact compiled or protected shape marker." };
}

function eligibilityShape(question) {
  if (!isRawQuestion(question)) return question;
  return {
    ...question,
    section: question.section?.name,
    answer: (question.correctAnswer || []).map((answerId) => (
      (question.choices || []).findIndex((choice) => choice.id === answerId)
    )),
  };
}

function isPublished(question) {
  return isRawQuestion(question) ? question.status === "published" : true;
}

function isReadingPractice(question) {
  return isPublished(question)
    && resolveBjtDeliverySection(question) === "reading"
    && isEligibleFor(eligibilityShape(question), "transfer");
}

function inventoryMatches(questions, contract) {
  return questions.length === contract.count
    && validateStableQuestionInventory(questions).valid
    && stableQuestionIdDigest(questions) === contract.membershipDigest
    && stableOrderedStringDigest(questions.map((question) => question.id)) === contract.orderDigest;
}

function exactManifest(certification) {
  const sections = certification.sections || [];
  return certification.examReadiness?.level === "concept-practice"
    && certification.examReadiness.limitation === "Reading Practice only; Exam is unavailable."
    && Number(certification.exam?.questionCount ?? certification.count) === 30
    && Number(certification.exam?.durationMinutes ?? certification.duration) === 30
    && sections.length === 1
    && sections[0].id === "section-02"
    && sections[0].name === "読解"
    && certification.exam?.formatCapacity === undefined
    && certification.examFormatCapacity == null;
}

export function projectBjtReadiness(certification = {}) {
  const questions = Array.isArray(certification.questions) ? certification.questions : [];
  const questionShape = validateQuestionShape(certification, questions);
  const sourceShape = questionShape.kind === "source-raw";
  const publishedQuestions = questions.filter(isPublished);
  const readingQuestions = publishedQuestions.filter(isReadingPractice);
  const archivedQuestions = sourceShape ? questions.filter((question) => question.status === "review" && question.examEligible === false) : [];
  const vocabularyDrills = archivedQuestions.filter((question) => hasSectionIdentity(question, "section-04", "語彙"));
  const grammarDrills = archivedQuestions.filter((question) => hasSectionIdentity(question, "section-05", "文法"));
  const visualPromptQuestions = readingQuestions.filter(hasBjtVisualPrompt);
  const base = {
    inventory: { readingPractice: readingQuestions.length },
    practice: { reading: { questionIds: readingQuestions.map((question) => question.id), evidenceEligible: false } },
  };
  if (!exactManifest(certification)) return { ...base, valid: false, reasonCode: "scope-contract-invalid", lockedReason: "BJT app scope must remain a 30-item Reading Practice with Exam unavailable." };
  if (!questionShape.valid) return { ...base, ...questionShape, valid: false };
  if (!validateStableQuestionInventory(questions).valid) return { ...base, valid: false, reasonCode: "inventory-invalid", lockedReason: "BJT source inventory contains a malformed or duplicate stable question ID." };
  const partitions = sourceShape ? [
    [questions, BJT_INVENTORY_CONTRACT.sourceRows, "source"],
    [readingQuestions, BJT_INVENTORY_CONTRACT.readingPractice, "Reading Practice"],
    [archivedQuestions, BJT_INVENTORY_CONTRACT.archived, "archived"],
    [vocabularyDrills, BJT_INVENTORY_CONTRACT.vocabularyDrills, "vocabulary drill"],
    [grammarDrills, BJT_INVENTORY_CONTRACT.grammarDrills, "grammar drill"],
  ] : [
    [questions, BJT_INVENTORY_CONTRACT.readingPractice, "Reading Practice"],
  ];
  const failedPartition = partitions.find(([items, contract]) => !inventoryMatches(items, contract));
  if (failedPartition) return { ...base, valid: false, reasonCode: "inventory-contract-invalid", lockedReason: `BJT ${failedPartition[2]} inventory does not match the pinned count, membership digest, and source order digest.` };
  if (!inventoryMatches(visualPromptQuestions, BJT_VISUAL_PROMPT_CONTRACT)) return { ...base, valid: false, reasonCode: "visual-media-contract-invalid", lockedReason: "BJT Reading visual-prompt inventory does not match the pinned stable-ID membership and source order." };
  const lockedReason = "BJT Exam is unavailable; the app provides Reading Practice only.";
  return {
    ...base,
    valid: true,
    reasonCode: null,
    lockedReason: null,
    timedSectionReasonCode: "reading-practice-only",
    timedSectionLockedReason: lockedReason,
    fullMockReasonCode: "reading-practice-only",
    fullMockLockedReason: lockedReason,
  };
}
