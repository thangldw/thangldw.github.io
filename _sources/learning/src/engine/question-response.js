import { answersMatch } from "./learning-engine.js";

const CHOICE_TYPES = new Set([undefined, "single", "multiple", "audio", "single_choice", "multiple_choice", "listening_single", "passage_single", "image_based", "case_set"]);

function firstValue(input) {
  return Array.isArray(input) ? input[0] : input;
}

export function normalizeResponse(question, input) {
  if (question?.type === "numeric_input") {
    const unit = String(question.response?.unit || "").trim();
    const raw = String(firstValue(input) ?? "").trim().replace(/,/gu, ".");
    const withoutUnit = unit ? raw.replace(new RegExp(`${unit.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "iu"), "").trim() : raw;
    const value = Number(withoutUnit);
    return Number.isFinite(value) ? value : null;
  }
  if (question?.type === "ordered_steps") {
    return Array.isArray(input) ? input.map(String) : [];
  }
  if (question?.type === "matching") {
    const value = firstValue(input);
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed).sort(([left], [right]) => left.localeCompare(right)));
    } catch {
      return {};
    }
  }
  if (question?.type === "written_response" && question.response?.subquestions?.length) {
    try {
      const response = JSON.parse(String(firstValue(input) ?? "{}"));
      if (!response || typeof response !== "object" || Array.isArray(response)) return {};
      return Object.fromEntries(question.response.subquestions.map(item => [item.id, typeof response[item.id] === "string" ? response[item.id].trim() : ""]));
    } catch { return {}; }
  }
  if (question?.type === "written_response") return String(firstValue(input) ?? "").trim();
  return Array.isArray(input) ? input : [];
}

export function scoreObjectiveResponse(question, input) {
  const response = normalizeResponse(question, input);
  if (question?.type === "written_response") {
    if (question.response?.subquestions?.length) return question.response.subquestions.every(item => response[item.id] && Array.from(response[item.id]).length <= item.maxLength) ? "self_check_required" : "invalid";
    return response ? "self_check_required" : "invalid";
  }
  if (question?.type === "numeric_input") {
    if (response === null) return "invalid";
    const expected = Number(question.response?.numericAnswer);
    const tolerance = Math.max(0, Number(question.response?.tolerance) || 0);
    return Number.isFinite(expected) && Math.abs(response - expected) <= tolerance ? "correct" : "wrong";
  }
  if (question?.type === "ordered_steps") {
    const expected = question.response?.correctOrder || [];
    return response.length && response.length === expected.length && response.every((item, index) => item === expected[index]) ? "correct" : "wrong";
  }
  if (question?.type === "matching") {
    const expected = question.response?.correctPairs || {};
    return Object.keys(response).length && JSON.stringify(response) === JSON.stringify(Object.fromEntries(Object.entries(expected).sort(([left], [right]) => left.localeCompare(right)))) ? "correct" : "wrong";
  }
  if (CHOICE_TYPES.has(question?.type)) return answersMatch(response, question?.answer || []) ? "correct" : "wrong";
  return "invalid";
}
