#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
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
  if (!child || child.exitCode !== null) return;
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

const serverPort = 8797;
const debugPort = await freePort();
const profile = await mkdtemp(resolve(tmpdir(), 'thangldw-cert-smoke-'));
const server = process.env.SITE_ORIGIN ? null : spawn(PYTHON, ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
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
    ...(server ? [waitFor(`http://127.0.0.1:${serverPort}/`)] : []),
    waitFor(`http://127.0.0.1:${debugPort}/json/version`)
  ]);
  const origin=process.env.SITE_ORIGIN || `http://127.0.0.1:${serverPort}`;
  const page=await openPage(debugPort);
  await page.send('Network.enable');
  // Shell verification must not create content API sessions or retrieve protected questions.
  await page.send('Network.setBlockedURLs',{urls:['*cert-content-api.bizroll-game.workers.dev/*']});
  const catalog=JSON.parse(await readFile(resolve(ROOT,'_sources/learning/src/bank-api/catalog.json'),'utf8'));
  const routes=[{slug:'learning',shortName:'Learning'},...catalog.certifications.filter(c=>c.id!=='pmp')];
  for(const route of routes) {
    for(const width of [1280,390]) {
      await page.navigate(`${origin}/${route.slug}/`,width);
      await page.waitUntil('document.querySelector("#root .prototype") && !document.querySelector("[data-learning-fallback]") && document.querySelector("#themeToggle")');
      await page.evaluate('document.fonts.ready');
      const layout=await page.evaluate(`(() => {
        const styles=[...document.querySelectorAll('link[rel="stylesheet"]')];
        const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
        return {ok:document.querySelectorAll('main').length===1 && document.querySelectorAll('h1').length===1 &&
          document.querySelectorAll('header.site-header').length===1 && document.querySelectorAll('footer.site-foot').length===1 &&
          ids.length===new Set(ids).size && document.documentElement.scrollWidth<=innerWidth &&
          document.querySelector('.bank-header-label').textContent===${JSON.stringify(route.shortName)} &&
          styles.at(-1).getAttribute('href')==='/css/site-shell.css?v=20261011vi' &&
          !document.querySelector('script[src*="analytics"], script[data-website-id]'),
          message:JSON.stringify({title:document.title,h1:document.querySelector('h1')?.textContent,overflow:[document.documentElement.scrollWidth,innerWidth]})};
      })()`);
      assertResult(`${route.slug} ${width}: rendered landmarks, title, CSS order, layout, no tracking`,layout,page.exceptions);
      for(const theme of ['dark','light']) {
        await page.evaluate(`if(document.documentElement.dataset.theme!==${JSON.stringify(theme)})document.querySelector('#themeToggle').click()`);
        await page.waitUntil(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
        const palette=await page.evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim()`);
        if(palette!==(theme==='dark'?'#11150e':'#ffffff'))throw Error('Canonical palette mismatch '+route.slug+' '+theme+' '+palette);
      }
      if(process.env.LEARNING_SCREENSHOTS && ['learning','aws','bjt'].includes(route.slug)) {
        await mkdir(process.env.LEARNING_SCREENSHOTS,{recursive:true});
        const screenshot=await page.send('Page.captureScreenshot',{format:'png'});
        await writeFile(resolve(process.env.LEARNING_SCREENSHOTS,`${route.slug}-${width}.png`),Buffer.from(screenshot.data,'base64'));
      }
    }
  }
  await page.navigate(origin+'/aws/',390);
  await page.waitUntil('document.querySelector("#themeToggle")');
  await page.evaluate(`document.querySelector('.support-floating-trigger').focus()`);
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await page.waitUntil('document.querySelector("#supportDialog").open && document.activeElement.id==="supportClose"');
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await page.waitUntil('!document.querySelector("#supportDialog").open && document.activeElement.matches(".support-floating-trigger")');
  console.log('PASS keyboard dialog open, Escape, and focus restoration');

  await page.send('Emulation.setScriptExecutionDisabled',{value:true});
  for(const route of ['learning','aws','bjt']) {
    for(const width of [1280,390]) {
      await page.navigate(`${origin}/${route}/`,width);
      const fallback=await page.evaluate(`({ok:document.querySelector('[data-learning-fallback]')?.getBoundingClientRect().height>0 && document.querySelectorAll('main').length===1 && document.querySelectorAll('h1').length===1 && document.documentElement.scrollWidth<=innerWidth && document.body.innerText.includes('Bật JavaScript') && [...document.querySelectorAll('main a')].some(a=>a.textContent==='tải lại trang'),message:document.title})`);
      assertResult(`${route} ${width}: usable no-JavaScript fallback`,fallback,page.exceptions);
      if(process.env.LEARNING_SCREENSHOTS && route==='aws' && width===390) {
        const screenshot=await page.send('Page.captureScreenshot',{format:'png'});
        await writeFile(resolve(process.env.LEARNING_SCREENSHOTS,'aws-no-js-390.png'),Buffer.from(screenshot.data,'base64'));
      }
    }
  }
  await page.send('Emulation.setScriptExecutionDisabled',{value:false});
  await page.navigate(origin+'/aws/',390);
  await page.waitUntil('!document.querySelector("[data-learning-fallback]") && document.querySelector("#themeToggle")');
  console.log('PASS app recovery after JavaScript is restored');
  if(process.env.LEARNING_LIVE_INDEX==='1') {
    await page.waitUntil('document.querySelector(".bank-practice [role=alert] button")');
    await page.send('Network.setBlockedURLs',{urls:[]});
    await page.evaluate('document.querySelector(".bank-practice [role=alert] button").click()');
    await page.waitUntil('document.querySelectorAll(".bank-setup select").length===2',25000);
    assertResult('AWS index recovers through Retry without starting practice',await page.evaluate(`({ok:!document.querySelector('.bank-practice [role=alert]') && document.querySelector('.bank-setup select').options.length>1 && !document.querySelector('.question-toolbar')})`),page.exceptions);
    if(process.env.LEARNING_SCREENSHOTS) {
      const screenshot=await page.send('Page.captureScreenshot',{format:'png'});
      await writeFile(resolve(process.env.LEARNING_SCREENSHOTS,'aws-index-ready-390.png'),Buffer.from(screenshot.data,'base64'));
    }
  }
  for(const [route,target] of [['g','g-kentei'],['jlpt','jlpt-n1']]) {
    await page.navigate(`${origin}/${route}/classic.html?view=practice#saved`,390);
    await page.waitUntil(`location.pathname==='/${target}/' && location.search==='?view=practice' && location.hash==='#saved'`);
  }
  console.log('PASS classic redirects preserve query and hash');
  console.log(`Verified ${routes.length} generated routes at two widths, both themes, keyboard, fallback, and recovery.`);
  page.close();
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
