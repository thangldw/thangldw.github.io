import { describe, expect, test } from "vitest";
import {
  agePoints,
  calculateScore,
  classifyScore,
  degreePoints,
  experiencePoints,
  incomePoints,
  nextThresholdProgress,
  researchPoints,
  specialAdditionPoints,
  toScoringInput,
} from "./scoring";

describe("MOJ HSP scoring parity", () => {
  test("raw degree and experience inputs map by activity", () => {
    expect(degreePoints("a", "doctor")).toBe(30);
    expect(degreePoints("b", "doctor")).toBe(20);
    expect(degreePoints("c", "master")).toBe(20);
    expect(degreePoints("b", "mbaMot")).toBe(25);
    expect(experiencePoints("a", 7)).toBe(15);
    expect(experiencePoints("b", 10)).toBe(20);
    expect(experiencePoints("c", 7)).toBe(20);
  });

  test("form values are adapted before the historical engine runs", () => {
    expect(toScoringInput({
      activity: "a",
      degree: "master",
      experience: 7,
      age: 32,
      income: 6.5,
    })).toMatchObject({
      activity: "a",
      degree: 20,
      experience: 15,
      age: 32,
      income: 6.5,
    });
  });

  test("income points follow activity and age bands", () => {
    expect(incomePoints("a", 4, 29)).toBe(10);
    expect(incomePoints("a", 4, 32)).toBe(0);
    expect(incomePoints("b", 6, 37)).toBe(20);
    expect(incomePoints("b", 7, 42)).toBe(0);
    expect(incomePoints("b", 8, 42)).toBe(30);
    expect(incomePoints("c", 10, 42)).toBe(10);
    expect(incomePoints("c", 30, 42)).toBe(50);
  });

  test("age points do not apply to business management", () => {
    expect(agePoints("a", 29)).toBe(15);
    expect(agePoints("b", 34)).toBe(10);
    expect(agePoints("b", 39)).toBe(5);
    expect(agePoints("c", 29)).toBe(0);
  });

  test("multiple-degree bonus requires an eligible advanced degree", () => {
    const bachelorOnly = calculateScore({ activity: "a", degree: 10, multipleDegrees: true });
    expect(bachelorOnly.parts.multipleDegrees).toBe(0);
    expect(bachelorOnly.warnings).toEqual(["multipleDegreeDependency"]);

    const qualifyingDegree = calculateScore({ activity: "a", degree: 20, multipleDegrees: true });
    expect(qualifyingDegree.parts.multipleDegrees).toBe(5);
    expect(qualifyingDegree.warnings).toEqual([]);
  });

  test("invalid multiple-degree claim cannot create a false 70-point route", () => {
    const result = calculateScore({
      activity: "a",
      degree: 10,
      multipleDegrees: true,
      experience: 15,
      age: 29,
      income: 7,
    });
    expect(result.score).toBe(65);
    expect(result.eligible).toBe(false);
    expect(result.route).toBe("none");
  });

  test("research achievements use official category caps", () => {
    expect(researchPoints("a", 0)).toBe(0);
    expect(researchPoints("a", 1)).toBe(20);
    expect(researchPoints("a", 4)).toBe(25);
    expect(researchPoints("b", 1)).toBe(15);
    expect(researchPoints("b", 4)).toBe(15);
    expect(researchPoints("c", 4)).toBe(0);
  });

  test("language additions do not stack across overlapping claims", () => {
    const result = specialAdditionPoints({ japanese: "n2", japanUniversity: true });
    expect(result.points).toBe(10);
    expect(result.warnings).toEqual(["n2Overlap"]);
  });

  test("N1 and a foreign Japanese major share one 15-point award", () => {
    const result = specialAdditionPoints({ japanese: "n1", foreignJapaneseMajor: true });
    expect(result.points).toBe(15);
    expect(result.warnings).toEqual([]);
  });

  test("innovation SME addition requires the parent support criterion", () => {
    expect(specialAdditionPoints({ innovationSme: true })).toEqual({
      points: 0,
      warnings: ["innovationDependency"],
    });
    expect(specialAdditionPoints({ innovationSupport: true, innovationSme: true })).toEqual({
      points: 20,
      warnings: [],
    });
  });

  test("JICA training stacks with Japanese-university points when it did not use university classes", () => {
    const result = specialAdditionPoints({
      japanUniversity: true,
      jicaTraining: "noUniversityClasses",
    });
    expect(result.points).toBe(15);
    expect(result.warnings).toEqual([]);
  });

  test("JICA training overlaps only when it used Japanese university classes", () => {
    const result = specialAdditionPoints({
      japanUniversity: true,
      jicaTraining: "usedUniversityClasses",
    });
    expect(result.points).toBe(10);
    expect(result.warnings).toEqual(["jicaOverlap"]);
  });

  test("either qualifying JICA training format scores five points without a Japanese-university claim", () => {
    expect(specialAdditionPoints({ jicaTraining: "noUniversityClasses" }).points).toBe(5);
    expect(specialAdditionPoints({ jicaTraining: "usedUniversityClasses" }).points).toBe(5);
  });

  test("excluded JICA overlap cannot create a false 70-point route", () => {
    const result = calculateScore({
      activity: "a",
      degree: 30,
      experience: 15,
      age: 32,
      income: 2.9,
      japanUniversity: true,
      jicaTraining: "usedUniversityClasses",
    });
    expect(result.score).toBe(65);
    expect(result.eligible).toBe(false);
    expect(result.route).toBe("none");
    expect(result.warnings).toEqual(["jicaOverlap"]);
  });

  test("university categories never exceed the 10-point cap", () => {
    expect(specialAdditionPoints({ universityBonus: 10, innovativeAsiaManual: true }).points).toBe(10);
  });

  test("score classification exposes 70 and 80 point thresholds", () => {
    expect(classifyScore(69, "a", 2.9)).toEqual({ eligible: false, route: "none", hardStops: [] });
    expect(classifyScore(70, "a", 2.9)).toEqual({ eligible: true, route: "hsp70", hardStops: [] });
    expect(classifyScore(80, "b", 8)).toEqual({ eligible: true, route: "hsp80", hardStops: [] });
  });

  test("70-79 point results report the exact gap to 80", () => {
    expect(nextThresholdProgress({ score: 75, route: "hsp70", hardStops: [] })).toEqual({
      target: 80,
      pointsNeeded: 5,
    });
  });

  test("sub-3-million remuneration is a hard stop for activities b and c", () => {
    expect(classifyScore(85, "b", 2.9)).toEqual({
      eligible: false,
      route: "none",
      hardStops: ["incomeStop"],
    });
    expect(classifyScore(85, "a", 2.9)).toEqual({ eligible: true, route: "hsp80", hardStops: [] });
  });

  test("complete calculation returns stable parts, warnings, and route", () => {
    const result = calculateScore({
      activity: "b",
      degree: 20,
      multipleDegrees: true,
      experience: 15,
      age: 32,
      income: 8,
      researchCount: 1,
      qualificationCount: 1,
      japanese: "n2",
      japanUniversity: true,
    });
    expect(result.score).toBe(110);
    expect(result.route).toBe("hsp80");
    expect(result.parts).toEqual({
      degree: 20,
      multipleDegrees: 5,
      experience: 15,
      income: 30,
      age: 10,
      position: 0,
      research: 15,
      qualification: 5,
      special: 10,
    });
    expect(result.warnings).toEqual(["n2Overlap"]);
  });

  test("returns an itemized breakdown whose visible rows reconcile to the score", () => {
    const result = calculateScore({
      activity: "b",
      degree: 20,
      experience: 15,
      age: 32,
      income: 6.5,
      innovativeAsiaManual: true,
    });

    expect(result.claims).toMatchObject({
      degree: 20,
      experience: 15,
      age: 10,
      income: 20,
      innovativeAsia: 10,
      universityBonus: 0,
    });
    expect(Object.values(result.claims).reduce((sum, points) => sum + points, 0)).toBe(75);
  });

  test("approved academic scenario scores 65 and rises to 85 at ten million yen", () => {
    const base = calculateScore({ activity: "a", degree: 20, experience: 15, age: 32, income: 6.5 });
    const raisedIncome = calculateScore({ activity: "a", degree: 20, experience: 15, age: 32, income: 10 });
    expect(base.score).toBe(65);
    expect(base.route).toBe("none");
    expect(raisedIncome.score).toBe(85);
    expect(raisedIncome.route).toBe("hsp80");
  });

  test("business scenario that the prototype called 80 is only 60", () => {
    const result = calculateScore({
      activity: "c",
      degree: 20,
      experience: 15,
      age: 32,
      income: 12,
      japanese: "n1",
    });
    expect(result.score).toBe(60);
    expect(result.route).toBe("none");
    expect(result.parts.age).toBe(0);
  });
});
