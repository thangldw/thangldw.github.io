import { calculateScore, toScoringInput } from "./scoring";

export const ASSESSMENT_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function subtractYears(isoDate, years) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const targetYear = year - years;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return `${targetYear}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function formatReferenceDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
  return `${day} ${monthName} ${year}`;
}

export function historicalReferenceForRoute(route, today = ASSESSMENT_DATE) {
  if (route !== "hsp70" && route !== "hsp80") return null;
  const years = route === "hsp80" ? 1 : 3;
  const threshold = route === "hsp80" ? 80 : 70;
  const date = subtractYears(today, years);
  return { date, label: formatReferenceDate(date), threshold, years };
}

export function deriveHistoricalFactors(factors = {}, years = 0) {
  return {
    ...factors,
    age: Math.max(0, Number(factors.age ?? 0) - years),
    experience: Math.max(0, Number(factors.experience ?? 0) - years),
  };
}

export function calculateHistoricalScenario({
  activity,
  factors,
  historicalFactors,
  route,
  today = ASSESSMENT_DATE,
}) {
  const reference = historicalReferenceForRoute(route, today);
  if (!reference) {
    return { factors: null, meetsThreshold: false, reference: null, result: null };
  }
  const resolvedFactors = historicalFactors || deriveHistoricalFactors(factors, reference.years);
  const result = calculateScore(toScoringInput({ ...resolvedFactors, activity }));
  return {
    factors: resolvedFactors,
    meetsThreshold: result.score >= reference.threshold && result.hardStops.length === 0,
    reference,
    result,
  };
}
