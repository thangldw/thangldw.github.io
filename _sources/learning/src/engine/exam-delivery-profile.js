const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function integerInRange(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function uniqueIds(values) {
  return Array.isArray(values)
    && values.length > 0
    && values.every((value) => typeof value === "string" && ID_PATTERN.test(value))
    && new Set(values).size === values.length;
}

function exactKeys(value, keys) {
  return value && typeof value === "object"
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && Object.keys(value).every((key) => keys.includes(key));
}

function examTotals(certification) {
  const questionCount = certification?.count ?? certification?.exam?.questionCount;
  const durationMinutes = certification?.duration ?? certification?.exam?.durationMinutes;
  return { questionCount, durationMinutes };
}

function deliveryMetadata(certification) {
  return certification?.examDelivery ?? certification?.exam?.delivery ?? null;
}

function validOrderedSection(section) {
  return exactKeys(section, ["id", "label", "questionCount", "durationMinutes", "interaction", "selector"])
    && ID_PATTERN.test(section.id || "")
    && typeof section.label === "string"
    && section.label.length > 0
    && section.label.length <= 160
    && section.label.trim() === section.label
    && integerInRange(section.questionCount, 1, 5000)
    && integerInRange(section.durationMinutes, 1, 1440)
    && section.interaction === "selectable-response"
    && exactKeys(section.selector, ["questionSectionIds"])
    && uniqueIds(section.selector.questionSectionIds);
}

function validSharedTimerSection(section) {
  return exactKeys(section, ["id", "label", "questionCount", "interaction", "selector"])
    && ID_PATTERN.test(section.id || "")
    && typeof section.label === "string"
    && section.label.length > 0
    && section.label.length <= 160
    && section.label.trim() === section.label
    && integerInRange(section.questionCount, 1, 5000)
    && section.interaction === "selectable-response"
    && exactKeys(section.selector, ["questionSectionIds"])
    && uniqueIds(section.selector.questionSectionIds);
}

function validSharedTimerSegment(segment) {
  return exactKeys(segment, ["id", "label", "questionCount"])
    && ID_PATTERN.test(segment.id || "")
    && typeof segment.label === "string"
    && segment.label.length > 0
    && segment.label.length <= 160
    && segment.label.trim() === segment.label
    && integerInRange(segment.questionCount, 1, 5000);
}

function validAggregateScoring(scoring, questionCount) {
  return exactKeys(scoring, [
    "presentedQuestionCount",
    "scoredQuestionCount",
    "unscoredQuestionCount",
    "unscoredIdentity",
    "practiceScoring",
  ])
    && integerInRange(scoring.presentedQuestionCount, 1, 5000)
    && integerInRange(scoring.scoredQuestionCount, 1, 5000)
    && integerInRange(scoring.unscoredQuestionCount, 1, 5000)
    && scoring.presentedQuestionCount === questionCount
    && scoring.scoredQuestionCount + scoring.unscoredQuestionCount === questionCount
    && scoring.unscoredIdentity === "hidden"
    && scoring.practiceScoring === "all-presented";
}

function validFormatCapacity(capacity) {
  return exactKeys(capacity, [
    "singleChoice",
    "passageSingle",
    "multipleResponse",
    "ordering",
    "matching",
    "caseSetToolPracticum",
  ]) && Object.values(capacity).every((count) => integerInRange(count, 0, 5000));
}

function validIrreversibleCheckpoint(checkpoint, before, after, afterQuestion) {
  return exactKeys(checkpoint, [
    "id",
    "afterSegmentId",
    "beforeSegmentId",
    "afterQuestion",
    "kind",
    "maximumMinutes",
  ])
    && ID_PATTERN.test(checkpoint.id || "")
    && checkpoint.afterSegmentId === before.id
    && checkpoint.beforeSegmentId === after.id
    && checkpoint.afterQuestion === afterQuestion
    && checkpoint.kind === "irreversible-review-break"
    && integerInRange(checkpoint.maximumMinutes, 1, 120);
}

function validTransition(transition, before, after) {
  return exactKeys(transition, ["id", "afterSectionId", "beforeSectionId", "kind", "maximumMinutes", "onExpiry"])
    && ID_PATTERN.test(transition.id || "")
    && transition.afterSectionId === before.id
    && transition.beforeSectionId === after.id
    && transition.kind === "optional-break"
    && integerInRange(transition.maximumMinutes, 1, 120)
    && transition.onExpiry === "start-next-section";
}

export function projectExamDeliveryProfile(certification = {}) {
  const delivery = deliveryMetadata(certification);
  if (!delivery) return null;
  const { questionCount, durationMinutes } = examTotals(certification);
  if (!integerInRange(questionCount, 1, 5000) || !integerInRange(durationMinutes, 1, 1440)) return null;
  if (certification.id === "pmp" && delivery.kind !== "segmented-shared-timer") return null;
  const pinnedHiddenUnscored = {
    aws: { presented: 65, scored: 50, unscored: 15 },
    "aws-aip-c01": { presented: 75, scored: 65, unscored: 10 },
  }[certification.id];
  if (pinnedHiddenUnscored && (
    delivery.kind !== "hidden-unscored"
    || questionCount !== pinnedHiddenUnscored.presented
    || delivery.presentedQuestionCount !== pinnedHiddenUnscored.presented
    || delivery.scoredQuestionCount !== pinnedHiddenUnscored.scored
    || delivery.unscoredQuestionCount !== pinnedHiddenUnscored.unscored
  )) return null;

  if (certification.id === "jlpt") {
    if (delivery.kind !== "single-section-membership-gated") return null;
    if (!exactKeys(delivery, ["kind", "sections", "transitions"])) return null;
    const expectedSections = [["language-knowledge-reading", "Language Knowledge + Reading", 110]];
    if (durationMinutes !== 110) return null;
    if (!Array.isArray(delivery.sections) || delivery.sections.length !== 1) return null;
    if (!delivery.sections.every((section, index) => (
      exactKeys(section, ["id", "label", "durationMinutes"])
      && section.id === expectedSections[index][0]
      && section.label === expectedSections[index][1]
      && section.durationMinutes === expectedSections[index][2]
    ))) return null;
    if (!Array.isArray(delivery.transitions) || delivery.transitions.length !== 0) return null;
    return delivery;
  }

  if (delivery.kind === "ordered-sections") {
    if (!exactKeys(delivery, ["kind", "sections", "transitions"])) return null;
    if (!Array.isArray(delivery.sections) || !delivery.sections.length) return null;
    if (!delivery.sections.every(validOrderedSection)) return null;
    if (new Set(delivery.sections.map((section) => section.id)).size !== delivery.sections.length) return null;

    const transitions = delivery.transitions;
    if (!Array.isArray(transitions) || transitions.length !== Math.max(0, delivery.sections.length - 1)) return null;
    if (new Set(transitions.map((transition) => transition.id)).size !== transitions.length) return null;
    if (!transitions.every((transition, index) => validTransition(
      transition,
      delivery.sections[index],
      delivery.sections[index + 1],
    ))) return null;

    const sectionQuestionCount = delivery.sections.reduce((sum, section) => sum + section.questionCount, 0);
    const sectionDurationMinutes = delivery.sections.reduce((sum, section) => sum + section.durationMinutes, 0);
    if (sectionQuestionCount !== questionCount || sectionDurationMinutes !== durationMinutes) return null;
    return delivery;
  }

  if (delivery.kind === "fixed-sections-shared-timer") {
    if (!exactKeys(delivery, ["kind", "durationMinutes", "sections"])) return null;
    if (!integerInRange(delivery.durationMinutes, 1, 1440) || delivery.durationMinutes !== durationMinutes) return null;
    if (!Array.isArray(delivery.sections) || !delivery.sections.length) return null;
    if (!delivery.sections.every(validSharedTimerSection)) return null;
    if (new Set(delivery.sections.map((section) => section.id)).size !== delivery.sections.length) return null;
    if (delivery.sections.reduce((sum, section) => sum + section.questionCount, 0) !== questionCount) return null;
    return delivery;
  }

  if (delivery.kind === "hidden-unscored") {
    if (!exactKeys(delivery, [
      "kind",
      "presentedQuestionCount",
      "scoredQuestionCount",
      "unscoredQuestionCount",
      "unscoredIdentity",
      "practiceScoring",
    ])) return null;
    if (!integerInRange(delivery.presentedQuestionCount, 1, 5000)) return null;
    if (!integerInRange(delivery.scoredQuestionCount, 1, 5000)) return null;
    if (!integerInRange(delivery.unscoredQuestionCount, 1, 5000)) return null;
    if (delivery.unscoredIdentity !== "hidden" || delivery.practiceScoring !== "all-presented") return null;
    if (delivery.presentedQuestionCount !== questionCount) return null;
    if (delivery.scoredQuestionCount + delivery.unscoredQuestionCount !== delivery.presentedQuestionCount) return null;
    return delivery;
  }

  if (delivery.kind === "segmented-shared-timer") {
    if (!exactKeys(delivery, ["kind", "durationMinutes", "segments", "checkpoints", "scoring", "formatCapacity"])) return null;
    if (delivery.durationMinutes !== durationMinutes) return null;
    if (!Array.isArray(delivery.segments) || !delivery.segments.length) return null;
    if (!delivery.segments.every(validSharedTimerSegment)) return null;
    if (new Set(delivery.segments.map((segment) => segment.id)).size !== delivery.segments.length) return null;
    if (delivery.segments.reduce((sum, segment) => sum + segment.questionCount, 0) !== questionCount) return null;
    if (!Array.isArray(delivery.checkpoints) || delivery.checkpoints.length !== delivery.segments.length - 1) return null;
    if (new Set(delivery.checkpoints.map((checkpoint) => checkpoint.id)).size !== delivery.checkpoints.length) return null;
    let afterQuestion = 0;
    for (let index = 0; index < delivery.checkpoints.length; index += 1) {
      afterQuestion += delivery.segments[index].questionCount;
      if (!validIrreversibleCheckpoint(
        delivery.checkpoints[index],
        delivery.segments[index],
        delivery.segments[index + 1],
        afterQuestion,
      )) return null;
    }
    if (!validAggregateScoring(delivery.scoring, questionCount)) return null;
    if (!validFormatCapacity(delivery.formatCapacity)) return null;
    if (certification.id === "pmp") {
      const exactSegments = [["segment-1", "Questions 1–60", 60], ["segment-2", "Questions 61–120", 60], ["segment-3", "Questions 121–180", 60]];
      const exactCheckpoints = [["review-break-1", "segment-1", "segment-2", 60], ["review-break-2", "segment-2", "segment-3", 120]];
      const exactCapacity = { singleChoice: 48, passageSingle: 95, multipleResponse: 37, ordering: 0, matching: 0, caseSetToolPracticum: 0 };
      if (questionCount !== 180 || durationMinutes !== 240) return null;
      if (!delivery.segments.every((segment, index) => (
        segment.id === exactSegments[index][0]
        && segment.label === exactSegments[index][1]
        && segment.questionCount === exactSegments[index][2]
      ))) return null;
      if (!delivery.checkpoints.every((checkpoint, index) => (
        checkpoint.id === exactCheckpoints[index][0]
        && checkpoint.afterSegmentId === exactCheckpoints[index][1]
        && checkpoint.beforeSegmentId === exactCheckpoints[index][2]
        && checkpoint.afterQuestion === exactCheckpoints[index][3]
        && checkpoint.kind === "irreversible-review-break"
        && checkpoint.maximumMinutes === 10
      ))) return null;
      if (
        delivery.scoring.presentedQuestionCount !== 180
        || delivery.scoring.scoredQuestionCount !== 170
        || delivery.scoring.unscoredQuestionCount !== 10
        || Object.entries(exactCapacity).some(([key, value]) => delivery.formatCapacity[key] !== value)
      ) return null;
    }
    return delivery;
  }

  return null;
}
