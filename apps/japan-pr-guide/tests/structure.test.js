const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(appRoot, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(appRoot, 'redesign.css'), 'utf8');
const app = fs.readFileSync(path.join(appRoot, 'app.js'), 'utf8');

test('calculator header exposes product identity and source freshness', () => {
  assert.match(html, /<header[^>]+id="appHeader"/);
  assert.match(html, /assets\/hsp-mark\.png/);
  assert.match(html, /Rules checked/);
  assert.match(html, /August 2026/);
  assert.match(html, /href="#sources"[^>]*>[^<]*About HSP/);
});

test('score rail directly explains eligibility, thresholds, route, and privacy', () => {
  assert.match(html, /id="scoreSummary"/);
  assert.match(html, /id="scoreRoute"/);
  assert.match(html, />70 points</);
  assert.match(html, />80 points</);
  assert.match(html, /Your data stays in this browser/);
  assert.match(html, /Review PR requirements/);
});

test('score is bounded to the calculator and reused as static workflow context', () => {
  assert.match(html, /id="scoreSpine"/);
  assert.match(html, /id="scoreSpineStatus"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.match(html, /id="scoreDetails"/);
  assert.match(html, /id="coreFactors"/);
  assert.equal((html.match(/class="workflow-score-context-row"/g) || []).length, 3);
  assert.equal((html.match(/href="#coreFactors"/g) || []).length, 3);
  assert.doesNotMatch(html, /id="scoreDock"/);
  assert.doesNotMatch(app, /new IntersectionObserver/);
  assert.match(app, /function updateScoreContexts\(scoringResult\)/);
});

test('bonus inputs use one disclosure and three semantic groups', () => {
  assert.match(html, /<details[^>]+id="bonusDisclosure"/);
  assert.match(html, /Language &amp; education/);
  assert.match(html, /Employer &amp; activity/);
  assert.match(html, /Qualifications &amp; achievements/);
});

test('scoring module loads before the DOM integration script', () => {
  const scoringIndex = html.indexOf('scoring.js');
  const appIndex = html.indexOf('app.js');
  assert.ok(scoringIndex > -1);
  assert.ok(appIndex > scoringIndex);
  assert.match(html, /scoring\.js\?v=20260812c/);
  assert.match(html, /app\.js\?v=20260813a/);
});

test('JICA bonus discloses the Japanese-university exclusion at the input', () => {
  assert.match(html, /data-t="jicaTrainingHelp"/);
  assert.match(app, /jicaTrainingHelp:"\+5 · not with Japanese-university \+10\."/);
  assert.match(app, /jicaTrainingHelp:"\+5 · không cộng cùng điểm đại học Nhật \+10\."/);
});

test('multiple-degree input is guarded by the selected degree', () => {
  assert.match(html, /id="multipleDegreesRow"/);
  assert.match(app, /multipleDegrees\.disabled=!multipleDegreeEligible/);
  assert.match(app, /if\(!multipleDegreeEligible\)multipleDegrees\.checked=false/);
});

test('design tokens and responsive calculator contract are present', () => {
  assert.match(css, /--app-bg:\s*#fff(?:fff)?/i);
  assert.match(css, /--app-accent:\s*#b63a12/i);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+clamp\(320px,\s*31vw,\s*430px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /\.score-card\s*\{[^}]*order:\s*-1/s);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('mobile support affordance cannot cover the primary PR action', () => {
  assert.match(html, /redesign\.css\?v=20260813a/);
  assert.match(css, /\.support-floating-trigger\s*\{[^}]*bottom:\s*12px\s*!important/s);
  assert.match(css, /\.support-floating-trigger\s*\{[^}]*width:\s*44px\s*!important/s);
  assert.match(css, /\.support-floating-trigger span\s*\{[^}]*clip:\s*rect\(0 0 0 0\)/s);
});

test('long reference workflows are collapsed until requested', () => {
  for (const id of ['visa-guide', 'diagnosis', 'documents', 'sources']) {
    assert.match(html, new RegExp(`<details[^>]+id="${id}"[^>]+workspace-disclosure`));
  }
  assert.match(html, /<summary class="section-head">/);
  assert.doesNotMatch(css, /\.score-sticky\s*\{[^}]*overflow:\s*auto/s);
  assert.match(css, /\.workspace-disclosure:not\(\[open\]\)\s*>\s*:not\(summary\)\s*\{[^}]*display:\s*none/s);
});
