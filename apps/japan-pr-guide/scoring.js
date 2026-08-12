(function attachScoring(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HSPScoring = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createScoring() {
  function incomePoints(activity, income, age) {
    if (activity === 'c') {
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

  function agePoints(activity, age) {
    if (activity === 'c') return 0;
    if (age < 30) return 15;
    if (age < 35) return 10;
    if (age < 40) return 5;
    return 0;
  }

  function researchPoints(activity, count) {
    if (!count || activity === 'c') return 0;
    if (activity === 'a') return count === 1 ? 20 : 25;
    return 15;
  }

  function specialAdditionPoints(input = {}) {
    const warnings = [];
    let points = 0;

    if (input.japanUniversity) points += 10;

    if (input.japanese === 'n1' || input.foreignJapaneseMajor) {
      points += 15;
    } else if (input.japanese === 'n2') {
      if (input.japanUniversity || input.foreignJapaneseMajor) warnings.push('n2Overlap');
      else points += 10;
    }

    points += Math.max(Number(input.universityBonus || 0), input.innovativeAsiaManual ? 10 : 0);

    if (input.innovationSupport) points += 10;
    if (input.innovationSme) {
      if (input.innovationSupport) points += 10;
      else warnings.push('innovationDependency');
    }

    if (input.localSupport) points += 10;
    if (input.smeResearch) points += 5;
    if (input.foreignAward) points += 5;
    if (input.advancedProject) points += 10;
    if (input.jicaTraining) {
      if (input.japanUniversity) warnings.push('jicaOverlap');
      else points += 5;
    }
    if (input.activity !== 'a' && input.assetManagement) points += 10;
    if (input.activity === 'c' && input.investment) points += 5;

    return { points, warnings };
  }

  function classifyScore(score, activity, income) {
    const hardStops = activity !== 'a' && income < 3 ? ['incomeStop'] : [];
    if (hardStops.length || score < 70) return { eligible: false, route: 'none', hardStops };
    return { eligible: true, route: score >= 80 ? 'hsp80' : 'hsp70', hardStops };
  }

  function calculateScore(input = {}) {
    const activity = input.activity || 'a';
    const age = Number(input.age ?? 99);
    const income = Number(input.income || 0);
    const special = specialAdditionPoints({ ...input, activity });
    const parts = {
      degree: Number(input.degree || 0),
      multipleDegrees: input.multipleDegrees ? 5 : 0,
      experience: Number(input.experience || 0),
      income: incomePoints(activity, income, age),
      age: agePoints(activity, age),
      position: activity === 'c' ? Number(input.position || 0) : 0,
      research: researchPoints(activity, Number(input.researchCount || 0)),
      qualification: activity === 'b'
        ? Number(input.qualificationCount || 0) >= 2 ? 10 : Number(input.qualificationCount || 0) === 1 ? 5 : 0
        : 0,
      special: special.points,
    };
    const score = Object.values(parts).reduce((sum, value) => sum + value, 0);
    const classification = classifyScore(score, activity, income);

    return {
      score,
      parts,
      warnings: special.warnings,
      ...classification,
    };
  }

  return {
    incomePoints,
    agePoints,
    researchPoints,
    specialAdditionPoints,
    classifyScore,
    calculateScore,
  };
});
