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
      if (response.ok) return;
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
    throw new Error(`Timed out waiting for ${expression}`);
  }

  async navigate(url, width) {
    this.exceptions.length = 0;
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
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

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise(resolveWait => setTimeout(resolveWait, 3000))
  ]);
}

function assertResult(name, result, exceptions) {
  if (!result?.ok) throw new Error(`${name}: ${result?.message || 'assertion failed'}`);
  if (exceptions.length) throw new Error(`${name}: ${exceptions.join('; ')}`);
  console.log(`✓ ${name}`);
}

const serverPort = await freePort();
const debugPort = await freePort();
const profile = await mkdtemp(resolve(tmpdir(), 'thangldw-cert-smoke-'));
const server = spawn('python3', ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore'
});
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
  await Promise.all([
    waitFor(`http://127.0.0.1:${serverPort}/`),
    waitFor(`http://127.0.0.1:${debugPort}/json/version`)
  ]);
  const origin = `http://127.0.0.1:${serverPort}`;
  const page = await openPage(debugPort);

  await page.navigate(`${origin}/apps/cert/`, 1280);
  await page.waitUntil('document.querySelectorAll(".project-title-link").length === 9');
  assertResult('Certification library', await page.evaluate(`(() => {
    const cards = [...document.querySelectorAll('.project-title-link')];
    const hrefs = cards.map(card => card.getAttribute('href'));
    return {
      ok: document.title === 'Certification Library'
        && cards.length === 9
        && new Set(hrefs).size === 9
        && hrefs.every(href => /^\\/apps\\/cert\\/[a-z0-9-]+\\/$/.test(href))
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: \`title=\${document.title}, cards=\${cards.length}, unique=\${new Set(hrefs).size}\`
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('G certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      ok: document.title === 'G検定'
        && text.includes('0 of 900 questions answered')
        && !text.includes('42%')
        && !text.includes('How to Use')
        && !document.querySelector('.study-tip'),
      message: \`title=\${document.title}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  assertResult('G Exam Mode', await page.evaluate(`(async () => {
    const button = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Exam Mode');
    button.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const startButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim().startsWith('Start exam'));
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const timer = document.querySelector('.timer-area strong');
    return {
      ok: Boolean(document.querySelector('.question-pane'))
        && /^\\d{2}:\\d{2}$/.test(timer?.textContent || '')
        && !document.querySelector('.hint-note[open]'),
      message: \`start=\${Boolean(startButton)}, question=\${Boolean(document.querySelector('.question-pane'))}, timer=\${timer?.textContent}\`
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/g/`, 390);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('G mobile layout', await page.evaluate(`(() => ({
    ok: document.documentElement.scrollWidth <= window.innerWidth,
    message: \`scrollWidth=\${document.documentElement.scrollWidth}, viewport=\${window.innerWidth}\`
  }))()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/aws/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('AWS certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      ok: document.title === 'AWS SAA'
        && text.includes('0 of 3 questions answered')
        && !text.includes('51%')
        && !text.includes('How to Use')
        && !document.querySelector('.study-tip'),
      message: \`title=\${document.title}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  page.close();
  console.log('CERT smoke tests passed: 5/5.');
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
