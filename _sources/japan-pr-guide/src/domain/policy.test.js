import { describe, expect, test } from "vitest";
import { isValidFilingDate, policyForFiling } from "./policy";

describe("official policy application dates", () => {
  test("locks the fee to the acceptance date, not a later decision date", () => {
    expect(policyForFiling("2026-09-30").standardFee).toBe(10000);
    expect(policyForFiling("2026-10-01").standardFee).toBe(200000);
  });
  test("does not apply the general 2027 revision on its publication date", () => {
    expect(policyForFiling("2026-10-01").revisedGuideline).toBe(false);
    expect(policyForFiling("2027-03-31").threeYearTreatment).toBe("accepted");
    expect(policyForFiling("2027-04-01")).toMatchObject({ revisedGuideline: true, threeYearTreatment: "conditional" });
  });
  test("flags the income transition only in the specified pending-application window", () => {
    expect(policyForFiling("2026-03-31").pendingIncomeReview).toBe(false);
    expect(policyForFiling("2026-04-01").pendingIncomeReview).toBe(true);
    expect(policyForFiling("2026-09-30").pendingIncomeReview).toBe(true);
    expect(policyForFiling("2026-10-01").pendingIncomeReview).toBe(false);
  });
  test("rejects invalid dates rather than comparing malformed strings", () => {
    for (const date of ["", "2027-2-1", "2027-02-29", "2026-04-31", "2024-01-01"]) {
      expect(isValidFilingDate(date)).toBe(false);
      expect(() => policyForFiling(date)).toThrow();
    }
    expect(isValidFilingDate("2028-02-29")).toBe(true);
  });
});
