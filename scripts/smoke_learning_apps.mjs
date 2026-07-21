#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitFor(url, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {}
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpPage {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.exceptions = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveCall, rejectCall } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) rejectCall(new Error(message.error.message));
        else resolveCall(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(message.params.exceptionDetails.text);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolveCall, rejectCall) => {
      this.pending.set(id, { resolveCall, rejectCall });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async waitUntil(expression, timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await this.evaluate(`Boolean(${expression})`)) return;
      await new Promise(resolveWait => setTimeout(resolveWait, 100));
    }
    const body = await this.evaluate('document.body.innerText.slice(0, 300)');
    throw new Error(`Timed out waiting for expression: ${expression}; exceptions=${this.exceptions.join(' | ') || 'none'}; body=${body}`);
  }

  async navigate(url) {
    this.exceptions.length = 0;
    await this.send('Page.navigate', { url });
    await this.waitUntil('document.readyState === "complete"');
  }

  close() {
    this.socket.close();
  }
}

async function openPage(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Could not create Chrome target: ${response.status}`);
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const page = new CdpPage(socket);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  return page;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise(resolveWait => setTimeout(resolveWait, 3000))
  ]);
}

async function checkPage(page, origin, test) {
  const viewport = test.viewport || { width: 1280, height: 900 };
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false
  });
  await page.navigate(origin + test.route);
  await page.waitUntil(test.ready);
  const result = await page.evaluate(`(${test.check})()`);
  assert(result.ok, `${test.name}: ${result.message || 'assertion failed'}`);
  if (page.exceptions.length) throw new Error(`${test.name}: ${page.exceptions.join('; ')}`);
  console.log(`✓ ${test.name}`);
}

const tests = [
  {
    name: 'G検定 roadmap and topics',
    route: '/apps/gkentei/',
    ready: 'document.querySelectorAll(".gk-module-row").length === 11',
    check: function () {
      const initial = document.querySelectorAll('.gk-module-row').length === 11 && document.querySelectorAll('main').length === 1;
      document.querySelector('[data-view="topics"]').click();
      const topics = document.querySelectorAll('.gk-topic-guide').length === 11;
      return { ok: initial && topics, message: `roadmap=${initial}, topics=${topics}` };
    }
  },
  {
    name: 'BJT roadmap and vocabulary navigation',
    route: '/apps/bjt-study/',
    ready: 'document.querySelectorAll(".path-group").length === 3',
    check: function () {
      const roadmap = document.querySelectorAll('.module').length === 9;
      document.querySelector('[data-view="vocabulary"]').click();
      const vocabulary = Boolean(document.querySelector('.subject-hub'));
      return { ok: roadmap && vocabulary, message: `roadmap=${roadmap}, vocabulary=${vocabulary}` };
    }
  },
  {
    name: 'JLPT N1 roadmap and vocabulary navigation',
    route: '/apps/jlpt-n1/#path',
    ready: 'document.querySelectorAll(".track-row").length === 3',
    check: async function () {
      const roadmap = document.querySelectorAll('.track-row').length === 3;
      document.querySelector('[data-view="vocabulary"]').click();
      await new Promise(resolveWait => setTimeout(resolveWait, 50));
      const vocabulary = document.querySelectorAll('.module-row').length === 3;
      return { ok: roadmap && vocabulary, message: `roadmap=${roadmap}, vocabulary=${vocabulary}` };
    }
  },
  {
    name: 'Vocabulary Exams filter, card and quiz',
    route: '/apps/n1-vocabulary-exams/',
    ready: 'document.querySelectorAll(".card").length === 96',
    check: function () {
      const initial = document.querySelectorAll('.card').length === 96 && document.querySelector('#hcnt').textContent === '648 từ';
      const search = document.querySelector('#si');
      search.value = '繁盛';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      const filtered = document.querySelectorAll('.card').length > 0 && document.querySelectorAll('.card').length < 96;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      const card = document.querySelector('.card');
      card.click();
      const expanded = card.getAttribute('aria-expanded') === 'true';
      const quizTab = document.querySelector('[data-tab="q"]');
      quizTab.click();
      document.querySelector('[data-action="start-quiz"]').click();
      const options = document.querySelectorAll('[data-option]').length >= 2;
      document.querySelector('[data-option="0"]').click();
      const feedback = document.querySelector('#exp').classList.contains('show');
      document.querySelector('[data-tab="ra"]').click();
      const reference = !document.querySelector('#tra').classList.contains('is-hidden') && getComputedStyle(document.querySelector('.ra-card')).backgroundColor !== 'rgba(0, 0, 0, 0)';
      return { ok: initial && filtered && expanded && options && feedback && reference, message: `initial=${initial}, filtered=${filtered}, expanded=${expanded}, options=${options}, feedback=${feedback}, reference=${reference}` };
    }
  },
  {
    name: 'Vocabulary Exams mobile layout',
    route: '/apps/n1-vocabulary-exams/',
    viewport: { width: 390, height: 844 },
    ready: 'document.querySelectorAll(".card").length === 96',
    check: function () {
      const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
      document.querySelector('[data-tab="q"]').click();
      document.querySelector('[data-action="start-quiz"]').click();
      const usable = document.querySelectorAll('[data-option]').length >= 2 && document.querySelector('.qa').classList.contains('active');
      return { ok: noOverflow && usable, message: `noOverflow=${noOverflow}, usable=${usable}` };
    }
  },
  {
    name: 'Vocabulary Tabs search, cards and all sections',
    route: '/apps/n1-vocabulary-tabs/',
    ready: 'document.querySelectorAll("#gc .card").length === 96',
    check: async function () {
      const initial = document.querySelectorAll('#gc .card').length === 96;
      const search = document.querySelector('#sic');
      search.value = '意地';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      const filtered = document.querySelectorAll('#gc .card').length > 0 && document.querySelectorAll('#gc .card').length < 96;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      const firstCard = document.querySelector('#gc .card');
      firstCard.click();
      const expanded = firstCard.getAttribute('aria-expanded') === 'true';
      const sections = [
        ['s1696', '.set-section'],
        ['adj', '#adjgrid .card'],
        ['ptu', '.ptu-card'],
        ['dtg', '.dtg-s'],
        ['ct', '.ct-chip'],
        ['pre', '.pre-card']
      ];
      let allSections = true;
      for (const [tab, selector] of sections) {
        document.querySelector(`[data-tab="${tab}"]`).click();
        await new Promise(resolveWait => setTimeout(resolveWait, 0));
        allSections = allSections && Boolean(document.querySelector(`#pn-${tab} ${selector}`));
      }
      document.querySelector('[data-tab="ptu"]').click();
      document.querySelector('[data-ptu-mode="pat"]').click();
      const patternHeader = document.querySelector('.pat-h');
      patternHeader.click();
      const patternBody = document.querySelector('.pat-b');
      const pattern = Boolean(patternHeader) && patternHeader.getAttribute('aria-expanded') === 'true' && getComputedStyle(patternBody).display !== 'none';
      return { ok: initial && filtered && expanded && allSections && pattern, message: `initial=${initial}, filtered=${filtered}, expanded=${expanded}, sections=${allSections}, pattern=${pattern}` };
    }
  },
  {
    name: 'Vocabulary Tabs mobile layout and keyboard',
    route: '/apps/n1-vocabulary-tabs/',
    viewport: { width: 390, height: 844 },
    ready: 'document.querySelectorAll("#gc .card").length === 96',
    check: function () {
      const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
      const card = document.querySelector('#gc .card');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const keyboard = card.getAttribute('aria-expanded') === 'true';
      document.querySelector('[data-tab="pre"]').click();
      const prefixes = document.querySelectorAll('.pre-card').length > 0;
      return { ok: noOverflow && keyboard && prefixes, message: `noOverflow=${noOverflow}, keyboard=${keyboard}, prefixes=${prefixes}` };
    }
  },
  {
    name: 'Grammar Exams answer, explanation and review',
    route: '/apps/n1-grammar-exams/',
    ready: 'document.querySelectorAll("#cnt .opt").length === 4',
    check: function () {
      const initial = document.querySelectorAll('#cnt .opt').length === 4;
      const correct = correctLetter(filtered()[pidx]);
      const wrongOption = Array.from(document.querySelectorAll('#cnt .opt')).find((button) => button.querySelector('.opt-num').textContent.toLowerCase() !== correct);
      wrongOption.click();
      const feedback = Boolean(document.querySelector('.result.ng')) && Boolean(document.querySelector('.exp'));
      const wrongSaved = document.querySelector('#wrong-cnt').textContent === '1';
      document.querySelector('#tab-study').click();
      document.querySelector('.toggle-btn').click();
      const studyExplanation = Boolean(document.querySelector('.study-exp .exp'));
      document.querySelector('#tab-wrong').click();
      const review = Boolean(document.querySelector('.wrong-card, .card.wrong-mode')) && document.querySelectorAll('.opt').length === 4;
      return { ok: initial && feedback && wrongSaved && studyExplanation && review, message: `initial=${initial}, feedback=${feedback}, wrongSaved=${wrongSaved}, study=${studyExplanation}, review=${review}` };
    }
  },
  {
    name: 'Grammar Exams mobile layout',
    route: '/apps/n1-grammar-exams/',
    viewport: { width: 390, height: 844 },
    ready: 'document.querySelectorAll("#cnt .opt").length === 4',
    check: function () {
      const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
      document.querySelector('#cnt .opt').click();
      const usable = Boolean(document.querySelector('.result')) && Boolean(document.querySelector('.next-btn'));
      return { ok: noOverflow && usable, message: `noOverflow=${noOverflow}, usable=${usable}` };
    }
  },
  {
    name: 'Kanji Analysis search, round and card details',
    route: '/apps/n1-kanji-analysis/',
    ready: 'document.querySelectorAll(".vocab-card").length === 96',
    check: function () {
      const initial = document.querySelectorAll('.vocab-card').length === 96;
      const card = document.querySelector('.vocab-card');
      card.click();
      const expanded = card.getAttribute('aria-expanded') === 'true' && getComputedStyle(card.querySelector('.card-detail')).display !== 'none';
      const search = document.querySelector('#search-input');
      search.value = '愛嬌';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      const searched = document.querySelectorAll('.vocab-card').length >= 1 && document.querySelectorAll('.vocab-card').length < 96;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-round="1"], .filter-btn:nth-of-type(2)').click();
      const round = Array.from(document.querySelectorAll('.vocab-card .card-round')).every((label) => label.textContent.includes('第1回'));
      return { ok: initial && expanded && searched && round, message: `initial=${initial}, expanded=${expanded}, searched=${searched}, round=${round}` };
    }
  },
  {
    name: 'Kanji Analysis mobile layout and keyboard',
    route: '/apps/n1-kanji-analysis/',
    viewport: { width: 390, height: 844 },
    ready: 'document.querySelectorAll(".vocab-card").length === 96',
    check: function () {
      const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
      const card = document.querySelector('.vocab-card');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const keyboard = card.getAttribute('aria-expanded') === 'true';
      return { ok: noOverflow && keyboard, message: `noOverflow=${noOverflow}, keyboard=${keyboard}` };
    }
  },
  {
    name: 'Kanji Collocations answer, feedback and modes',
    route: '/apps/n1-kanji-collocations/',
    ready: 'document.querySelectorAll(".opt").length === 4',
    check: function () {
      const initial = document.querySelectorAll('.opt').length === 4;
      const wrongIndex = opts.findIndex(option => option !== correctAns);
      document.querySelector(`#opt${wrongIndex}`).click();
      const feedback = Boolean(document.querySelector('.feedback.ng')) && document.querySelector('#nb').classList.contains('show');
      const wrongSaved = document.querySelector('#onsai-count').textContent === '(1)';
      document.querySelector('#nb').click();
      const nextQuestion = document.querySelectorAll('.opt').length === 4;
      document.querySelector('#m-set').click();
      const setMode = document.querySelector('#m-set').classList.contains('active-orange') && Boolean(document.querySelector('.set-tag'));
      return { ok: initial && feedback && wrongSaved && nextQuestion && setMode, message: `initial=${initial}, feedback=${feedback}, wrongSaved=${wrongSaved}, next=${nextQuestion}, setMode=${setMode}` };
    }
  },
  {
    name: 'Kanji Collocations mobile quiz',
    route: '/apps/n1-kanji-collocations/',
    viewport: { width: 390, height: 844 },
    ready: 'document.querySelectorAll(".opt").length === 4',
    check: function () {
      const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
      document.querySelector('.opt').click();
      const usable = Boolean(document.querySelector('.feedback.ok, .feedback.ng')) && document.querySelector('#nb').classList.contains('show');
      document.querySelector('#nb').click();
      const nextQuestion = document.querySelectorAll('.opt').length === 4;
      return { ok: noOverflow && usable && nextQuestion, message: `noOverflow=${noOverflow}, usable=${usable}, next=${nextQuestion}` };
    }
  }
];
const selectedTests = process.env.SMOKE_ROUTE
  ? tests.filter(test => test.route.includes(process.env.SMOKE_ROUTE))
  : tests;
if (!selectedTests.length) throw new Error(`No smoke test matches SMOKE_ROUTE=${process.env.SMOKE_ROUTE}`);

const serverPort = await freePort();
const server = spawn('python3', ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore'
});

try {
  await waitFor(`http://127.0.0.1:${serverPort}/`);
  const origin = `http://127.0.0.1:${serverPort}`;
  for (const test of selectedTests) {
    const debugPort = await freePort();
    const profile = await mkdtemp(resolve(tmpdir(), 'thangldw-smoke-'));
    const chrome = spawn(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      'about:blank'
    ], { stdio: 'ignore' });
    try {
      await waitFor(`http://127.0.0.1:${debugPort}/json/version`);
      const page = await openPage(debugPort);
      await checkPage(page, origin, test);
      page.close();
    } finally {
      await stopProcess(chrome);
      await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  }
  console.log(`Learning smoke tests passed: ${selectedTests.length}/${selectedTests.length}.`);
} finally {
  await stopProcess(server);
}
