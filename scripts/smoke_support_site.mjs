#!/usr/bin/env node

import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
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
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
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
    const before = (await this.send('Page.getFrameTree')).frameTree.frame.loaderId;
    await this.send('Page.navigate', { url });
    for (let i=0;i<150;i++) { if ((await this.send('Page.getFrameTree')).frameTree.frame.loaderId !== before) break; await new Promise(r=>setTimeout(r,100)); }
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
  const routes = [];
  for (const file of execFileSync('git', ['ls-files', '*.html'], {cwd: ROOT, encoding:'utf8'}).trim().split('\n')) {
    if (file.startsWith('_sources/')) continue;
    const html = await readFile(resolve(ROOT, file), 'utf8');
    if (/http-equiv=["']refresh|redirect.js/i.test(html)) continue;
    if (!html.includes('/js/support-dialog.js?v=20261106-i18n') || !html.includes('/css/support-dialog.css?v=20261105-qr')) throw Error(`Missing shared version: ${file}`);
    routes.push('/'+file);
  }
  for (const route of routes.filter(r => !process.env.SUPPORT_ROUTE || r.includes(process.env.SUPPORT_ROUTE))) {
    for (const width of [1280,390]) {
      await page.navigate(origin+route, width);
      await page.waitUntil('document.querySelector(".support-floating-trigger")');
      await page.evaluate(`document.querySelector('.support-floating-trigger').focus(); document.querySelector('.support-floating-trigger').click()`);
      await page.waitUntil('document.querySelector("#supportDialog")?.open && [...document.querySelectorAll("#supportDialog img")].every(i=>i.naturalWidth>0)');
      const result = await page.evaluate(`(() => {
        const d=document.querySelector('#supportDialog'), q=d.querySelector('.support-bank'), b=document.querySelector('.support-floating-trigger');
        return {ok: document.querySelectorAll('#supportDialog').length===1 && d.querySelectorAll('img').length===2 && d.querySelector('h3').textContent==='Global' && q.querySelector('h3').textContent==='Vietnam' && !d.querySelector('details,iframe,a') && getComputedStyle(q).borderTopWidth==='0px' && d.scrollWidth<=d.clientWidth && b.getBoundingClientRect().width>0 && b.textContent===({en:'Fuel my next build',vi:'Tiếp sức cho dự án mới',ja:'次の開発を応援する',zh:'支持我的下一个项目'}[document.documentElement.lang.toLowerCase().split('-')[0]]||'Fuel my next build') && getComputedStyle(b).backgroundColor==='rgb(240, 136, 4)', message: JSON.stringify({label:b.textContent,color:getComputedStyle(b).backgroundColor,width:b.getBoundingClientRect().width,display:getComputedStyle(b).display,parent:b.parentElement.outerHTML.slice(0,300),overflow:[d.scrollWidth,d.clientWidth],border:getComputedStyle(q).borderTopWidth})};
      })()`);
      assertResult(route+' '+width, result, []);
      await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      if(await page.evaluate(`document.querySelector('#supportDialog')?.open`)) throw Error('Escape failed '+route);
    }
  }
  console.log(`Verified shared support on ${routes.length} pages at desktop/mobile widths.`);
  page.close();
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
