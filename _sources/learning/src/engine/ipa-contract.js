import { isEligibleFor } from "./item-eligibility.js";
import { stableQuestionIdDigest, validateStableQuestionInventory } from "./question-inventory.js";
import { detectQuestionCapabilities } from "./specialist-experience.js";

const IPA_CERTIFICATION_IDS = new Set(["ap", "db", "nw", "sc"]);
const RESPONSE_FORMATS = new Set(["singleChoice", "passageSingle", "written"]);
const ROUTES = new Set(["knowledge", "context"]);
const PROVENANCE_TIERS = new Set(["verifiedCurrent", "sourceMatched"]);

export const IPA_ID_CONTRACTS = Object.freeze({
  ap: Object.freeze({ publishedSha256: "bd3631d02599a52d124b8db478452a085e1b465d0f94aca5f60fa48a29e3c928", eligibleSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", contextSha256: "bf80effbceffee208260ba3f419f4e430e2283c0c5942ad1d3d3914ed08e985d" }),
  db: Object.freeze({ publishedSha256: "a3b6f1642e65768d36644d3a661f0af042cecd0135dc21f90e3ea4e2590cece6", eligibleSha256: "a3b6f1642e65768d36644d3a661f0af042cecd0135dc21f90e3ea4e2590cece6", contextSha256: "f682be334d454d78b696d5d21ba0c277e375da9e7b0dcac38aabc8da4dbaf08d" }),
  nw: Object.freeze({ publishedSha256: "60c97bba6c405c260b18720f88f6f2fead8d886388231ca01b7a0735f5b8d475", eligibleSha256: "60c97bba6c405c260b18720f88f6f2fead8d886388231ca01b7a0735f5b8d475", contextSha256: "a2d19509bae3d6ae8aed9eb328374312b42c28ceedf776370c8c9473cccf741e" }),
  sc: Object.freeze({ publishedSha256: "a8f83a80c75621c4771b889a46af85bc5c371212902ea5261facf9d99ff3319a", eligibleSha256: "a8f83a80c75621c4771b889a46af85bc5c371212902ea5261facf9d99ff3319a", contextSha256: "d6ec1e76e13c1a1ecb341393e22e53a990658533413b4fbb90412b514035bdd4" }),
});

export const IPA_FORMAT_CAPACITIES = Object.freeze({
  ap: Object.freeze({ subjectBWritten: Object.freeze({ published: 1, examEligible: 0 }), subjectASelectable: Object.freeze({ published: 868, examEligible: 0, singleChoice: 772, passageSingle: 96 }), guidedPracticeRouting: Object.freeze({ knowledge: 772, context: 97 }), contentCues: Object.freeze({ passage: 97 }), provenance: Object.freeze({ verifiedCurrent: 639, sourceMatched: 230 }) }),
  db: Object.freeze({ subjectASelectable: Object.freeze({ published: 156, examEligible: 156, singleChoice: 88, passageSingle: 68 }), guidedPracticeRouting: Object.freeze({ knowledge: 15, context: 141 }), contentCues: Object.freeze({ passage: 68 }), provenance: Object.freeze({ verifiedCurrent: 17, sourceMatched: 139 }) }),
  nw: Object.freeze({ subjectASelectable: Object.freeze({ published: 155, examEligible: 155, singleChoice: 94, passageSingle: 61 }), guidedPracticeRouting: Object.freeze({ knowledge: 49, context: 106 }), contentCues: Object.freeze({ passage: 61 }), provenance: Object.freeze({ verifiedCurrent: 18, sourceMatched: 137 }) }),
  sc: Object.freeze({ subjectASelectable: Object.freeze({ published: 190, examEligible: 190, singleChoice: 190, passageSingle: 0 }), guidedPracticeRouting: Object.freeze({ knowledge: 23, context: 167 }), contentCues: Object.freeze({ passage: 0 }), provenance: Object.freeze({ verifiedCurrent: 33, sourceMatched: 157 }) }),
});

export function isPinnedIpaCertificationId(id) {
  return IPA_CERTIFICATION_IDS.has(id);
}

function rawEligibilityShape(question) {
  if (question?.status === undefined) return question;
  return {
    ...question,
    section: question.section?.name,
    answer: (question.correctAnswer || []).map((answerId) => (question.choices || []).findIndex((choice) => choice.id === answerId)),
  };
}

function sectionName(question) {
  return typeof question?.section === "string" ? question.section : question?.section?.name || "";
}

function searchableText(question) {
  return [sectionName(question), ...(question?.tags || []), question?.content?.prompt, question?.content?.helper, question?.content?.passage].filter(Boolean).join("\n");
}

export function resolveIpaResponseFormat(question = {}) {
  if (question.type !== undefined) {
    if (question.type === "single_choice") return "singleChoice";
    if (question.type === "passage_single") return "passageSingle";
    if (question.type === "written_response") return "written";
    return null;
  }
  return Object.hasOwn(question, "ipaResponseFormat") && RESPONSE_FORMATS.has(question.ipaResponseFormat)
    ? question.ipaResponseFormat
    : null;
}

export function resolveIpaPracticeRoute(question = {}, certificationId = question.certId) {
  if (Object.hasOwn(question, "ipaPracticeRoute")) return ROUTES.has(question.ipaPracticeRoute) ? question.ipaPracticeRoute : null;
  const capabilities = detectQuestionCapabilities(question);
  const section = sectionName(question);
  const text = searchableText(question);
  const context = certificationId === "ap"
    ? /科目B|ケース|事例|午後/u.test(section) || capabilities.hasPassage
    : certificationId === "db"
      ? capabilities.structuredArtifacts.includes("sql-er") || /データ|SQL|DB/u.test(section)
      : certificationId === "nw"
        ? capabilities.structuredArtifacts.includes("network-config") || /ネットワーク|プロトコル|ルーティング/u.test(section)
        : certificationId === "sc"
          ? capabilities.structuredArtifacts.includes("incident-log") || /インシデント|セキュリティ/u.test(section)
          : /科目B|ケース|事例|午後/u.test(text) || capabilities.hasPassage;
  return context ? "context" : "knowledge";
}

export function resolveIpaProvenanceTier(question = {}) {
  if (Object.hasOwn(question, "ipaProvenanceTier")) return PROVENANCE_TIERS.has(question.ipaProvenanceTier) ? question.ipaProvenanceTier : null;
  if (question?.quality?.answerVerification === "verified_current") return "verifiedCurrent";
  if (question?.quality?.answerVerification === "source_matched") return "sourceMatched";
  if (question?.protectedEligibility?.qualityTier === "verified") return "verifiedCurrent";
  if (question?.protectedEligibility?.qualityTier === "source-matched") return "sourceMatched";
  return null;
}

export function resolveIpaHasPassage(question = {}) {
  if (Object.hasOwn(question, "ipaHasPassage")) return typeof question.ipaHasPassage === "boolean" ? question.ipaHasPassage : null;
  return Boolean(question?.content?.passage || question?.passage);
}

function sameShape(actual, expected) {
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return actualKeys.length === expectedKeys.length
    && actualKeys.every((key, index) => key === expectedKeys[index])
    && expectedKeys.every((key) => typeof expected[key] === "object" ? sameShape(actual[key], expected[key]) : actual[key] === expected[key]);
}

function projectCapacity(questions, certificationId) {
  const capacity = { subjectASelectable: { published: questions.filter(q=>resolveIpaResponseFormat(q)!=="written").length, examEligible: 0, singleChoice: 0, passageSingle: 0 }, guidedPracticeRouting: { knowledge: 0, context: 0 }, contentCues: { passage: 0 }, provenance: { verifiedCurrent: 0, sourceMatched: 0 } };
  if (certificationId === "ap") capacity.subjectBWritten = { published: 0, examEligible: 0 };
  const invalid = { response: [], routing: [], passage: [], provenance: [] };
  for (const question of questions) {
    if (resolveIpaResponseFormat(question) !== "written" && isEligibleFor(rawEligibilityShape(question), "exam")) capacity.subjectASelectable.examEligible += 1;
    const response = resolveIpaResponseFormat(question);
    if (response === "singleChoice" || response === "passageSingle") capacity.subjectASelectable[response] += 1;
    else if (response === "written" && certificationId === "ap") {
      capacity.subjectBWritten.published += 1;
      if (isEligibleFor(rawEligibilityShape(question), "exam")) capacity.subjectBWritten.examEligible += 1;
    } else invalid.response.push(question.id);
    const route = resolveIpaPracticeRoute(question, certificationId);
    if (route) capacity.guidedPracticeRouting[route] += 1; else invalid.routing.push(question.id);
    const passage = resolveIpaHasPassage(question);
    if (passage === null) invalid.passage.push(question.id); else if (passage) capacity.contentCues.passage += 1;
    const provenance = resolveIpaProvenanceTier(question);
    if (provenance) capacity.provenance[provenance] += 1; else invalid.provenance.push(question.id);
  }
  return { capacity, invalid };
}

export function projectIpaReadiness(certification = {}) {
  const id = certification.id;
  if (!isPinnedIpaCertificationId(id)) return null;
  const expected = IPA_FORMAT_CAPACITIES[id];
  const ids = IPA_ID_CONTRACTS[id];
  const questions = (Array.isArray(certification.questions) ? certification.questions : []).filter((question) => question?.status === undefined || question.status === "published");
  const eligible = questions.filter((question) => isEligibleFor(rawEligibilityShape(question), "exam"));
  const publishedInventory = validateStableQuestionInventory(questions);
  const eligibleInventory = validateStableQuestionInventory(eligible);
  const projection = projectCapacity(questions, id);
  const configured = certification.examFormatCapacity ?? certification.exam?.formatCapacity;
  const readinessDimensions = {
    subjectA: { available: projection.capacity.subjectASelectable.published > 0, timedAvailable: false, published: projection.capacity.subjectASelectable.published, examEligible: projection.capacity.subjectASelectable.examEligible },
  };
  if (id === "ap") readinessDimensions.subjectB = { available: projection.capacity.subjectBWritten.published > 0, published: projection.capacity.subjectBWritten.published, timedAvailable: false, autoScored: false };
  const base = { formatCapacity: projection.capacity, readinessDimensions, eligibleQuestions: eligible };
  const invalid = (reasonCode, lockedReason) => ({ ...base, valid: false, reasonCode, lockedReason });
  if (!sameShape(configured, expected)) return invalid("format-contract-invalid", `${id.toUpperCase()} Subject A practice-capacity contract is missing or does not match the pinned selectable, routing, content, and provenance capacity.`);
  if (!publishedInventory.valid || !eligibleInventory.valid) return invalid("inventory-invalid", `${id.toUpperCase()} IPA published inventory is invalid: it contains a malformed or duplicate question ID.`);
  if (stableQuestionIdDigest(questions) !== ids.publishedSha256) return invalid("published-membership-invalid", `${id.toUpperCase()} IPA exact published ID membership does not match the pinned contract.`);
  if (stableQuestionIdDigest(eligible) !== ids.eligibleSha256) return invalid("eligible-membership-invalid", `${id.toUpperCase()} IPA exam-eligible ID membership does not match the pinned contract.`);
  if (id === "ap" && !sameShape(projection.capacity.subjectBWritten, expected.subjectBWritten)) return invalid("written-format-capacity-invalid", "AP written case capacity does not match the pinned self-check contract.");
  if (projection.invalid.response.length || projection.capacity.subjectASelectable.singleChoice !== expected.subjectASelectable.singleChoice || projection.capacity.subjectASelectable.passageSingle !== expected.subjectASelectable.passageSingle) return invalid("response-format-capacity-invalid", `${id.toUpperCase()} IPA selectable response-format capacity does not match the pinned Subject A contract.`);
  if (projection.invalid.routing.length || projection.capacity.guidedPracticeRouting.knowledge !== expected.guidedPracticeRouting.knowledge || projection.capacity.guidedPracticeRouting.context !== expected.guidedPracticeRouting.context || stableQuestionIdDigest(questions.filter((question) => resolveIpaPracticeRoute(question, id) === "context")) !== ids.contextSha256) return invalid("guided-routing-membership-invalid", `${id.toUpperCase()} IPA exact guided practice routing membership does not match the pinned contract.`);
  if (projection.invalid.passage.length || projection.capacity.contentCues.passage !== expected.contentCues.passage) return invalid("content-capacity-invalid", `${id.toUpperCase()} IPA passage capacity does not match the pinned contract.`);
  if (projection.invalid.provenance.length || projection.capacity.provenance.verifiedCurrent !== expected.provenance.verifiedCurrent || projection.capacity.provenance.sourceMatched !== expected.provenance.sourceMatched) return invalid("provenance-capacity-invalid", `${id.toUpperCase()} IPA provenance capacity does not match the pinned contract.`);
  return { ...base, valid: true, reasonCode: null, lockedReason: null, fullMockReasonCode: id === "ap" ? "ap-practice-only" : "subject-a-practice-only", fullMockLockedReason: id === "ap" ? "AP provides Subject A practice and Subject B written self-check; full Exam is unavailable." : `${id.toUpperCase()} is published as Subject A practice only; Exam is unavailable.`, timedReasonCode: id === "ap" ? "ap-practice-only" : "subject-a-practice-only", timedLockedReason: `${id.toUpperCase()} uses per-question practice timing; timed exam sections are unavailable.` };
}
