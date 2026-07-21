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
const ROUTES = [
  '/apps/jlpt-n1/',
  '/apps/n1-vocabulary-tabs/',
  '/apps/n1-kanji-analysis/',
  '/apps/n1-kanji-collocations/',
  '/apps/n1-vocabulary-context/',
  '/apps/n1-vocabulary-paraphrase/',
  '/apps/n1-vocabulary-exams/',
  '/apps/n1-grammar-flashcards/',
  '/apps/n1-grammar-sentence-order/',
  '/apps/n1-grammar-sentence-order-drill/',
  '/apps/n1-grammar-exams/',
  '/apps/n1-reading-75/',
  '/apps/n1-reading-mondai9/'
];
const VIEWPORTS = [390, 680, 1280, 1440];

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
      returnByValue: true
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

  close() { this.socket.close(); }
}

async function openPage(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const page = new CdpPage(socket);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });
  return page;
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([once(child, 'exit'), new Promise(resolveWait => setTimeout(resolveWait, 3000))]);
}

const serverPort = await freePort();
const debugPort = await freePort();
const profile = await mkdtemp(resolve(tmpdir(), 'thangldw-jlpt-qa-'));
const server = spawn('python3', ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const failures = [];
const warnings = [];
const performanceRows = [];

try {
  await Promise.all([
    waitFor(`http://127.0.0.1:${serverPort}/`),
    waitFor(`http://127.0.0.1:${debugPort}/json/version`)
  ]);
  const page = await openPage(debugPort);
  for (const width of VIEWPORTS) {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const route of ROUTES) {
      page.exceptions.length = 0;
      await page.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}${route}?qa=${width}` });
      await page.waitUntil('document.readyState === "complete" && document.querySelectorAll("main").length === 1');
      await new Promise(resolveWait => setTimeout(resolveWait, 100));
      const result = await page.evaluate(`(() => {
        const visible = element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const duplicateIds = [...document.querySelectorAll('[id]')]
          .map(element => element.id)
          .filter((id, index, ids) => ids.indexOf(id) !== index);
        const unnamedButtons = [...document.querySelectorAll('button')]
          .filter(visible)
          .filter(button => !(button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent.trim()))
          .length;
        const unlabeledInputs = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
          .filter(visible)
          .filter(input => !(input.getAttribute('aria-label') || input.getAttribute('title') || input.labels?.length))
          .length;
        const undersizedControlList = [...document.querySelectorAll('button, a[href], input, select, textarea')]
          .filter(visible)
          .map(element => {
            const label = (element.type === 'checkbox' || element.type === 'radio') && element.labels?.[0];
            return { element, rect: (label || element).getBoundingClientRect() };
          })
          .filter(item => item.rect.width < 34 || item.rect.height < 34);
        const entries = performance.getEntriesByType('resource');
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          lang: document.documentElement.lang,
          mainCount: document.querySelectorAll('main').length,
          h1Count: document.querySelectorAll('h1').length,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          duplicateIds: [...new Set(duplicateIds)].length,
          unnamedButtons,
          unlabeledInputs,
          undersizedControls: undersizedControlList.length,
          undersizedSamples: undersizedControlList.slice(0, 3).map(({ element, rect }) => ({
            tag: element.tagName.toLowerCase(),
            className: element.className,
            text: (element.getAttribute('aria-label') || element.textContent).trim().slice(0, 24),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          })),
          brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).length,
          mojibake: /\uFFFD|Ã©|â€™|â€œ|â€|ðŸ/.test(document.body.innerText),
          decodedKB: Math.round(entries.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), navigation?.decodedBodySize || 0) / 1024),
          loadMs: Math.round(navigation?.duration || 0)
        };
      })()`);
      const key = `${route} @ ${width}px`;
      const hard = ['mainCount', 'h1Count', 'overflow', 'duplicateIds', 'unnamedButtons', 'unlabeledInputs', 'brokenImages', 'mojibake'];
      for (const field of hard) {
        const expected = field === 'mainCount' || field === 'h1Count' ? 1 : field === 'overflow' || field === 'mojibake' ? false : 0;
        if (result[field] !== expected) failures.push(`${key}: ${field}=${result[field]}`);
      }
      if (!['vi', 'ja'].includes(result.lang)) failures.push(`${key}: lang=${result.lang || '(missing)'}`);
      if (page.exceptions.length) failures.push(`${key}: console=${page.exceptions.join(' | ')}`);
      if (result.undersizedControls) warnings.push(`${key}: undersizedControls=${result.undersizedControls} ${JSON.stringify(result.undersizedSamples)}`);
      if (result.decodedKB > 2500) warnings.push(`${key}: decodedKB=${result.decodedKB}`);
      performanceRows.push({ route, width, decodedKB: result.decodedKB, loadMs: result.loadMs });
    }
  }
  page.close();
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

const desktopPerformance = performanceRows.filter(row => row.width === 1440);
console.table(desktopPerformance);
console.log(`JLPT N1 matrix checked: ${ROUTES.length} routes × ${VIEWPORTS.length} viewports = ${performanceRows.length} renders.`);
if (warnings.length) console.log(`Warnings (${warnings.length}):\n${warnings.join('\n')}`);
if (failures.length) {
  console.error(`Failures (${failures.length}):\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('JLPT N1 structural, language, accessibility and responsive gates passed.');
}
