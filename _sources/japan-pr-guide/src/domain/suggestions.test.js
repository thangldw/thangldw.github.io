import { describe, expect, test } from "vitest";
import { getFactorDefinitions, initialFactors } from "../scoreDefinitions";
import { calculateScore, toScoringInput } from "./scoring";
import { suggestClaims } from "./suggestions";

const score = (activity, factors) => calculateScore(toScoringInput({ ...factors, activity }));

describe("suggestClaims", () => {
  test("suggests only optional claims that really add points under the engine", () => {
    const result = score("b", initialFactors);
    const { target, pointsNeeded, suggestions } = suggestClaims("b", initialFactors, result);
    const core = new Set(getFactorDefinitions("b").filter((d) => d.group === "Core").map((d) => d.id));

    expect([target, pointsNeeded]).toEqual([80, 5]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    for (const item of suggestions) {
      expect(core.has(item.id)).toBe(false);
      expect(item.points).toBeGreaterThan(0);
    }
  });

  test("ranks claims that close the gap ahead of partial gains", () => {
    const result = score("b", initialFactors);
    const { suggestions } = suggestClaims("b", initialFactors, result);
    const closing = suggestions.filter((item) => item.closes);
    expect(suggestions.slice(0, closing.length)).toEqual(closing);
    for (const item of closing) expect(item.points).toBeGreaterThanOrEqual(5);
  });

  test("returns nothing at the highest route or after a remuneration hard stop", () => {
    const high = { ...initialFactors, degree: "doctor" };
    expect(suggestClaims("b", high, score("b", high)).suggestions).toEqual([]);
    const stopped = { ...initialFactors, income: 2.9 };
    expect(suggestClaims("b", stopped, score("b", stopped)).target).toBeNull();
  });
});
