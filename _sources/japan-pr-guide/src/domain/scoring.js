export function degreePoints(activity, degree) {
  if (degree === "none") return 0;
  if (degree === "bachelor") return 10;
  if (degree === "mbaMot") return activity === "a" ? 20 : 25;
  if (degree === "doctor") return activity === "a" ? 30 : 20;
  if (degree === "master") return 20;
  return Number(degree || 0);
}

export function experiencePoints(activity, years) {
  const value = Number(years || 0);
  if (activity === "c") {
    if (value >= 10) return 25;
    if (value >= 7) return 20;
    if (value >= 5) return 15;
    if (value >= 3) return 10;
    return 0;
  }
  if (activity === "b" && value >= 10) return 20;
  if (value >= 7) return 15;
  if (value >= 5) return 10;
  if (value >= 3) return 5;
  return 0;
}

export function toScoringInput(input = {}) {
  const activity = input.activity || "a";
  return {
    ...input,
    activity,
    degree: degreePoints(activity, input.degree),
    experience: experiencePoints(activity, input.experience),
  };
}

export function incomePoints(activity, income, age) {
  if (activity === "c") {
    if (income >= 30) return 50;
    if (income >= 25) return 40;
    if (income >= 20) return 30;
    if (income >= 15) return 20;
    if (income >= 10) return 10;
    return 0;
  }

  if (income >= 10) return 40;
  if (income >= 9) return 35;
  if (income >= 8) return 30;
  if (income >= 7 && age < 40) return 25;
  if (income >= 6 && age < 40) return 20;
  if (income >= 5 && age < 35) return 15;
  if (income >= 4 && age < 30) return 10;
  return 0;
}

export function agePoints(activity, age) {
  if (activity === "c") return 0;
  if (age < 30) return 15;
  if (age < 35) return 10;
  if (age < 40) return 5;
  return 0;
}

export function researchPoints(activity, count) {
  if (!count || activity === "c") return 0;
  if (activity === "a") return count === 1 ? 20 : 25;
  return 15;
}

export function specialAdditionBreakdown(input = {}) {
  const warnings = [];
  const claims = {
    japanUniversity: 0,
    japanese: 0,
    foreignJapaneseMajor: 0,
    universityBonus: 0,
    innovativeAsia: 0,
    innovationSupport: 0,
    innovationSme: 0,
    localSupport: 0,
    smeResearch: 0,
    foreignAward: 0,
    advancedProject: 0,
    jicaTraining: 0,
    assetManagement: 0,
    investment: 0,
  };

  if (input.japanUniversity) claims.japanUniversity = 10;

  if (input.japanese === "n1") {
    claims.japanese = 15;
  } else if (input.foreignJapaneseMajor) {
    claims.foreignJapaneseMajor = 15;
  } else if (input.japanese === "n2") {
    if (input.japanUniversity || input.foreignJapaneseMajor) warnings.push("n2Overlap");
    else claims.japanese = 10;
  }

  if (Number(input.universityBonus || 0) >= 10) claims.universityBonus = 10;
  else if (input.innovativeAsiaManual) claims.innovativeAsia = 10;

  if (input.innovationSupport) claims.innovationSupport = 10;
  if (input.innovationSme) {
    if (input.innovationSupport) claims.innovationSme = 10;
    else warnings.push("innovationDependency");
  }

  if (input.localSupport) claims.localSupport = 10;
  if (input.smeResearch) claims.smeResearch = 5;
  if (input.foreignAward) claims.foreignAward = 5;
  if (input.advancedProject) claims.advancedProject = 10;
  const jicaTrainingStatus = input.jicaTraining === true
    ? "usedUniversityClasses"
    : input.jicaTraining || "none";
  if (jicaTrainingStatus !== "none") {
    if (input.japanUniversity && jicaTrainingStatus === "usedUniversityClasses") warnings.push("jicaOverlap");
    else claims.jicaTraining = 5;
  }
  if (input.activity !== "a" && input.assetManagement) claims.assetManagement = 10;
  if (input.activity === "c" && input.investment) claims.investment = 5;

  return {
    claims,
    points: Object.values(claims).reduce((sum, value) => sum + value, 0),
    warnings,
  };
}

export function specialAdditionPoints(input = {}) {
  const { points, warnings } = specialAdditionBreakdown(input);
  return { points, warnings };
}

export function classifyScore(score, activity, income) {
  const hardStops = activity !== "a" && income < 3 ? ["incomeStop"] : [];
  if (hardStops.length || score < 70) return { eligible: false, route: "none", hardStops };
  return { eligible: true, route: score >= 80 ? "hsp80" : "hsp70", hardStops };
}

export function nextThresholdProgress(result = {}) {
  if ((result.hardStops || []).length || result.route === "hsp80") {
    return { target: null, pointsNeeded: 0 };
  }
  const target = result.route === "hsp70" ? 80 : 70;
  return {
    target,
    pointsNeeded: Math.max(0, target - Number(result.score || 0)),
  };
}

export function calculateScore(input = {}) {
  const activity = input.activity || "a";
  const degree = Number(input.degree || 0);
  const age = Number(input.age ?? 99);
  const income = Number(input.income || 0);
  const special = specialAdditionBreakdown({ ...input, activity });
  const warnings = [...special.warnings];
  const multipleDegreePoints = input.multipleDegrees && degree >= 20 ? 5 : 0;
  if (input.multipleDegrees && degree < 20) warnings.push("multipleDegreeDependency");

  const qualificationCount = Number(input.qualificationCount || 0);
  const parts = {
    degree,
    multipleDegrees: multipleDegreePoints,
    experience: Number(input.experience || 0),
    income: incomePoints(activity, income, age),
    age: agePoints(activity, age),
    position: activity === "c" ? Number(input.position || 0) : 0,
    research: researchPoints(activity, Number(input.researchCount || 0)),
    qualification: activity === "b"
      ? qualificationCount >= 2 ? 10 : qualificationCount === 1 ? 5 : 0
      : 0,
    special: special.points,
  };
  const score = Object.values(parts).reduce((sum, value) => sum + value, 0);
  const claims = {
    degree: parts.degree,
    multipleDegrees: parts.multipleDegrees,
    experience: parts.experience,
    income: parts.income,
    age: parts.age,
    position: parts.position,
    research: parts.research,
    qualification: parts.qualification,
    ...special.claims,
  };

  return {
    score,
    parts,
    claims,
    warnings,
    ...classifyScore(score, activity, income),
  };
}
