import { getFactorDefinitions } from "../scoreDefinitions";
import { calculateScore, nextThresholdProgress, toScoringInput } from "./scoring";

const MAX_SUGGESTIONS = 3;

// Optional claims (everything outside "Core") that would add points, scored by
// the real engine so overlaps and dependencies are respected. Core facts such
// as degree, age and remuneration are not presented as claims to "add".
export function suggestClaims(activity, factors, result) {
  const { target, pointsNeeded } = nextThresholdProgress(result);
  if (!target) return { target: null, pointsNeeded: 0, suggestions: [] };

  const suggestions = [];
  for (const definition of getFactorDefinitions(activity)) {
    if (definition.group === "Core" || definition.kind !== "select") continue;
    let best = null;
    for (const [value] of definition.options) {
      if (String(value) === String(factors[definition.id])) continue;
      const next = calculateScore(toScoringInput({ ...factors, activity, [definition.id]: value }));
      const points = next.score - result.score;
      if (points <= 0) continue;
      const closes = points >= pointsNeeded;
      const better = !best
        || (closes && !best.closes)
        || (closes === best.closes && (closes ? points < best.points : points > best.points));
      if (better) best = { id: definition.id, label: definition.label, vi: definition.vi, points, closes };
    }
    if (best) suggestions.push(best);
  }
  suggestions.sort((a, b) => Number(b.closes) - Number(a.closes) || (a.closes ? a.points - b.points : b.points - a.points));
  return { target, pointsNeeded, suggestions: suggestions.slice(0, MAX_SUGGESTIONS) };
}
