#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PYTHON = process.env.PYTHON_BIN || '/usr/bin/python3';

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

  async navigate(url, width, height = 900) {
    this.exceptions.length = 0;
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
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
const server = spawn(PYTHON, ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
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
  const origin = process.env.SITE_ORIGIN || `http://127.0.0.1:${serverPort}`;
  const page = await openPage(debugPort);
  for (const width of [1280, 390]) {
    await page.navigate(`${origin}/apps/japan-pr-guide/?migration=1#historical`, width);
    await page.waitUntil('location.pathname === "/japan-pr-guide/" && document.querySelector("#root button")');
    assertResult(`Japan PR Guide migration ${width}`, await page.evaluate(`(() => ({
      ok: location.search === '?migration=1' && location.hash === '#historical'
        && document.querySelector('link[rel="canonical"]')?.href === 'https://thangldw.github.io/japan-pr-guide/'
        && document.documentElement.scrollWidth <= innerWidth,
      message: location.href + ', width=' + document.documentElement.scrollWidth + '/' + innerWidth
    }))()`), page.exceptions);
  }

  const screenshots = process.env.SCREENSHOT_DIR || '/tmp/japan-pr-donate-preview';
  await mkdir(screenshots, { recursive: true });
  for (const width of [1280, 390]) {
    await page.navigate(`${origin}/japan-pr-guide/`, width);
    await page.waitUntil('document.querySelector(".workflow-steps button")');
    assertResult(`No premature donation prompt ${width}`, await page.evaluate(`({ok: !document.querySelector('.project-support, .support-floating-trigger')})`), page.exceptions);
    await page.evaluate(`window.supportEvents = []; window.umami = { track: (event, data) => supportEvents.push({event, data}) }; document.querySelector('.score-inspector button').click()`);
    await page.waitUntil('document.querySelector(".project-support")');
    await page.evaluate(`document.querySelector('.project-support').scrollIntoView({behavior:'instant'}); document.querySelector('.project-support summary').focus()`);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await page.waitUntil('document.querySelector(".project-support details").open');
    await page.waitUntil('supportEvents.some(e => e.event === "support_open")');
    assertResult(`Contextual donation and keyboard ${width}`, await page.evaluate(`({
      ok: document.documentElement.scrollWidth <= innerWidth
        && document.activeElement.matches('.project-support summary')
        && document.querySelector('.project-support a').href === 'https://ko-fi.com/F4N224DDUV'
        && document.querySelector('.project-support a[download]').getAttribute('href') === '/assets/support-vietqr-mb.jpg'
        && supportEvents.every(e => Object.keys(e.data).sort().join(',') === 'location,project'),
      message: 'layout, focus, destination or analytics payload mismatch'
    })`), page.exceptions);
    await page.evaluate(`document.querySelector('.project-support').scrollIntoView({block:'start',behavior:'instant'})`);
    await page.waitUntil('document.querySelector(".project-support").getBoundingClientRect().top >= -1 && document.querySelector(".project-support").getBoundingClientRect().bottom <= innerHeight');
    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${screenshots}/support-${width}.png`, Buffer.from(shot.data, 'base64'));
    await page.evaluate(`document.querySelector('.project-support summary').click()`);
    await page.waitUntil('!document.querySelector(".project-support details").open');
    const compact = await page.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${screenshots}/compact-${width}.png`, Buffer.from(compact.data, 'base64'));
    await page.evaluate(`document.querySelector('.screen-actions .primary-button').click()`);
    await page.waitUntil('document.querySelector(".historical-rail .primary-button")');
    await page.evaluate(`document.querySelector('.historical-rail .primary-button').click()`);
    await page.waitUntil('document.querySelector(".requirements-list")');
    await page.evaluate(`document.querySelector('.screen-actions .primary-button').click()`);
    await page.waitUntil('document.querySelector("#support-title-application-plan")');
    assertResult(`Checklist remains available ${width}`, await page.evaluate(`({ok: !!document.querySelector('.workflow-content input[type="checkbox"]') && !document.querySelector('.project-support details').open})`), page.exceptions);
  }
  const catalog = await fetch(`${origin}/js/projects-data.json`).then(r => r.json());
  if (!JSON.stringify(catalog).includes('"href":"/japan-pr-guide/"')) throw new Error('Catalog URL mismatch');
  console.log('Japan PR Guide migration smoke passed.');
  page.close();
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
