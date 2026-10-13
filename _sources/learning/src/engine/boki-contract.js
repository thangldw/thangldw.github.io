import { isEligibleFor } from "./item-eligibility.js";
import { validateStableQuestionInventory } from "./question-inventory.js";

const ZERO_NATIVE_ACCOUNTING_CAPACITY = Object.freeze({
  numeric: 0,
  journalEntry: 0,
  ledger: 0,
  trialBalance: 0,
  worksheet: 0,
});

function numberedIds(prefix, maximum, omitted = []) {
  const omittedSet = new Set(omitted);
  return Array.from({ length: maximum }, (_, index) => index + 1)
    .filter((number) => !omittedSet.has(number))
    .map((number) => `${prefix}-${String(number).padStart(3, "0")}`);
}

const BOKI3_AUDITED_IDS = [
  "boki3-audited-fs-accdep-02",
  "boki3-audited-fs-allowance-01",
  "boki3-audited-fs-cogs-03",
  "boki3-audited-iv-cost-04",
  "boki3-audited-iv-fifo-calc-02",
  "boki3-audited-iv-fifo-price-01",
  "boki3-audited-iv-moving-03",
  "boki3-audited-lg-cash-01",
  "boki3-audited-lg-payable-02",
  "boki3-audited-lg-revenue-03",
  "boki3-audited-sb-asset-05",
  "boki3-audited-sb-checking-04",
  "boki3-audited-sb-collect-02",
  "boki3-audited-sb-credit-purch-01",
  "boki3-audited-sb-kinds-06",
  "boki3-audited-sb-note-sale-03",
  "boki3-audited-sl-cash-in-01",
  "boki3-audited-sl-cash-out-02",
  "boki3-audited-sl-partial-fiction-05",
  "boki3-audited-sl-partial-split-04",
  "boki3-audited-sl-transfer-03",
  "boki3-audited-tb-balance-01",
  "boki3-audited-tb-kinds-03",
  "boki3-audited-tb-mismatch-02",
  "boki3-audited-tb-source-05",
  "boki3-audited-tb-total-06",
  "boki3-audited-tb-undetectable-04",
  "boki3-audited-ws-column-02",
  "boki3-audited-ws-diff-01",
  "boki3-audited-ws-flow-04",
  "boki3-audited-ws-order-05",
  "boki3-audited-ws-profit-side-03",
];

export const BOKI_ELIGIBLE_ID_CONTRACTS = Object.freeze({
  boki1: Object.freeze({
    sha256: "974092a6a4aecc6416aeb6e94c47b8c0fdea63c40c7ce2fa2211faaa4c3e3fb5",
    questionIds: Object.freeze([
      ...numberedIds("boki1-qf-boki1-gen", 30, [13, 23]),
      ...numberedIds("boki1-qf-boki1-kai", 30, [10, 15, 23]),
      ...numberedIds("boki1-qf-boki1-kob", 30, [11, 15]),
      ...numberedIds("boki1-qf-boki1-sho", 30),
    ].sort()),
  }),
  boki2: Object.freeze({
    sha256: "56b15b05cb92ca1597c8091e6a110119968363db4baa074cb8cce566a94c5301",
    questionIds: Object.freeze([
      ...numberedIds("boki2-qf-boki2-com", 40),
      ...numberedIds("boki2-qf-boki2-cos", 40, [20, 29, 30, 39]),
      ...numberedIds("boki2-qf-boki2-fin", 40),
      ...numberedIds("boki2-qf-boki2-ind", 40, [25, 31]),
    ].sort()),
  }),
  boki3: Object.freeze({
    sha256: "34cc74d7f9390587cbdfe49f520affead28b1e561982fc4ba11c8a3ffb80a74b",
    questionIds: Object.freeze([
      ...BOKI3_AUDITED_IDS,
      ...numberedIds("boki3-qf-boki3-bas", 40, [21]),
      ...numberedIds("boki3-qf-boki3-cas", 40, [31]),
      ...numberedIds("boki3-qf-boki3-fix", 40, [21, 31]),
      ...numberedIds("boki3-qf-boki3-tra", 40, [18, 36]),
    ].sort()),
  }),
});

export const BOKI_FORMAT_CONTRACTS = Object.freeze({
  boki1: Object.freeze({
    selectable: Object.freeze({ total: 113, singleChoice: 91, passageSingle: 22 }),
    nativeAccountingResponse: ZERO_NATIVE_ACCOUNTING_CAPACITY,
    selectableTimedSectionAvailable: false,
    selectableTimedSection: null,
  }),
  boki2: Object.freeze({
    selectable: Object.freeze({ total: 154, singleChoice: 90, passageSingle: 64 }),
    nativeAccountingResponse: ZERO_NATIVE_ACCOUNTING_CAPACITY,
    selectableTimedSectionAvailable: false,
    selectableTimedSection: null,
  }),
  boki3: Object.freeze({
    selectable: Object.freeze({ total: 186, singleChoice: 139, passageSingle: 47 }),
    nativeAccountingResponse: ZERO_NATIVE_ACCOUNTING_CAPACITY,
    selectableTimedSectionAvailable: true,
    selectableTimedSection: Object.freeze({ questionCount: 25, durationMinutes: 25 }),
  }),
});

const RESPONSE_FORMATS = new Set([
  "singleChoice",
  "passageSingle",
  "numeric",
  "journalEntry",
  "ledger",
  "trialBalance",
  "worksheet",
]);

export function isBokiCertificationId(certificationId) {
  return Object.hasOwn(BOKI_FORMAT_CONTRACTS, certificationId);
}

export function resolveBokiResponseFormat(question = {}) {
  if (Object.hasOwn(question, "bokiResponseFormat")) {
    return RESPONSE_FORMATS.has(question.bokiResponseFormat) ? question.bokiResponseFormat : null;
  }
  if (question.type === "single_choice") return "singleChoice";
  if (question.type === "passage_single") return "passageSingle";
  if (question.type === "numeric_input") return "numeric";
  if (question.type === "journal_entry") return "journalEntry";
  if (question.type === "ledger_entry") return "ledger";
  if (question.type === "trial_balance") return "trialBalance";
  if (question.type === "worksheet") return "worksheet";
  if (question.type === undefined && typeof question.passage === "string" && question.passage.trim()) return "passageSingle";
  if (question.type === undefined) return "singleChoice";
  return null;
}

export function projectBokiFormatCapacity(questions = []) {
  const flat = {
    singleChoice: 0,
    passageSingle: 0,
    numeric: 0,
    journalEntry: 0,
    ledger: 0,
    trialBalance: 0,
    worksheet: 0,
  };
  const invalidQuestionIds = [];
  for (const question of Array.isArray(questions) ? questions : []) {
    const format = resolveBokiResponseFormat(question);
    if (!format) {
      invalidQuestionIds.push(question?.id || null);
      continue;
    }
    flat[format] += 1;
  }
  return {
    valid: invalidQuestionIds.length === 0,
    capacity: {
      selectable: {
        total: flat.singleChoice + flat.passageSingle,
        singleChoice: flat.singleChoice,
        passageSingle: flat.passageSingle,
      },
      nativeAccountingResponse: {
        numeric: flat.numeric,
        journalEntry: flat.journalEntry,
        ledger: flat.ledger,
        trialBalance: flat.trialBalance,
        worksheet: flat.worksheet,
      },
    },
    invalidQuestionIds,
  };
}

function exactCapacity(actual, expected) {
  return actual?.selectable?.total === expected.selectable.total
    && actual.selectable.singleChoice === expected.selectable.singleChoice
    && actual.selectable.passageSingle === expected.selectable.passageSingle
    && Object.entries(expected.nativeAccountingResponse)
      .every(([format, count]) => actual?.nativeAccountingResponse?.[format] === count);
}

function examEligibleQuestions(questions) {
  return questions.filter((question) => (
    (question?.status === undefined || question.status === "published")
    && isEligibleFor(question?.status === undefined ? question : {
      ...question,
      section: question.section?.name,
      answer: (question.correctAnswer || []).map((answerId) => (
        (question.choices || []).findIndex((choice) => choice.id === answerId)
      )),
    }, "exam")
  ));
}

function exactEligibleIdMembership(certificationId, questions) {
  const expected = BOKI_ELIGIBLE_ID_CONTRACTS[certificationId]?.questionIds || [];
  if (questions.length !== expected.length) return false;
  const actual = questions.map((question) => question.id).sort();
  return actual.every((id, index) => id === expected[index]);
}

export function projectBokiReadiness(certification = {}) {
  const contract = BOKI_FORMAT_CONTRACTS[certification.id];
  const questions = Array.isArray(certification.questions) ? certification.questions : [];
  const eligibleQuestions = examEligibleQuestions(questions);
  const stableInventory = validateStableQuestionInventory(eligibleQuestions);
  const formatProjection = projectBokiFormatCapacity(eligibleQuestions);
  const configuredCapacity = certification.examFormatCapacity ?? certification.exam?.formatCapacity;
  const eligibleIdContract = BOKI_ELIGIBLE_ID_CONTRACTS[certification.id];
  const eligibleIdMembershipValid = exactEligibleIdMembership(certification.id, eligibleQuestions);
  const base = {
    formatCapacity: formatProjection.capacity,
    eligibleQuestions,
    stableInventory,
    eligibleIdDigest: eligibleIdContract?.sha256 || null,
    eligibleIdMembershipValid,
  };
  if (!contract || !exactCapacity(configuredCapacity, contract)) {
    return {
      ...base,
      valid: false,
      reasonCode: "format-contract-invalid",
      lockedReason: "Boki format-capacity contract is missing or does not match the pinned selectable and native accounting-response capacity.",
    };
  }
  if (!stableInventory.valid) {
    return {
      ...base,
      valid: false,
      reasonCode: "inventory-invalid",
      lockedReason: "Boki eligible inventory is invalid: it contains a malformed or duplicate question ID.",
    };
  }
  if (questions.length !== contract.selectable.total || stableInventory.itemCount !== contract.selectable.total) {
    return {
      ...base,
      valid: false,
      reasonCode: "inventory-count-invalid",
      lockedReason: `Boki ${certification.id.slice(-1)} requires exactly ${contract.selectable.total} published exam-eligible selectable questions; found ${stableInventory.itemCount}.`,
    };
  }
  if (!eligibleIdMembershipValid) {
    return {
      ...base,
      valid: false,
      reasonCode: "inventory-membership-invalid",
      lockedReason: `Boki ${certification.id.slice(-1)} eligible inventory does not match the pinned exact eligible ID membership (${eligibleIdContract.sha256}).`,
    };
  }
  if (!formatProjection.valid || !exactCapacity(formatProjection.capacity, contract)) {
    return {
      ...base,
      valid: false,
      reasonCode: "format-capacity-invalid",
      lockedReason: "Boki published response-format capacity does not match the pinned single-choice, passage-single, and zero native accounting-response contract.",
    };
  }
  return {
    ...base,
    valid: true,
    reasonCode: null,
    lockedReason: null,
    selectableTimedSectionAvailable: contract.selectableTimedSectionAvailable,
    selectableTimedSection: contract.selectableTimedSection,
    timedSectionReasonCode: contract.selectableTimedSectionAvailable ? null : "native-format-capacity-incomplete",
    timedSectionLockedReason: contract.selectableTimedSectionAvailable
      ? null
      : `Boki ${certification.id.slice(-1)} timed Exam is unavailable because published native numeric, journal-entry, ledger, trial-balance, and worksheet response capacity is zero.`,
    fullMockReasonCode: "native-format-capacity-incomplete",
    fullMockLockedReason: `Boki ${certification.id.slice(-1)} full simulation requires native numeric, journal-entry, ledger, trial-balance, and worksheet responses; current published capacity is zero for all five formats.`,
  };
}
