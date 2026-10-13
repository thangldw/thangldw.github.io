import { answersMatch, isMasteredRecord, isReviewDue } from "./learning-engine.js";
import { projectExamDeliveryProfile } from "./exam-delivery-profile.js";
import { isEligibleFor } from "./item-eligibility.js";
import { validateStableQuestionInventory } from "./question-inventory.js";
import { isBokiCertificationId, projectBokiReadiness } from "./boki-contract.js";
import { projectFp2Readiness } from "./fp2-contract.js";
import { isPinnedIpaCertificationId, projectIpaReadiness } from "./ipa-contract.js";
import { projectPmpReadiness } from "./pmp-contract.js";
import { isValidJlptStrictAssistancePolicy, projectJlptDeliveryReadiness } from "./jlpt-delivery.js";
import { projectBjtReadiness } from "./bjt-contract.js";
import { isBjtExamLikePractice } from "./bjt-session-boundary.js";
import { projectHskReadiness } from "./hsk-contract.js";
import { projectCcarScenarioTopology } from "./scenario-experience.js";
import { updateSessionPause } from "./session-rules.js";

export function shuffleItems(items, random = Math.random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function blueprintSimulationSelection(certification, random = Math.random) {
  const simulation = certification.examSimulation;
  if (certification.id === "ccar-f") {
    const topology = projectCcarScenarioTopology(certification);
    if (!topology.fullSimulationAvailable) {
      return {
        eligible: false,
        lockedReason: topology.lockedReason,
        questionIds: [],
        scenarioIds: [],
      };
    }
    const combination = topology.constructibleCombinations[
      Math.min(topology.constructibleCombinations.length - 1, Math.floor(random() * topology.constructibleCombinations.length))
    ];
    const groupById = new Map(topology.officialGroups.map((group) => [group.id, group]));
    const selectedGroups = shuffleItems(
      combination.scenarioIds.map((id) => groupById.get(id)),
      random,
    );
    return {
      eligible: true,
      lockedReason: null,
      questionIds: selectedGroups.flatMap((group) => group.questionIds),
      scenarioIds: selectedGroups.map((group) => group.id),
    };
  }
  if (!simulation) return null;
  const quotas = simulation.domainQuotas || [];
  const scenarios = simulation.scenarios || [];
  const scenarioSelectionCount = simulation.scenarioSelectionCount;
  const requestedCount = Number.isInteger(certification.count) && certification.count > 0
    ? certification.count
    : quotas.reduce((sum, quota) => sum + (quota.questionCount || 0), 0);
  const quotaTotal = quotas.reduce((sum, quota) => sum + (quota.questionCount || 0), 0);
  if (
    simulation.kind !== "blueprint-aligned"
    || !quotas.length
    || quotaTotal !== requestedCount
    || !Number.isInteger(scenarioSelectionCount)
    || scenarioSelectionCount < 1
    || scenarioSelectionCount > scenarios.length
  ) {
    return {
      eligible: false,
      lockedReason: "Blueprint simulation metadata does not match the configured exam size and scenario contract.",
      questionIds: [],
      scenarioIds: [],
    };
  }

  const sectionNamesById = new Map((certification.sections || []).map((section) => [section.id, section.name]));
  const eligibleQuestions = (certification.questions || []).filter((question) => isEligibleFor(question, "exam"));
  const selectedQuestions = [];
  for (const quota of quotas) {
    const sectionName = sectionNamesById.get(quota.sectionId);
    const candidates = eligibleQuestions.filter((question) => (
      question.sectionId === quota.sectionId
      || (sectionName && question.section === sectionName)
    ));
    if (candidates.length < quota.questionCount) {
      return {
        eligible: false,
        lockedReason: `Blueprint simulation quota cannot be filled for ${quota.sectionId}: requires ${quota.questionCount}, found ${candidates.length}.`,
        questionIds: [],
        scenarioIds: [],
      };
    }
    selectedQuestions.push(...shuffleItems(candidates, random).slice(0, quota.questionCount));
  }

  if (new Set(selectedQuestions.map((question) => question.id)).size !== requestedCount) {
    return {
      eligible: false,
      lockedReason: "Blueprint simulation quotas produced duplicate or incomplete question coverage.",
      questionIds: [],
      scenarioIds: [],
    };
  }
  return {
    eligible: true,
    lockedReason: null,
    questionIds: shuffleItems(selectedQuestions, random).map((question) => question.id),
    scenarioIds: shuffleItems(scenarios, random).slice(0, scenarioSelectionCount).map((scenario) => scenario.id),
  };
}

function deliveryProfileSelection(certification, random = Math.random) {
  const configuredDelivery = certification.examDelivery ?? certification.exam?.delivery;
  const pinnedHiddenUnscored = certification.id === "aws" || certification.id === "aws-aip-c01";
  const deliveryLabel = certification.id === "aws"
    ? "AWS hidden-unscored delivery"
    : certification.id === "aws-aip-c01"
      ? "AIP-C01 hidden-unscored delivery"
      : "Hidden-unscored delivery";
  if (!configuredDelivery) {
    if (!pinnedHiddenUnscored) return null;
    return {
      eligible: false,
      lockedReason: `${deliveryLabel} metadata is missing or invalid.`,
      questionIds: [],
      sections: [],
      checkpoints: [],
      deliveryKind: null,
      scoring: null,
    };
  }
  const profile = projectExamDeliveryProfile(certification);
  if (!profile) {
    const hiddenUnscored = configuredDelivery?.kind === "hidden-unscored" || pinnedHiddenUnscored;
    return {
      eligible: false,
      lockedReason: hiddenUnscored
        ? `${deliveryLabel} metadata does not match the configured exam total and aggregate scoring contract.`
        : configuredDelivery.kind === "fixed-sections-shared-timer"
        ? "Fixed shared-timer delivery metadata does not match the official exam totals and section contract."
        : "Ordered exam delivery metadata does not match the official exam totals and transition contract.",
      questionIds: [],
      sections: [],
      checkpoints: [],
      deliveryKind: configuredDelivery?.kind || null,
      scoring: null,
    };
  }

  const eligibleQuestions = (certification.questions || []).filter((question) => isEligibleFor(question, "exam"));
  if (profile.kind === "fixed-sections-shared-timer") {
    const inventory = validateStableQuestionInventory(eligibleQuestions);
    if (!inventory.valid) {
      return {
        eligible: false,
        lockedReason: "Fixed shared-timer eligible inventory is invalid: it contains a malformed or duplicate question ID.",
        questionIds: [],
        sections: [],
        checkpoints: [],
        deliveryKind: profile.kind,
        scoring: null,
      };
    }
  }
  if (profile.kind === "hidden-unscored") {
    const inventory = validateStableQuestionInventory(eligibleQuestions);
    if (!inventory.valid) {
      return {
        eligible: false,
        lockedReason: `${deliveryLabel} eligible inventory is invalid: it contains a malformed or duplicate question ID.`,
        questionIds: [],
        sections: [],
        checkpoints: [],
        deliveryKind: profile.kind,
        scoring: null,
      };
    }
    if (inventory.itemCount < profile.presentedQuestionCount) {
      return {
        eligible: false,
        lockedReason: `${deliveryLabel} requires ${profile.presentedQuestionCount} unique exam-eligible questions; found ${inventory.itemCount}.`,
        questionIds: [],
        sections: [],
        checkpoints: [],
        deliveryKind: profile.kind,
        scoring: null,
      };
    }
    return {
      eligible: true,
      lockedReason: null,
      questionIds: shuffleItems(eligibleQuestions, random)
        .slice(0, profile.presentedQuestionCount)
        .map((question) => question.id),
      sections: [],
      checkpoints: [],
      deliveryKind: profile.kind,
      scoring: {
        practiceScoredQuestionCount: profile.presentedQuestionCount,
        officialScoredQuestionCount: profile.scoredQuestionCount,
        officialUnscoredQuestionCount: profile.unscoredQuestionCount,
        officialUnscoredIdentity: profile.unscoredIdentity,
      },
    };
  }
  const selectedIds = new Set();
  const sections = [];
  const deficiencies = [];
  for (const section of profile.sections) {
    const candidates = eligibleQuestions.filter((question) => (
      !selectedIds.has(question.id)
      && section.selector.questionSectionIds.includes(question.sectionId)
    ));
    if (candidates.length < section.questionCount) {
      deficiencies.push(`${section.id} requires ${section.questionCount} explicitly mapped questions; found ${candidates.length}`);
      continue;
    }
    const questionIds = shuffleItems(candidates, random).slice(0, section.questionCount).map((question) => question.id);
    questionIds.forEach((id) => selectedIds.add(id));
    sections.push({
      id: section.id,
      label: section.label,
      interaction: section.interaction,
      questionCount: section.questionCount,
      durationMinutes: section.durationMinutes,
      questionIds,
    });
  }
  if (deficiencies.length) {
    const sectionContract = profile.kind === "fixed-sections-shared-timer"
      ? "Fixed shared-timer exam sections"
      : "Ordered exam sections";
    return {
      eligible: false,
      lockedReason: `${sectionContract} are incomplete: ${deficiencies.join("; ")}.`,
      questionIds: [],
      sections: [],
      checkpoints: [],
      deliveryKind: profile.kind,
    };
  }

  const offsets = new Map();
  let offset = 0;
  for (const section of sections) {
    offset += section.questionCount;
    offsets.set(section.id, offset);
  }
  const checkpoints = (profile.transitions || []).map((transition) => {
    const nextSection = sections.find((section) => section.id === transition.beforeSectionId);
    return {
      id: transition.id,
      title: `Optional break before ${nextSection.label}`,
      afterQuestion: offsets.get(transition.afterSectionId),
      kind: transition.kind,
      maximumMinutes: transition.maximumMinutes,
      onExpiry: transition.onExpiry,
      nextSectionId: nextSection.id,
      nextSectionLabel: nextSection.label,
      nextSectionDurationMinutes: nextSection.durationMinutes,
    };
  });
  return {
    eligible: true,
    lockedReason: null,
    questionIds: sections.flatMap((section) => section.questionIds),
    sections,
    checkpoints,
    deliveryKind: profile.kind,
  };
}

function toeicFullMockSelection(certification) {
  if (certification.id !== "toeic") return null;
  return {
    eligible: false,
    reasonCode: "reading-practice-only",
    lockedReason: "TOEIC is published as Reading Parts 5–7 practice, not an exam simulation.",
    questionIds: [],
    sections: [],
  };
}

export function createPmpDeliveryRehearsalPlan(certification, random = Math.random) {
  const readiness = projectPmpReadiness(certification);
  if (!readiness.valid) {
    return {
      id: "pmp-delivery-rehearsal",
      title: "Partial delivery rehearsal",
      mode: "exam",
      strategy: "delivery-rehearsal",
      eligible: false,
      fullMockEvidenceEligible: false,
      reasonCode: readiness.reasonCode,
      lockedReason: readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: 240,
      segments: [],
      checkpoints: [],
      scoring: null,
    };
  }
  const questionIds = shuffleItems(readiness.eligibleQuestions, random).map((question) => question.id);
  let offset = 0;
  const segments = readiness.delivery.segments.map((segment) => {
    const segmentQuestionIds = questionIds.slice(offset, offset + segment.questionCount);
    offset += segment.questionCount;
    return { ...segment, questionIds: segmentQuestionIds };
  });
  const checkpoints = readiness.delivery.checkpoints.map((checkpoint, index) => ({
    ...checkpoint,
    title: `Review and break after question ${checkpoint.afterQuestion}`,
    nextSegmentId: checkpoint.beforeSegmentId,
    nextSegmentLabel: segments[index + 1].label,
  }));
  return {
    id: "pmp-delivery-rehearsal",
    title: "Partial delivery rehearsal",
    mode: "exam",
    strategy: "delivery-rehearsal",
    eligible: true,
    fullMockEvidenceEligible: false,
    reasonCode: null,
    lockedReason: null,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes: readiness.delivery.durationMinutes,
    deliveryKind: readiness.delivery.kind,
    segments,
    checkpoints,
    scoring: {
      practiceScoredQuestionCount: readiness.delivery.scoring.presentedQuestionCount,
      officialScoredQuestionCount: readiness.delivery.scoring.scoredQuestionCount,
      officialUnscoredQuestionCount: readiness.delivery.scoring.unscoredQuestionCount,
      officialUnscoredIdentity: readiness.delivery.scoring.unscoredIdentity,
    },
  };
}

export function createExamQuestionIds(certification, random = Math.random) {
  if (certification.id === "jlpt") return [];
  if (certification.id === "bjt") return [];
  if (certification.id === "hsk-3-0") return [];
  if (certification.id === "pmp") return [];
  if (isBokiCertificationId(certification.id)) return [];
  if (["fp2", "fp3"].includes(certification.id)) return [];
  if (isPinnedIpaCertificationId(certification.id)) return [];
  const toeicSelection = toeicFullMockSelection(certification, random);
  if (toeicSelection) return toeicSelection.eligible ? toeicSelection.questionIds : [];
  const deliverySelection = deliveryProfileSelection(certification, random);
  if (deliverySelection) return deliverySelection.eligible ? deliverySelection.questionIds : [];
  const blueprintSelection = blueprintSimulationSelection(certification, random);
  if (blueprintSelection) return blueprintSelection.eligible ? blueprintSelection.questionIds : [];
  const questions = (certification.questions || [])
    .filter((question) => isEligibleFor(question, "exam"));
  const requestedCount = Number.isInteger(certification.count) && certification.count > 0
    ? certification.count
    : questions.length;
  return shuffleItems(questions, random)
    .slice(0, Math.min(requestedCount, questions.length))
    .map((question) => question.id);
}

function configuredBreakCount(certification) {
  const explicit = certification.breakCount ?? certification.exam?.breakCount;
  if (Number.isInteger(explicit) && explicit >= 0) return explicit;
  const format = typeof certification.exam === "object"
    ? certification.exam?.format
    : certification.exam;
  const description = [format, certification.format, certification.code].filter(Boolean).join(" ");
  const numericMatch = description.match(/(\d+)\s*(?:回の休憩|breaks?)/iu);
  if (numericMatch) return Number(numericMatch[1]);
  if (/\btwo breaks?\b/iu.test(description)) return 2;
  if (/\bone break\b/iu.test(description)) return 1;
  return 0;
}

export function createBreakAwareExamPlan(certification, random = Math.random) {
  const eligibleQuestions = (Array.isArray(certification.questions) ? certification.questions : [])
    .filter((question) => isEligibleFor(question, "exam"));
  const breakCount = configuredBreakCount(certification);
  const durationMinutes = Number(certification.duration ?? certification.exam?.durationMinutes);
  if (certification.id === "jlpt") {
    const readiness = projectJlptDeliveryReadiness(certification);
    return {
      id: "jlpt-full-exam",
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMock.reasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMock.lockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  if (certification.id === "bjt") {
    const readiness = projectBjtReadiness(certification);
    return {
      id: "bjt-exam-unavailable",
      title: "BJT Exam unavailable",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  if (certification.id === "hsk-3-0") {
    const readiness = projectHskReadiness(certification);
    return {
      id: "hsk-3-0-exam-unavailable", title: "HSK Exam unavailable", mode: "exam", strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [], questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [], sections: [],
    };
  }
  if (certification.id === "pmp") {
    const readiness = projectPmpReadiness(certification);
    return {
      id: "pmp-full-exam",
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  if (isBokiCertificationId(certification.id)) {
    const readiness = projectBokiReadiness(certification);
    return {
      id: `${certification.id}-full-exam`,
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  if (certification.id === "fp3") return {id:"fp3-full-exam",title:"Separate released-paper review",mode:"exam",strategy:"full-exam",eligible:false,reasonCode:"fp3-separate-released-papers",lockedReason:"FP3 academic and practical papers use separate timers and scores. Use the reviewed released-paper sessions.",questionIds:[],questionCount:0,durationMinutes:0,checkpoints:[],sections:[]};
  if (certification.id === "fp2") {
    const readiness = projectFp2Readiness(certification);
    return {
      id: "fp2-full-exam",
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  if (isPinnedIpaCertificationId(certification.id)) {
    const readiness = projectIpaReadiness(certification);
    return {
      id: `${certification.id}-full-exam`,
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  const toeicSelection = toeicFullMockSelection(certification, random);
  if (toeicSelection && !toeicSelection.eligible) {
    return {
      id: "toeic-full-exam",
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      lockedReason: toeicSelection.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
    };
  }
  const deliverySelection = deliveryProfileSelection(certification, random);
  if (deliverySelection && !deliverySelection.eligible) {
    return {
      id: `${certification.id || "certification"}-full-exam`,
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      lockedReason: deliverySelection.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      sections: [],
      deliveryKind: deliverySelection.deliveryKind || null,
      scoring: null,
    };
  }
  const blueprintSelection = blueprintSimulationSelection(certification, random);
  if (blueprintSelection && !blueprintSelection.eligible) {
    return {
      id: `${certification.id || "certification"}-full-exam`,
      title: "Full exam simulation",
      mode: "exam",
      strategy: "full-exam",
      eligible: false,
      lockedReason: blueprintSelection.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      checkpoints: [],
      simulationKind: certification.examSimulation?.kind || null,
      scenarioIds: [],
    };
  }
  const questionIds = toeicSelection?.questionIds || deliverySelection?.questionIds || blueprintSelection?.questionIds || createExamQuestionIds(certification, random);
  const checkpoints = deliverySelection?.checkpoints || Array.from({ length: breakCount }, (_, index) => ({
    id: `break-${index + 1}`,
    title: `Break ${index + 1}`,
    afterQuestion: Math.floor((questionIds.length * (index + 1)) / (breakCount + 1)),
  })).filter((checkpoint) => checkpoint.afterQuestion > 0 && checkpoint.afterQuestion < questionIds.length);
  return {
    id: `${certification.id || "certification"}-full-exam`,
    title: "Full exam simulation",
    mode: "exam",
    strategy: "full-exam",
    eligible: true,
    lockedReason: null,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes: Math.max(1, durationMinutes || questionIds.length || 1),
    checkpoints,
    sections: toeicSelection?.sections || deliverySelection?.sections || [],
    deliveryKind: deliverySelection?.deliveryKind || null,
    scoring: deliverySelection?.scoring || null,
    simulationKind: blueprintSelection ? certification.examSimulation.kind : null,
    scenarioIds: blueprintSelection?.scenarioIds || [],
  };
}

export function createExamCheckpointState(
  plan,
  completedQuestionCount = 0,
  completedCheckpointIds = [],
) {
  const checkpoints = plan?.checkpoints || [];
  const questionCount = Math.max(0, plan?.questionCount || plan?.questionIds?.length || 0);
  const completed = Math.min(questionCount, Math.max(0, Math.floor(completedQuestionCount)));
  const validIds = new Set(checkpoints.map((checkpoint) => checkpoint.id));
  const completedIds = [...new Set(completedCheckpointIds)]
    .filter((id) => validIds.has(id) && checkpoints.find((checkpoint) => checkpoint.id === id).afterQuestion <= completed);
  const completedSet = new Set(completedIds);
  const dueCheckpoint = checkpoints.find((checkpoint) => (
    checkpoint.afterQuestion <= completed && !completedSet.has(checkpoint.id)
  )) || null;
  const nextCheckpoint = dueCheckpoint || checkpoints.find((checkpoint) => (
    checkpoint.afterQuestion > completed && !completedSet.has(checkpoint.id)
  )) || null;
  const currentSegment = Math.min(checkpoints.length + 1, completedIds.length + 1);
  return {
    completedQuestionCount: completed,
    completedCheckpointIds: completedIds,
    dueCheckpoint,
    nextCheckpoint,
    currentSegment,
    remainingInSegment: dueCheckpoint
      ? 0
      : Math.max(0, (nextCheckpoint?.afterQuestion ?? questionCount) - completed),
    canContinue: dueCheckpoint === null,
  };
}

export function usesOrderedSectionTiming(plan = {}) {
  if (plan?.deliveryKind) return plan.deliveryKind === "ordered-sections";
  return Boolean(plan?.sections?.length && plan?.checkpoints?.length);
}

export function usesIrreversibleSegmentNavigation(plan = {}) {
  return plan?.deliveryKind === "segmented-shared-timer"
    && Array.isArray(plan.segments)
    && plan.segments.length > 0;
}

export function examCheckpointAutomaticallyContinues(checkpoint) {
  if (!Number.isInteger(checkpoint?.maximumMinutes) || checkpoint.maximumMinutes <= 0) return false;
  return checkpoint.kind === "irreversible-review-break"
    || (checkpoint.kind === "optional-break" && checkpoint.onExpiry === "start-next-section");
}

export function examCheckpointAutoTransitionDue(checkpoint, startedAt, now = Date.now()) {
  if (!examCheckpointAutomaticallyContinues(checkpoint)) return false;
  const startedAtMs = Date.parse(startedAt || "");
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) return false;
  return nowMs - startedAtMs >= checkpoint.maximumMinutes * 60 * 1000;
}

export function createExamSectionTransition(plan, checkpointId, trigger, now = new Date().toISOString()) {
  const checkpoint = plan?.checkpoints?.find((candidate) => candidate.id === checkpointId);
  if (usesIrreversibleSegmentNavigation(plan)) {
    const nextSegment = plan.segments.find((segment) => segment.id === checkpoint?.nextSegmentId);
    if (
      checkpoint?.kind !== "irreversible-review-break"
      || !nextSegment
      || !["manual", "automatic"].includes(trigger)
    ) return null;
    return {
      checkpointId,
      nextQuestionIndex: plan.segments
        .slice(0, plan.segments.indexOf(nextSegment))
        .reduce((sum, segment) => sum + segment.questionCount, 0),
      nextSegmentId: nextSegment.id,
      sectionStartedAt: now,
      trigger,
      retainsSharedTimer: true,
    };
  }
  const nextSection = plan?.sections?.find((section) => section.id === checkpoint?.nextSectionId);
  if (!checkpoint || !nextSection || !["manual", "automatic"].includes(trigger)) return null;
  const nextQuestionIndex = plan.sections
    .slice(0, plan.sections.indexOf(nextSection))
    .reduce((sum, section) => sum + section.questionCount, 0);
  return {
    checkpointId,
    nextQuestionIndex,
    nextSectionId: nextSection.id,
    seconds: nextSection.durationMinutes * 60,
    sectionStartedAt: now,
    trigger,
  };
}

export function createOrderedExamTransitionState(
  plan,
  checkpointId,
  trigger,
  pauseState = {},
  now = new Date().toISOString(),
) {
  const transition = createExamSectionTransition(plan, checkpointId, trigger, now);
  const questionStartedAt = Date.parse(transition?.sectionStartedAt || "");
  if (!transition || !Number.isFinite(questionStartedAt)) return null;
  const checkpoint = plan?.checkpoints?.find((candidate) => candidate.id === checkpointId);
  const pausedAt = Date.parse(pauseState?.pausedAt || "");
  const maximumPauseMs = checkpoint?.maximumMinutes * 60 * 1000;
  const pauseCompletedAt = transition.retainsSharedTimer
    && checkpoint?.kind === "irreversible-review-break"
    && Number.isFinite(pausedAt)
    && Number.isFinite(maximumPauseMs)
    && maximumPauseMs > 0
    ? Math.min(questionStartedAt, pausedAt + maximumPauseMs)
    : questionStartedAt;
  return {
    ...transition,
    answerLoad: { state: "idle", message: "" },
    selected: [],
    answerCommitted: false,
    result: null,
    hintRevealed: false,
    hintUsed: false,
    confidence: null,
    reviewRating: null,
    questionStartedAt,
    pauseState: updateSessionPause(pauseState, false, pauseCompletedAt),
  };
}

export function examQuestionNavigationBoundary(plan, completedCheckpointIds = []) {
  if (usesIrreversibleSegmentNavigation(plan)) {
    const completed = new Set(completedCheckpointIds);
    const segmentIndex = Math.min(
      (plan.checkpoints || []).filter((checkpoint) => completed.has(checkpoint.id)).length,
      plan.segments.length - 1,
    );
    const startIndex = plan.segments.slice(0, segmentIndex)
      .reduce((sum, segment) => sum + segment.questionCount, 0);
    return { startIndex, endIndex: startIndex + plan.segments[segmentIndex].questionCount - 1 };
  }
  const sections = plan?.sections || [];
  if (!sections.length || !usesOrderedSectionTiming(plan)) {
    return { startIndex: 0, endIndex: Math.max(0, (plan?.questionIds?.length || 1) - 1) };
  }
  const completed = new Set(completedCheckpointIds);
  const sectionIndex = Math.min(
    (plan?.checkpoints || []).filter((checkpoint) => completed.has(checkpoint.id)).length,
    sections.length - 1,
  );
  const startIndex = sections.slice(0, sectionIndex).reduce((sum, section) => sum + section.questionCount, 0);
  return { startIndex, endIndex: startIndex + sections[sectionIndex].questionCount - 1 };
}

export function examSectionTimeLimitSeconds(plan, completedCheckpointIds = []) {
  const sections = plan?.sections || [];
  if (!sections.length || !usesOrderedSectionTiming(plan)) return null;
  const boundary = examQuestionNavigationBoundary(plan, completedCheckpointIds);
  const section = sections.find((candidate) => {
    const startIndex = sections.slice(0, sections.indexOf(candidate))
      .reduce((sum, item) => sum + item.questionCount, 0);
    return startIndex === boundary.startIndex;
  });
  return Number.isInteger(section?.durationMinutes) && section.durationMinutes > 0
    ? section.durationMinutes * 60
    : null;
}

export function nextExamQuestionIndex(questions = [], currentIndex = 0, sessionResults = {}, boundary = {}) {
  const startIndex = Math.max(0, boundary.startIndex ?? 0);
  const endIndex = Math.min(questions.length - 1, boundary.endIndex ?? questions.length - 1);
  if (endIndex < startIndex) return -1;
  const indexes = [
    ...Array.from({ length: Math.max(0, endIndex - currentIndex) }, (_, index) => currentIndex + index + 1),
    ...Array.from({ length: Math.max(0, currentIndex - startIndex) }, (_, index) => startIndex + index),
  ];
  return indexes.find((index) => questions[index]?.id && !sessionResults[questions[index].id]) ?? -1;
}

export function examQuestionNavigationReviewRating(certification = {}, practice = {}, learningRecord = {}) {
  return certification?.id === "jlpt" && isValidJlptStrictAssistancePolicy(practice?.assistancePolicy)
    ? null
    : learningRecord?.lastRating || null;
}

export function closeTimedOutExamSection(section = {}, sessionResults = {}) {
  const closed = { ...sessionResults };
  for (const questionId of section.questionIds || []) {
    if (closed[questionId]) continue;
    closed[questionId] = {
      answer: [],
      outcome: "timeout",
      responseTimeMs: 0,
      hintUsed: false,
      confidence: null,
      section: section.label || section.id || "Exam section",
    };
  }
  return closed;
}

export function createJlptSectionRehearsalPlan(certification) {
  const readiness = projectJlptDeliveryReadiness(certification);
  if (!readiness?.valid) {
    return {
      id: "jlpt-language-reading-2026-07-rehearsal",
      title: "Language Knowledge + Reading section rehearsal",
      mode: "exam",
      strategy: "timed-section",
      eligible: false,
      reasonCode: readiness?.reasonCode || "delivery-contract-invalid",
      lockedReason: readiness?.lockedReason || "JLPT rehearsal contract is invalid.",
      questionIds: [],
      questionCount: 0,
      durationMinutes: 110,
      formatFaithful: false,
      evidenceEligible: false,
      evidenceKind: "section-rehearsal",
      fullMockEvidenceEligible: false,
      timedFullExamEvidenceEligible: false,
      sections: [],
      checkpoints: [],
    };
  }
  const questionIds = [...readiness.rehearsal.questionIds];
  return {
    id: readiness.rehearsal.id,
    title: "Language Knowledge + Reading section rehearsal",
    mode: "exam",
    strategy: "timed-section",
    eligible: true,
    reasonCode: null,
    lockedReason: null,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes: readiness.rehearsal.durationMinutes,
    formatFaithful: false,
    evidenceEligible: true,
    evidenceKind: readiness.rehearsal.evidenceKind,
    fullMockEvidenceEligible: false,
    timedFullExamEvidenceEligible: false,
    rehearsalId: readiness.rehearsal.id,
    membershipDigest: readiness.rehearsal.membershipDigest,
    membershipOrderDigest: readiness.rehearsal.membershipOrderDigest,
    assistancePolicy: readiness.rehearsal.assistancePolicy,
    sections: [{
      id: readiness.rehearsal.sectionId,
      label: "Language Knowledge + Reading",
      questionCount: questionIds.length,
      durationMinutes: readiness.rehearsal.durationMinutes,
      questionIds,
    }],
    checkpoints: [],
    sourceCounts: { timed: questionIds.length },
  };
}

export function createTimedSectionPlan(
  certification,
  progress = {},
  options = {},
) {
  if (certification.id === "jlpt") return createJlptSectionRehearsalPlan(certification);
  if (certification.id === "hsk-3-0") {
    const readiness = projectHskReadiness(certification);
    return {
      id: "hsk-3-0-timed-unavailable", title: "HSK timed Exam unavailable", mode: "exam", strategy: "timed-section",
      eligible: false, evidenceEligible: false,
      reasonCode: readiness.valid ? readiness.timedSectionReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.timedSectionLockedReason : readiness.lockedReason,
      questionIds: [], questionCount: 0, durationMinutes: 0, formatFaithful: false,
      sourceCounts: { timed: 0 }, progressSnapshotSize: Object.keys(progress.answers || {}).length,
    };
  }
  if (certification.id === "bjt") {
    const readiness = projectBjtReadiness(certification);
    return {
      id: "bjt-timed-unavailable",
      title: "BJT timed Exam unavailable",
      mode: "exam",
      strategy: "timed-section",
      eligible: false,
      evidenceEligible: false,
      reasonCode: readiness.valid ? readiness.timedSectionReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.timedSectionLockedReason : readiness.lockedReason,
      questionIds: [],
      questionCount: 0,
      durationMinutes: 0,
      formatFaithful: false,
      sourceCounts: { timed: 0 },
      progressSnapshotSize: Object.keys(progress.answers || {}).length,
    };
  }
  if (certification.id === "fp3") return {id:"fp3-generic-timed-disabled",title:"Use separate released-paper review",mode:"exam",strategy:"timed-section",eligible:false,evidenceEligible:false,reasonCode:"fp3-separate-released-papers",questionIds:[],questionCount:0,durationMinutes:0};
  let bokiReadiness = null;
  let fp2Readiness = null;
  let ipaReadiness = null;
  if (isBokiCertificationId(certification.id)) {
    bokiReadiness = projectBokiReadiness(certification);
    if (!bokiReadiness.valid || !bokiReadiness.selectableTimedSectionAvailable) {
      return {
        id: "timed-section-mixed",
        title: "Selectable bank rehearsal",
        mode: "exam",
        strategy: "timed-section",
        eligible: false,
        reasonCode: bokiReadiness.valid ? bokiReadiness.timedSectionReasonCode : bokiReadiness.reasonCode,
        lockedReason: bokiReadiness.valid ? bokiReadiness.timedSectionLockedReason : bokiReadiness.lockedReason,
        domainName: options.domainName || null,
        questionIds: [],
        questionCount: 0,
        durationMinutes: 0,
        formatFaithful: false,
        sourceCounts: { timed: 0 },
        progressSnapshotSize: Object.keys(progress.answers || {}).length,
      };
    }
  }
  if (certification.id === "fp2") {
    fp2Readiness = projectFp2Readiness(certification);
    return {
      id: "timed-section-mixed",
      title: "FP2 Academic practice",
      mode: "exam",
      strategy: "timed-section",
      eligible: false,
      reasonCode: fp2Readiness.valid ? "academic-practice-only" : fp2Readiness.reasonCode,
      lockedReason: fp2Readiness.valid ? "FP2 uses per-question practice timing; timed exam sections are unavailable." : fp2Readiness.lockedReason,
      domainName: options.domainName || null,
      questionIds: [],
      questionCount: 0,
      durationMinutes: 0,
      formatFaithful: false,
      sourceCounts: { timed: 0 },
      progressSnapshotSize: Object.keys(progress.answers || {}).length,
    };
  }
  if (isPinnedIpaCertificationId(certification.id)) {
    ipaReadiness = projectIpaReadiness(certification);
    if (!ipaReadiness.valid || !ipaReadiness.readinessDimensions.subjectA.timedAvailable) {
      return {
        id: "timed-section-mixed",
        title: certification.id === "ap" ? "Subject A archive drill" : "Subject A-2 selectable timed section",
        mode: "exam",
        strategy: "timed-section",
        eligible: false,
        reasonCode: ipaReadiness.valid ? ipaReadiness.timedReasonCode : ipaReadiness.reasonCode,
        lockedReason: ipaReadiness.valid ? ipaReadiness.timedLockedReason : ipaReadiness.lockedReason,
        domainName: options.domainName || null,
        questionIds: [],
        questionCount: 0,
        durationMinutes: 0,
        formatFaithful: false,
        sourceCounts: { timed: 0 },
        progressSnapshotSize: Object.keys(progress.answers || {}).length,
      };
    }
  }
  const random = typeof options.random === "function" ? options.random : Math.random;
  const eligible = (certification.questions || []).filter((question) => isEligibleFor(question, "exam"));
  const requestedCount = bokiReadiness?.selectableTimedSection?.questionCount
    ?? (Number.isInteger(options.questionCount) && options.questionCount > 0
      ? options.questionCount
      : Math.min(25, Math.max(10, Math.ceil((certification.count || eligible.length) * 0.2))));
  const domainName = options.domainName || null;
  const blueprintDomain = domainName ? blueprintDomainForSection(certification, domainName) : null;
  const belongsToDomain = (question) => {
    if (!domainName) return true;
    if (!blueprintDomain) return question.section === domainName;
    return blueprintDomainForSection(certification, question.section)?.name === blueprintDomain.name;
  };
  const domainQuestions = domainName
    ? eligible.filter(belongsToDomain)
    : eligible;
  const fallbackQuestions = domainName
    ? eligible.filter((question) => !belongsToDomain(question))
    : [];
  const questionIds = [
    ...shuffleItems(domainQuestions, random),
    ...shuffleItems(fallbackQuestions, random),
  ].slice(0, Math.min(requestedCount, eligible.length)).map((question) => question.id);
  const officialCount = Math.max(1, certification.count || eligible.length || 1);
  const officialDuration = Math.max(1, Number(certification.duration) || officialCount);
  const durationMinutes = bokiReadiness?.selectableTimedSection?.durationMinutes
    ?? (Number.isFinite(options.durationMinutes)
      ? Math.max(1, Math.round(options.durationMinutes))
      : Math.max(5, Math.round((officialDuration * questionIds.length) / officialCount)));
  const bokiSelectableRehearsal = isBokiCertificationId(certification.id);
  const fp2AcademicSection = certification.id === "fp2";
  const ipaSubjectASection = isPinnedIpaCertificationId(certification.id);
  return {
    id: `timed-section-${domainName || "mixed"}`,
    title: bokiSelectableRehearsal
      ? "Selectable bank rehearsal"
      : fp2AcademicSection
        ? "Academic selectable timed section"
        : ipaSubjectASection
          ? "Subject A-2 selectable timed section"
          : domainName ? `${domainName} timed section` : "Mixed timed section",
    mode: "exam",
    strategy: "timed-section",
    domainName,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes,
    eligible: true,
    ...(bokiSelectableRehearsal ? {
      formatFaithful: false,
      evidenceEligible: false,
      evidenceKind: "selectable-rehearsal",
    } : {}),
    ...(fp2AcademicSection ? {
      formatFaithful: false,
      evidenceEligible: true,
      evidenceKind: "selectable-academic",
      practicalFormatEvidenceEligible: false,
    } : {}),
    ...(ipaSubjectASection ? {
      formatFaithful: false,
      evidenceEligible: true,
      evidenceKind: "subject-a-selectable",
      subjectBFormatEvidenceEligible: false,
    } : {}),
    sourceCounts: { timed: questionIds.length },
    progressSnapshotSize: Object.keys(progress.answers || {}).length,
  };
}

function isObjectiveStudyQuestion(question) {
  return question.type !== "written_response" && question.ipaResponseFormat !== "written";
}

function weakSections(certification, answers) {
  const totals = new Map();
  for (const question of certification.questions || []) {
    if (!isObjectiveStudyQuestion(question)) continue;
    const current = totals.get(question.section) || { answered: 0, correct: 0 };
    if (Object.prototype.hasOwnProperty.call(answers, question.id)) {
      current.answered += 1;
      if (answersMatch(answers[question.id], question.answer)) current.correct += 1;
    }
    totals.set(question.section, current);
  }
  return [...totals.entries()]
    .filter(([, value]) => value.answered > 0)
    .sort((left, right) => (
      left[1].correct / left[1].answered - right[1].correct / right[1].answered
    ))
    .map(([section]) => section);
}

function normalizedDomainStem(value) {
  return String(value || "")
    .replace(/[·—-]?\s*\d+(?:\.\d+)?%.*$/u, "")
    .replace(/[・·—–-]+/gu, " ")
    .replace(/&/gu, "and")
    .trim()
    .toLocaleLowerCase();
}

export function blueprintDomainForSection(certification, section) {
  const sectionStem = normalizedDomainStem(section);
  return certification.blueprint?.domains?.find((domain) => (
    [domain.name, ...(domain.aliases || [])].some((alias) => {
      const aliasStem = normalizedDomainStem(alias);
      return sectionStem === aliasStem
        || sectionStem.includes(aliasStem)
        || aliasStem.includes(sectionStem);
    })
  )) || null;
}

export function domainWeightPercent(certification, section) {
  const blueprintDomain = blueprintDomainForSection(certification, section);
  if (blueprintDomain) {
    if (Number.isFinite(blueprintDomain.weightPercent)) return blueprintDomain.weightPercent;
    if (
      Number.isFinite(blueprintDomain.weightMinPercent)
      && Number.isFinite(blueprintDomain.weightMaxPercent)
    ) {
      return (blueprintDomain.weightMinPercent + blueprintDomain.weightMaxPercent) / 2;
    }
  }
  const sectionStem = normalizedDomainStem(section);
  const domainDetails = certification.domainDetails || certification.studyDomains || [];
  for (const domain of domainDetails) {
    if (Number.isFinite(domain.weightPercent) && domain.weightPercent > 0) {
      const domainStem = normalizedDomainStem(domain.name);
      if (sectionStem.includes(domainStem) || domainStem.includes(sectionStem)) return domain.weightPercent;
    }
    const match = String(domain.name || "").match(/(\d+(?:\.\d+)?)%/u);
    if (!match) continue;
    const domainStem = normalizedDomainStem(domain.name);
    if (sectionStem.includes(domainStem) || domainStem.includes(sectionStem)) return Number(match[1]);
  }
  const eligibleQuestions = (certification.questions || []).filter((question) => question.examEligible !== false);
  const sectionQuestionCount = eligibleQuestions.filter((question) => (
    normalizedDomainStem(question.section) === sectionStem
  )).length;
  if (eligibleQuestions.length && sectionQuestionCount) {
    return (sectionQuestionCount / eligibleQuestions.length) * 100;
  }
  const domainCount = Math.max(1, domainDetails.length || certification.domains?.length || 1);
  return 100 / domainCount;
}

function orderByExpectedGain(questions, certification, learning, random) {
  return questions
    .map((question) => {
      const averageMinutes = Math.max(0.5, (learning[question.id]?.averageTimeMs || 90_000) / 60_000);
      return {
        question,
        score: domainWeightPercent(certification, question.section) / averageMinutes,
        tie: random(),
      };
    })
    .sort((left, right) => right.score - left.score || left.tie - right.tie)
    .map(({ question }) => question);
}

function diversifyQuestionEntries(entries, limit) {
  if (entries.length < 3 || limit < 3) return entries;
  const selected = [];
  const remaining = [...entries];
  const firstSection = remaining[0]?.question.section;
  while (remaining.length && selected.length < limit) {
    if (selected.length === 1) {
      const alternateIndex = remaining.findIndex((entry) => entry.question.section !== firstSection);
      if (alternateIndex >= 0) {
        selected.push(remaining.splice(alternateIndex, 1)[0]);
        continue;
      }
    }
    selected.push(remaining.shift());
  }
  return [...selected, ...remaining];
}

export function incorrectQuestionIds(certification, progress = {}) {
  const answers = progress.answers || {};
  return (certification.questions || [])
    .filter((question) => (
      Object.prototype.hasOwnProperty.call(answers, question.id)
      && isObjectiveStudyQuestion(question)
      && !answersMatch(answers[question.id], question.answer)
    ))
    .map((question) => question.id);
}

function prioritizedQuestionEntries(
  certification,
  progress,
  practiceSet,
  random = Math.random,
  now = new Date(),
) {
  const requiredTags = practiceSet.questionTags || [];
  const scopedQuestions = (certification.questions || []).filter((question) => (
    requiredTags.every((tag) => question.tags?.includes(tag))
  ));
  const questions = practiceSet.strategy === "full-exam" || practiceSet.sessionMode === "exam"
    ? scopedQuestions.filter((question) => isEligibleFor(question, "exam"))
    : scopedQuestions;
  const answers = progress?.answers || {};
  const reviewedIds = new Set(progress?.reviewed || []);
  let candidates = [];

  if (practiceSet.strategy === "weak-domain" || practiceSet.strategy === "smart-review") {
    const learning = progress?.learning || {};
    const due = questions.filter((question) => isReviewDue(learning[question.id], now));
    const incorrect = questions.filter((question) => (
      Object.prototype.hasOwnProperty.call(answers, question.id)
      && isObjectiveStudyQuestion(question)
      && !answersMatch(answers[question.id], question.answer)
    ));
    const overconfident = incorrect.filter((question) => learning[question.id]?.lastConfidence === "confident");
    const regularIncorrect = incorrect.filter((question) => learning[question.id]?.lastConfidence !== "confident");
    const reviewed = questions.filter((question) => reviewedIds.has(question.id));
    const weakSectionNames = weakSections(certification, answers);
    const weakestSections = new Set(weakSectionNames.slice(0, Math.max(1, Math.ceil(weakSectionNames.length / 3))));
    const weak = questions.filter((question) => (
      weakestSections.has(question.section) && !isMasteredRecord(learning[question.id], now)
    ));
    const unanswered = questions.filter((question) => answers[question.id] === undefined);
    const remaining = questions.filter((question) => (
      answers[question.id] !== undefined && !isMasteredRecord(learning[question.id], now)
    ));
    candidates = [
      ...shuffleItems(due, random).map((question) => ({ question, source: "due" })),
      ...orderByExpectedGain(overconfident, certification, learning, random).map((question) => ({ question, source: "overconfident" })),
      ...orderByExpectedGain(regularIncorrect, certification, learning, random).map((question) => ({ question, source: "incorrect" })),
      ...shuffleItems(reviewed, random).map((question) => ({ question, source: "marked" })),
      ...orderByExpectedGain(weak, certification, learning, random).map((question) => ({ question, source: "weak" })),
      ...orderByExpectedGain(unanswered, certification, learning, random).map((question) => ({ question, source: "new" })),
      ...orderByExpectedGain(remaining, certification, learning, random).map((question) => ({ question, source: "revisit" })),
    ];
  } else if (practiceSet.strategy === "retry-incorrect") {
    const incorrectIds = new Set(incorrectQuestionIds(certification, progress));
    candidates = shuffleItems(
      questions.filter((question) => incorrectIds.has(question.id)),
      random,
    ).map((question) => ({ question, source: "incorrect" }));
  } else {
    candidates = shuffleItems(questions, random)
      .map((question) => ({ question, source: "mixed" }));
  }

  const uniqueEntries = [];
  const seen = new Set();
  for (const entry of candidates) {
    if (seen.has(entry.question.id)) continue;
    seen.add(entry.question.id);
    uniqueEntries.push(entry);
  }
  const questionCount = Math.min(practiceSet.questionCount, uniqueEntries.length);
  return diversifyQuestionEntries(uniqueEntries, questionCount).slice(0, questionCount);
}

export function createPracticePlan(
  certification,
  progress,
  practiceSet,
  random = Math.random,
  now = new Date(),
) {
  const bjtExamLikeStrategy = certification.id === "bjt" && isBjtExamLikePractice(practiceSet);
  if (bjtExamLikeStrategy) {
    const readiness = projectBjtReadiness(certification);
    return {
      questionIds: [],
      sourceCounts: {},
      masteredSkipped: 0,
      eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
    };
  }
  if (certification.id === "hsk-3-0") {
    const readiness = projectHskReadiness(certification);
    return {
      questionIds: [], sourceCounts: {}, masteredSkipped: 0, eligible: false,
      reasonCode: readiness.valid ? readiness.fullMockReasonCode : readiness.reasonCode,
      lockedReason: readiness.valid ? readiness.fullMockLockedReason : readiness.lockedReason,
      evidenceEligible: false,
    };
  }
  const blueprintSelection = practiceSet.strategy === "full-exam" && !(practiceSet.questionTags || []).length
    ? blueprintSimulationSelection(certification, random)
    : null;
  if (blueprintSelection) {
    const masteredSkipped = (certification.questions || []).filter((question) => (
      isMasteredRecord(progress?.learning?.[question.id], now)
    )).length;
    return {
      questionIds: blueprintSelection.eligible ? blueprintSelection.questionIds : [],
      sourceCounts: blueprintSelection.eligible ? { blueprint: blueprintSelection.questionIds.length } : {},
      masteredSkipped,
      scenarioIds: blueprintSelection.scenarioIds,
      simulationKind: certification.examSimulation.kind,
      eligible: blueprintSelection.eligible,
      lockedReason: blueprintSelection.lockedReason,
    };
  }
  const entries = prioritizedQuestionEntries(
    certification,
    progress,
    practiceSet,
    random,
    now,
  );
  const sourceCounts = entries.reduce((counts, entry) => ({
    ...counts,
    [entry.source]: (counts[entry.source] || 0) + 1,
  }), {});
  return {
    questionIds: entries.map((entry) => entry.question.id),
    sourceCounts,
    masteredSkipped: (certification.questions || []).filter((question) => (
      isMasteredRecord(progress?.learning?.[question.id], now)
    )).length,
  };
}

export function createPracticeQuestionIds(
  certification,
  progress,
  practiceSet,
  random = Math.random,
  now = new Date(),
) {
  return createPracticePlan(certification, progress, practiceSet, random, now).questionIds;
}

export function createReviewQueue(
  certification,
  progress = {},
  questionCount = 30,
  random = Math.random,
  now = new Date(),
) {
  const questions = certification.questions || [];
  const answers = progress.answers || {};
  const learning = progress.learning || {};
  const reviewedIds = new Set(progress.reviewed || []);
  const candidates = [
    ...shuffleItems(questions.filter((question) => isReviewDue(learning[question.id], now)), random)
      .map((question) => ({ question, source: "due" })),
    ...shuffleItems(questions.filter((question) => (
      Object.prototype.hasOwnProperty.call(answers, question.id)
      && isObjectiveStudyQuestion(question)
      && !answersMatch(answers[question.id], question.answer)
    )), random).map((question) => ({ question, source: "incorrect" })),
    ...shuffleItems(questions.filter((question) => reviewedIds.has(question.id)), random)
      .map((question) => ({ question, source: "marked" })),
  ];
  const seen = new Set();
  const entries = candidates.filter(({ question }) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  }).slice(0, questionCount);
  return {
    questionIds: entries.map(({ question }) => question.id),
    sourceCounts: entries.reduce((counts, entry) => ({
      ...counts,
      [entry.source]: (counts[entry.source] || 0) + 1,
    }), {}),
  };
}

export function createDomainQuestionIds(
  certification,
  progress,
  domainName,
  questionCount = 20,
  random = Math.random,
  now = new Date(),
) {
  const scopedCertification = {
    ...certification,
    questions: (certification.questions || []).filter((question) => question.section === domainName),
  };
  return createPracticeQuestionIds(
    scopedCertification,
    progress,
    {
      questionCount,
      strategy: "smart-review",
    },
    random,
    now,
  );
}

export function createStudyNowPlan(
  certification,
  progress = {},
  minutes = 10,
  random = Math.random,
  now = new Date(),
) {
  const questions = certification.questions || [];
  const questionCount = Math.min(
    questions.length,
    Math.max(1, Math.round(Math.max(5, Math.min(20, minutes)) / 1.5)),
  );
  const answers = progress.answers || {};
  const answeredCount = questions.filter((question) => (
    Object.prototype.hasOwnProperty.call(answers, question.id)
  )).length;

  if (answeredCount === 0) {
    const bySection = new Map();
    questions.forEach((question) => {
      const entries = bySection.get(question.section) || [];
      entries.push(question);
      bySection.set(question.section, entries);
    });
    const diagnostic = [];
    const queues = [...bySection.values()].map((entries) => shuffleItems(entries, random));
    while (diagnostic.length < questionCount && queues.some((queue) => queue.length)) {
      queues.forEach((queue) => {
        if (diagnostic.length < questionCount && queue.length) diagnostic.push(queue.shift());
      });
    }
    return {
      id: "study-now-diagnostic",
      mode: "study",
      stage: "diagnose",
      title: "Start with a quick diagnostic",
      rationale: `Sample ${diagnostic.length} question${diagnostic.length === 1 ? "" : "s"} across exam domains before building your plan.`,
      questionIds: diagnostic.map((question) => question.id),
      sourceCounts: { diagnostic: diagnostic.length },
      masteredSkipped: 0,
    };
  }

  const plan = createPracticePlan(
    certification,
    progress,
    { questionCount, strategy: "smart-review" },
    random,
    now,
  );
  if (!plan.questionIds.length) {
    return {
      id: "study-now-maintain",
      mode: "study",
      stage: "maintain",
      title: "You are caught up for now",
      rationale: "Mastered items stay paused until their next spaced review is due.",
      questionIds: [],
      sourceCounts: {},
      masteredSkipped: plan.masteredSkipped,
    };
  }
  const dueCount = plan.sourceCounts.due || 0;
  const recoveryCount = (plan.sourceCounts.incorrect || 0) + (plan.sourceCounts.weak || 0);
  const stage = dueCount ? "review" : recoveryCount ? "strengthen" : "advance";
  const title = dueCount
    ? `Review ${dueCount} due question${dueCount === 1 ? "" : "s"}`
    : recoveryCount
      ? "Strengthen your weakest evidence"
      : "Study the next exam concepts";
  const rationale = dueCount
    ? "Due reviews come first, followed by weak and unseen questions."
    : recoveryCount
      ? "Incorrect and weak-domain questions come before new material."
      : "Continue with unseen questions while keeping the session time-boxed.";
  return {
    id: `study-now-${stage}`,
    mode: "study",
    stage,
    title,
    rationale,
    questionIds: plan.questionIds,
    sourceCounts: plan.sourceCounts,
    masteredSkipped: plan.masteredSkipped,
  };
}
