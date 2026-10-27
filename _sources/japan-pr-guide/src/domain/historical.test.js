import { describe, expect, test } from "vitest";
import {
  calculateHistoricalScenario,
  deriveHistoricalFactors,
  historicalReferenceForRoute,
} from "./historical";

describe("route-specific historical scoring", () => {
  test("clamps leap-day checkpoints to the last valid day in February", () => {
    expect(historicalReferenceForRoute("hsp80", "2028-02-29").date).toBe("2027-02-28");
  });
  test("uses the three-year checkpoint for a 70-79 point route", () => {
    expect(historicalReferenceForRoute("hsp70", "2026-08-18")).toEqual({
      date: "2023-08-18",
      label: "18 Aug 2023",
      threshold: 70,
      years: 3,
    });
  });

  test("uses the one-year checkpoint for an 80+ point route", () => {
    expect(historicalReferenceForRoute("hsp80", "2026-08-18")).toEqual({
      date: "2025-08-18",
      label: "18 Aug 2025",
      threshold: 80,
      years: 1,
    });
  });

  test("derives age and accumulated experience at the historical date", () => {
    expect(deriveHistoricalFactors({
      age: 32,
      experience: 7,
      degree: "master",
      income: 6.5,
      innovativeAsiaUniversity: "Vietnam-Japan University",
      innovativeAsiaManual: true,
    }, 3)).toMatchObject({
      age: 29,
      experience: 4,
      degree: "master",
      income: 6.5,
      innovativeAsiaUniversity: "Vietnam-Japan University",
      innovativeAsiaManual: true,
    });
  });

  test("recalculates the complete 75-point technical profile as 70 three years ago", () => {
    const scenario = calculateHistoricalScenario({
      activity: "b",
      factors: {
        degree: "master",
        experience: 7,
        age: 32,
        income: 6.5,
        innovativeAsiaUniversity: "Vietnam-Japan University",
        innovativeAsiaManual: true,
      },
      route: "hsp70",
      today: "2026-08-18",
    });

    expect(scenario.reference).toMatchObject({ label: "18 Aug 2023", threshold: 70 });
    expect(scenario.factors).toMatchObject({ age: 29, experience: 4 });
    expect(scenario.result.score).toBe(70);
    expect(scenario.meetsThreshold).toBe(true);
  });
});
