import { isEligibleFor } from "./item-eligibility.js";

const PMP_PHASE_TAGS = new Set(["predictive", "adaptive-agile", "hybrid"]);
const ROLE_PATTERN = /\b(project manager|scrum master|product owner|project sponsor|sponsor|business analyst)\b/iu;
const CCAR_OFFICIAL_QUESTION_COUNT = 60;
const CCAR_OFFICIAL_DOMAIN_QUOTAS = Object.freeze([
  Object.freeze({ sectionId: "ccarf-architecture", questionCount: 16 }),
  Object.freeze({ sectionId: "ccarf-tools", questionCount: 11 }),
  Object.freeze({ sectionId: "ccarf-claude-code", questionCount: 12 }),
  Object.freeze({ sectionId: "ccarf-prompt-output", questionCount: 12 }),
  Object.freeze({ sectionId: "ccarf-context-reliability", questionCount: 9 }),
]);

function questionSection(question) {
  return typeof question.section === "string"
    ? question.section
    : question.section?.name || "Unsectioned";
}

function questionPrompt(question) {
  return question.prompt ?? question.content?.prompt ?? "";
}

function questionPassage(question) {
  return question.passage ?? question.content?.passage ?? null;
}

function slug(value) {
  return String(value || "group")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/^-|-$/gu, "")
    .toLocaleLowerCase() || "group";
}

function pmpDecisionLens(question) {
  const prompt = questionPrompt(question);
  const context = [questionPassage(question), prompt].filter(Boolean).join("\n");
  const role = (prompt.match(ROLE_PATTERN) || context.match(ROLE_PATTERN))?.[1]?.toLocaleLowerCase() || null;
  const phase = (question.tags || []).find((tag) => PMP_PHASE_TAGS.has(String(tag).toLocaleLowerCase())) || null;
  let action = null;
  if (/\bfirst\b/iu.test(prompt)) action = "first";
  else if (/\bnext\b/iu.test(prompt)) action = "next";
  else if (/\bbest\b|\bmost (?:effective|appropriate)\b/iu.test(prompt)) action = "best";
  return { role, phase, action };
}

function groupBy(items, keyForItem) {
  const groups = new Map();
  for (const item of items) {
    const key = keyForItem(item);
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  }
  return groups;
}

function pmpExperience(certification) {
  const items = (certification.questions || [])
    .filter((question) => question?.id && (questionPrompt(question) || questionPassage(question)))
    .map((question) => ({
      questionId: question.id,
      passage: questionPassage(question),
      prompt: questionPrompt(question),
      section: questionSection(question),
      decisionLens: pmpDecisionLens(question),
    }));
  const grouped = groupBy(items, (item) => item.section);
  const configuredSections = (certification.sections || []).map((section) => section.name).filter(Boolean);
  const orderedSections = [
    ...configuredSections.filter((section) => grouped.has(section)),
    ...[...grouped.keys()].filter((section) => !configuredSections.includes(section)),
  ];
  const groups = orderedSections.map((section) => {
    const groupItems = grouped.get(section) || [];
    return ({
      id: `pmp-${slug(section)}`,
      title: section,
      basis: "section",
      official: false,
      questionIds: groupItems.map((item) => item.questionId),
      items: groupItems.map(({ section: _section, ...item }) => item),
    });
  });
  return {
    kind: "scenario-decision",
    title: "PMP scenario decisions",
    groups,
    dataReadiness: {
      status: groups.length ? "ready" : "unavailable",
      scenarioPracticeAvailable: groups.some((group) => group.questionIds.length > 0),
      contextSource: "question passage and prompt",
    },
  };
}

function officialScenarioId(question) {
  return question.caseId ?? question.content?.caseId ?? null;
}

function officialSharedContext(question) {
  return question.passage ?? question.content?.passage ?? null;
}

function normalizedContext(value) {
  return String(value || "").normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function sharedContextDigest(question) {
  const digest = String(question.sharedContextDigest || "").trim();
  if (digest) return digest;
  const context = normalizedContext(officialSharedContext(question));
  return context ? `normalized:${context}` : null;
}

function contextSignature(question) {
  const digest = sharedContextDigest(question);
  const context = normalizedContext(officialSharedContext(question));
  return digest && context ? `${digest}\0${context}` : digest;
}

function questionSectionId(question) {
  return question.sectionId ?? question.section?.id ?? null;
}

function isPublishedExamItem(question) {
  if (!question?.id || question.status === "draft" || question.status === "review") return false;
  if (question.status === "published") return question.examEligible !== false;
  return isEligibleFor(question, "exam");
}

function combinations(items, count, start = 0, prefix = [], output = []) {
  if (prefix.length === count) {
    output.push(prefix);
    return output;
  }
  for (let index = start; index <= items.length - (count - prefix.length); index += 1) {
    combinations(items, count, index + 1, [...prefix, items[index]], output);
  }
  return output;
}

function quotaLabel(quotas) {
  return quotas.map((quota) => quota.questionCount).join("/");
}

function lockedTopologyReason(topology) {
  const clauses = [];
  if (!topology.contractValid) clauses.push("the configured six-scenario/four-selection contract is invalid");
  if (topology.deficits.missingGroupIdentity) {
    clauses.push(`${topology.deficits.missingGroupIdentity} exam-eligible questions are missing group IDs`);
  }
  if (topology.deficits.missingSharedContext) {
    clauses.push(`${topology.deficits.missingSharedContext} are missing shared contexts`);
  }
  if (topology.deficits.inconsistentContextGroupIds.length) {
    clauses.push(`${topology.deficits.inconsistentContextGroupIds.length} scenario groups have inconsistent shared contexts`);
  }
  if (topology.deficits.unknownCatalogIds.length) {
    clauses.push(`${topology.deficits.unknownCatalogIds.length} group IDs are absent from the configured catalog`);
  }
  if (topology.deficits.missingCatalogIds.length) {
    clauses.push(`${topology.deficits.missingCatalogIds.length} configured catalog groups are missing`);
  }
  if (!topology.constructibleCombinations.length) {
    clauses.push(`0 constructible four-of-six combinations match ${topology.requestedQuestionCount} unique questions and domain quotas ${quotaLabel(topology.domainQuotas)}`);
  }
  return `Official scenario simulation is unavailable: ${clauses.join("; ")}.`;
}

export function projectCcarScenarioTopology(certification = {}) {
  const simulation = certification.examSimulation;
  const simulationObjectValid = Boolean(simulation && typeof simulation === "object" && !Array.isArray(simulation));
  const rawScenarios = simulationObjectValid && Array.isArray(simulation.scenarios) ? simulation.scenarios : [];
  const scenarioCollectionValid = simulationObjectValid
    && Array.isArray(simulation.scenarios)
    && rawScenarios.every((scenario) => (
      scenario && typeof scenario === "object" && !Array.isArray(scenario)
      && typeof scenario.id === "string" && scenario.id.trim()
    ));
  const scenarioEntries = rawScenarios.map((scenario) => ({
    id: typeof scenario?.id === "string" ? scenario.id.trim() : "",
    title: typeof scenario?.title === "string" ? scenario.title : "",
  }));
  const catalogIds = scenarioEntries.map((scenario) => scenario.id).filter(Boolean);
  const scenarioSelectionCount = simulationObjectValid ? simulation.scenarioSelectionCount : undefined;
  const rawDomainQuotas = simulationObjectValid && Array.isArray(simulation.domainQuotas) ? simulation.domainQuotas : [];
  const domainQuotaCollectionValid = simulationObjectValid
    && Array.isArray(simulation.domainQuotas)
    && rawDomainQuotas.every((quota) => (
      quota && typeof quota === "object" && !Array.isArray(quota)
      && typeof quota.sectionId === "string" && quota.sectionId.trim()
      && Number.isInteger(quota.questionCount) && quota.questionCount >= 0
    ));
  const domainQuotas = rawDomainQuotas.map((quota) => ({
    sectionId: typeof quota?.sectionId === "string" ? quota.sectionId.trim() : "",
    questionCount: Number.isInteger(quota?.questionCount) ? quota.questionCount : null,
  }));
  const configuredQuestionCount = certification.count ?? certification.exam?.questionCount;
  const requestedQuestionCount = configuredQuestionCount === undefined
    ? domainQuotas.reduce((sum, quota) => sum + (quota.questionCount || 0), 0)
    : configuredQuestionCount;
  const eligibleQuestions = (certification.questions || []).filter(isPublishedExamItem);
  const missingGroupIdentity = eligibleQuestions.filter((question) => !String(officialScenarioId(question) || "").trim()).length;
  const missingSharedContext = eligibleQuestions.filter((question) => !sharedContextDigest(question)).length;
  const grouped = groupBy(
    eligibleQuestions.filter((question) => String(officialScenarioId(question) || "").trim()),
    (question) => String(officialScenarioId(question)).trim(),
  );
  const inconsistentContextGroupIds = [...grouped.entries()]
    .filter(([, questions]) => new Set(questions.map(contextSignature).filter(Boolean)).size > 1)
    .map(([id]) => id)
    .sort();
  const catalogSet = new Set(catalogIds);
  const unknownCatalogIds = [...grouped.keys()].filter((id) => !catalogSet.has(id)).sort();
  const missingCatalogIds = catalogIds.filter((id) => !grouped.has(id));
  const contractValid = simulationObjectValid
    && scenarioCollectionValid
    && domainQuotaCollectionValid
    && simulation.kind === "blueprint-aligned"
    && catalogIds.length === 6
    && new Set(catalogIds).size === 6
    && scenarioSelectionCount === 4
    && requestedQuestionCount === CCAR_OFFICIAL_QUESTION_COUNT
    && domainQuotas.length === CCAR_OFFICIAL_DOMAIN_QUOTAS.length
    && domainQuotas.every((quota, index) => (
      quota.sectionId === CCAR_OFFICIAL_DOMAIN_QUOTAS[index].sectionId
      && quota.questionCount === CCAR_OFFICIAL_DOMAIN_QUOTAS[index].questionCount
    ));
  const inconsistentSet = new Set(inconsistentContextGroupIds);
  const officialGroups = catalogIds.filter((id) => {
    const members = grouped.get(id) || [];
    return members.length > 0 && !inconsistentSet.has(id) && members.every(sharedContextDigest);
  }).map((id) => {
    const members = grouped.get(id);
    return {
      id,
      title: scenarioEntries.find((scenario) => scenario.id === id)?.title || id,
      basis: "caseId",
      official: true,
      sharedContext: officialSharedContext(members[0]),
      sharedContextDigest: sharedContextDigest(members[0]),
      questionIds: members.map((question) => question.id),
      items: members.map((question) => ({
        questionId: question.id,
        prompt: questionPrompt(question),
        section: questionSection(question),
        tags: [...(question.tags || [])],
      })),
    };
  });
  const officialGroupById = new Map(officialGroups.map((group) => [group.id, group]));
  const allCatalogGroupsProven = catalogIds.length === 6 && officialGroups.length === catalogIds.length;
  const sourceTopologyBlocked = unknownCatalogIds.length > 0
    || missingCatalogIds.length > 0
    || !allCatalogGroupsProven;
  const constructibleCombinations = contractValid && !sourceTopologyBlocked
    ? combinations(catalogIds, scenarioSelectionCount).flatMap((scenarioIds) => {
      const selectedGroups = scenarioIds.map((id) => officialGroupById.get(id));
      if (selectedGroups.some((group) => !group)) return [];
      const questionIds = selectedGroups.flatMap((group) => group.questionIds);
      if (questionIds.length !== requestedQuestionCount || new Set(questionIds).size !== requestedQuestionCount) return [];
      const selected = questionIds.map((id) => eligibleQuestions.find((question) => question.id === id));
      const domainCounts = Object.fromEntries(domainQuotas.map((quota) => [
        quota.sectionId,
        selected.filter((question) => questionSectionId(question) === quota.sectionId).length,
      ]));
      if (domainQuotas.some((quota) => domainCounts[quota.sectionId] !== quota.questionCount)) return [];
      return [{ scenarioIds, questionIds, domainCounts }];
    })
    : [];
  const topology = {
    eligibleQuestionCount: eligibleQuestions.length,
    requestedQuestionCount,
    scenarioSelectionCount,
    catalogIds,
    domainQuotas,
    contractValid,
    officialGroups,
    constructibleCombinations,
    deficits: {
      missingGroupIdentity,
      missingSharedContext,
      inconsistentContextGroupIds,
      unknownCatalogIds,
      missingCatalogIds,
    },
  };
  topology.fullSimulationAvailable = contractValid && !sourceTopologyBlocked && constructibleCombinations.length > 0;
  topology.lockedReason = topology.fullSimulationAvailable ? null : lockedTopologyReason(topology);
  return topology;
}

function ccarExperience(certification) {
  const questions = (certification.questions || []).filter(isPublishedExamItem);
  const derivedGroups = [...groupBy(questions, questionSection).entries()].map(([groupKey, groupQuestions]) => ({
    id: `ccar-f-derived-${slug(groupKey)}`,
    title: groupKey,
    basis: "section",
    official: false,
    sharedContext: null,
    sharedContextDigest: null,
    questionIds: groupQuestions.map((question) => question.id),
    items: groupQuestions.map((question) => ({
      questionId: question.id,
      prompt: questionPrompt(question),
      section: questionSection(question),
      tags: [...(question.tags || [])],
    })),
  }));
  return {
    kind: "domain-practice",
    title: "CCAR-F domain practice",
    groups: derivedGroups,
    derivedGroups,
    officialGroups: [],
    dataReadiness: {
      status: derivedGroups.length ? "ready" : "unavailable",
      scenarioPracticeAvailable: false,
      officialTopologyAvailable: false,
      fullSimulationAvailable: false,
      missingFields: [],
      groupingBasis: "section",
      lockedReason: null,
    },
  };
}

export function getScenarioExperience(certification) {
  if (certification?.id === "pmp") return pmpExperience(certification);
  if (certification?.id === "ccar-f") return ccarExperience(certification);
  return null;
}
