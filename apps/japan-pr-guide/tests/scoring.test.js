const test = require('node:test');
const assert = require('node:assert/strict');

const scoring = require('../scoring.js');

test('income points follow activity and age bands', () => {
  assert.equal(scoring.incomePoints('a', 4, 29), 10);
  assert.equal(scoring.incomePoints('a', 4, 32), 0);
  assert.equal(scoring.incomePoints('b', 6, 37), 20);
  assert.equal(scoring.incomePoints('b', 7, 42), 0);
  assert.equal(scoring.incomePoints('b', 8, 42), 30);
  assert.equal(scoring.incomePoints('c', 10, 42), 10);
  assert.equal(scoring.incomePoints('c', 30, 42), 50);
});

test('age points do not apply to business management', () => {
  assert.equal(scoring.agePoints('a', 29), 15);
  assert.equal(scoring.agePoints('b', 34), 10);
  assert.equal(scoring.agePoints('b', 39), 5);
  assert.equal(scoring.agePoints('c', 29), 0);
});

test('research achievements use official category caps', () => {
  assert.equal(scoring.researchPoints('a', 0), 0);
  assert.equal(scoring.researchPoints('a', 1), 20);
  assert.equal(scoring.researchPoints('a', 4), 25);
  assert.equal(scoring.researchPoints('b', 1), 15);
  assert.equal(scoring.researchPoints('b', 4), 15);
  assert.equal(scoring.researchPoints('c', 4), 0);
});

test('language additions do not stack across overlapping claims', () => {
  const result = scoring.specialAdditionPoints({
    japanese: 'n2',
    japanUniversity: true,
    foreignJapaneseMajor: false,
  });

  assert.equal(result.points, 10);
  assert.deepEqual(result.warnings, ['n2Overlap']);
});

test('N1 and foreign Japanese major share one 15-point award', () => {
  const result = scoring.specialAdditionPoints({
    japanese: 'n1',
    foreignJapaneseMajor: true,
  });

  assert.equal(result.points, 15);
  assert.deepEqual(result.warnings, []);
});

test('innovation SME addition requires the parent support criterion', () => {
  const missingParent = scoring.specialAdditionPoints({ innovationSme: true });
  assert.equal(missingParent.points, 0);
  assert.deepEqual(missingParent.warnings, ['innovationDependency']);

  const withParent = scoring.specialAdditionPoints({
    innovationSupport: true,
    innovationSme: true,
  });
  assert.equal(withParent.points, 20);
  assert.deepEqual(withParent.warnings, []);
});

test('JICA training warns when Japanese university points are also claimed', () => {
  const result = scoring.specialAdditionPoints({
    japanUniversity: true,
    jicaTraining: true,
  });

  assert.equal(result.points, 15);
  assert.deepEqual(result.warnings, ['jicaOverlap']);
});

test('university categories never exceed the 10-point category cap', () => {
  const result = scoring.specialAdditionPoints({
    universityBonus: 10,
    innovativeAsiaManual: true,
  });

  assert.equal(result.points, 10);
});

test('score classification exposes 70 and 80 point routes', () => {
  assert.deepEqual(scoring.classifyScore(69, 'a', 2.9), {
    eligible: false,
    route: 'none',
    hardStops: [],
  });
  assert.deepEqual(scoring.classifyScore(70, 'a', 2.9), {
    eligible: true,
    route: 'hsp70',
    hardStops: [],
  });
  assert.deepEqual(scoring.classifyScore(80, 'b', 8), {
    eligible: true,
    route: 'hsp80',
    hardStops: [],
  });
});

test('sub-3-million remuneration is a hard stop for activities b and c', () => {
  const technical = scoring.classifyScore(85, 'b', 2.9);
  assert.equal(technical.eligible, false);
  assert.equal(technical.route, 'none');
  assert.deepEqual(technical.hardStops, ['incomeStop']);

  const academic = scoring.classifyScore(85, 'a', 2.9);
  assert.equal(academic.eligible, true);
  assert.equal(academic.route, 'hsp80');
  assert.deepEqual(academic.hardStops, []);
});

test('complete calculation returns stable parts, warnings, and route', () => {
  const result = scoring.calculateScore({
    activity: 'b',
    degree: 20,
    multipleDegrees: true,
    experience: 15,
    age: 32,
    income: 8,
    researchCount: 1,
    qualificationCount: 1,
    japanese: 'n2',
    japanUniversity: true,
  });

  assert.equal(result.score, 110);
  assert.equal(result.route, 'hsp80');
  assert.equal(result.eligible, true);
  assert.deepEqual(result.warnings, ['n2Overlap']);
  assert.deepEqual(result.parts, {
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
});
