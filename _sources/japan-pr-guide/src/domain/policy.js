export const POLICY_REVIEWED = "2026-10-05";
export const POLICY_EFFECTIVE = "2027-04-01";
export const SOURCES = {
  guideline: "https://www.moj.go.jp/isa/10_00279.html",
  previous: "https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html",
  application: "https://www.moj.go.jp/isa/applications/procedures/16-4.html",
  reducedFee: "https://www.moj.go.jp/isa/10_00273.html",
  hsp: "https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00131.html",
  police: "https://www.npa.go.jp/bureau/traffic/bicycle/info.html",
  licence: "https://www.npa.go.jp/bureau/traffic/keikaku/R8_keikaku.pdf",
  visa: "https://www.mofa.go.jp/j_info/visit/visa/procedure/pagewe_000001_00391.html",
  visaStatus: "https://www.mofa.go.jp/j_info/visit/visa/system/index.html",
};

export function isValidFilingDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "2025-04-01" &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

export function policyForFiling(date) {
  if (!isValidFilingDate(date)) throw new Error("Invalid filing date");
  return {
    revisedGuideline: date >= POLICY_EFFECTIVE,
    standardFee: date >= "2026-10-01" ? 200000 : 10000,
    pendingIncomeReview: date >= "2026-04-01" && date < "2026-10-01",
    threeYearTreatment: date < POLICY_EFFECTIVE ? "accepted" : "conditional",
  };
}
