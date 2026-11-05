#!/usr/bin/env node

import { spawn, execFileSync } from 'node:child_process';
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
  ...(process.env.DISABLE_BFCACHE === '1' ? ['--disable-features=BackForwardCache'] : []),
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
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
  routes.push('/bizroll/','/neon-glider/','/kakeflow/','/kakeflow/app/','/macinity/','/macinity/guide.html','/macinity/privacy.html','/igo/','/igo/train.html','/igo/review.html','/bjt/workspace.html');
  const labels={en:'Fuel my next build',vi:'Tiếp sức cho dự án mới',ja:'次の開発を応援する',zh:'支持我的下一个项目'};
  const headings={en:['Found this useful? Fuel my next build.','Global','Vietnam'],vi:['Bạn thấy hữu ích? Tiếp sức cho dự án mới.','Quốc tế','Việt Nam'],ja:['役に立ちましたか？次の開発を応援する。','海外から','ベトナム国内'],zh:['觉得有用？支持我的下一个项目。','国际','越南']};
  const report=[];
  for(const route of routes.filter(r=>r!=='/kakeflow/app/'&&(!process.env.SUPPORT_ROUTE||new RegExp(process.env.SUPPORT_ROUTE).test(r)))) {
    for(const width of [1280,390]) {
      try {
        await page.navigate(origin+route,width);
        await page.waitUntil('document.querySelector(".support-floating-trigger span")');
        if(route.endsWith('classic.html'))await new Promise(r=>setTimeout(r,2000));
        const initial=await page.evaluate(`({language:document.documentElement.lang.toLowerCase().split('-')[0],text:document.querySelector('.support-floating-trigger span').textContent})`);
        if(initial.text!==(labels[initial.language]||labels.en))throw Error('Initial label mismatch '+JSON.stringify(initial));
        for(const locale of ['en','vi','ja','zh','ja-JP','zh-TW','fr']) {
          const expected=labels[locale.split('-')[0]]||labels.en;
          await page.evaluate(`(() => {
            const button=document.querySelector('.locale-switch button[data-lang="${locale}"], .locale-switch button[lang="${locale}"]');
            if(button) button.click(); else document.documentElement.lang=${JSON.stringify(locale)};
          })()`);
          await page.waitUntil(`document.querySelector('.support-floating-trigger span')?.textContent===${JSON.stringify(expected)}`,2000);
          const fits=await page.evaluate(`(() => {const b=document.querySelector('.support-floating-trigger'),r=b.getBoundingClientRect();return r.width>0&&r.right<=innerWidth&&r.left>=0})()`);
          if(!fits)throw Error('Button overflow '+locale);
          await page.evaluate(`document.querySelector('.support-floating-trigger').focus(); document.querySelector('.support-floating-trigger').click()`);
          await page.waitUntil('document.querySelector("#supportDialog")?.open && [...document.querySelectorAll("#supportDialog img")].every(i=>i.naturalWidth>0)');
          const translated = headings[locale.split('-')[0]] || headings.en;
          const modal = await page.evaluate(`(() => {
            const d=document.querySelector('#supportDialog'),r=d.getBoundingClientRect(),close=d.querySelector('button').getBoundingClientRect();
            return {headings:[...d.querySelectorAll('h2,h3')].map(e=>e.textContent),lang:d.lang,
              intro:d.querySelector('p').textContent,close:d.querySelector('button').getAttribute('aria-label'),
              alts:[...d.querySelectorAll('img')].map(i=>i.alt),
              fits:d.scrollWidth<=d.clientWidth && r.left>=0 && r.right<=innerWidth && [...d.querySelectorAll('h2,p')].every(e=>{const rect=e.getBoundingClientRect();return rect.right<=close.left || rect.top>=close.bottom}),
              focus:document.activeElement.id};
          })()`);
          if(JSON.stringify(modal.headings)!==JSON.stringify(translated)||!modal.fits||modal.focus!=='supportClose')throw Error('Dialog mismatch '+JSON.stringify(modal));
          if(!modal.lang.startsWith(headings[locale.split('-')[0]]?locale.split('-')[0]:'en'))throw Error('Dialog language mismatch');
          if(['vi','ja','zh'].includes(locale) && (modal.intro.startsWith('Help cover')||modal.close==='Close support options'||modal.alts.some(a=>a.startsWith('QR code')||a.startsWith('ShopeePay QR'))))throw Error('Untranslated dialog accessibility copy');
          if(process.env.SUPPORT_SCREENSHOTS && route==='/index.html' && ['vi','ja'].includes(locale)) {
            await mkdir(process.env.SUPPORT_SCREENSHOTS,{recursive:true});
            const screenshot=await page.send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:900,scale:1}});
            await writeFile(resolve(process.env.SUPPORT_SCREENSHOTS,`support-${locale}-${width}.png`),Buffer.from(screenshot.data,'base64'));
          }
          await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
          await page.waitUntil('!document.querySelector("#supportDialog").open');
          if(!await page.evaluate(`document.activeElement.matches('.support-floating-trigger')`))throw Error('Focus was not restored');
        }
        report.push({route,width,ok:true});console.log('PASS',route,width);
      }catch(e){report.push({route,width,ok:false,error:e.message});console.log('FAIL',route,width,e.message);}
    }
  }
  await writeFile('/tmp/support-locale-audit.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({routes:new Set(report.map(r=>r.route)).size,viewports:report.length,failed:report.filter(r=>!r.ok).length}));
  if(report.some(r=>!r.ok)) process.exitCode=1;

  const localeRoutes=['/','/apps/','/community/','/contact/','/ragops/','/proofline/','/awesome-maintainer-defense/'];
  async function expectLocale(language) {
    await page.waitUntil(`document.documentElement.lang.split('-')[0]===${JSON.stringify(language)} && document.querySelector('.locale-switch button[aria-pressed="true"]')?.matches('[lang="${language}"], [data-lang="${language}"]') && document.querySelector('#supportDialogTitle')?.textContent===${JSON.stringify(headings[language][0])}`);
    if(page.exceptions.length)throw Error(page.exceptions.join('; '));
  }
  await page.navigate(origin+'/',1280);
  await page.evaluate(`sessionStorage.clear(); localStorage.setItem('community.site.locale','ja')`);
  await page.navigate(origin+'/',1280);
  await expectLocale('en');
  await page.send('Page.bringToFront');
  await page.evaluate(`document.querySelector('.locale-switch [lang="vi"]').focus()`);
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await expectLocale('vi');
  for(const route of localeRoutes) {
    await page.navigate(origin+route,1280);
    await expectLocale('vi');
    await page.navigate(origin+route,390);
    await expectLocale('vi');
  }
  console.log('PASS keyboard selection, cross-page navigation, reload, and legacy preference isolation');

  await page.evaluate(`document.querySelector('.locale-switch [data-lang="zh"]').click()`);
  await expectLocale('zh');
  await page.evaluate('history.back()');
  await page.waitUntil(`location.pathname==='/proofline/'`);
  await expectLocale('zh');
  console.log('PASS latest choice on browser Back');

  await page.navigate(origin+'/community/?lang=vi',1280);
  await expectLocale('vi');
  await page.navigate(origin+'/',1280);
  await page.evaluate(`document.querySelector('.locale-switch [lang="zh"]').click()`);
  await expectLocale('zh');
  await page.evaluate('history.back()');
  await page.waitUntil(`location.pathname==='/community/'`);
  await expectLocale('zh');
  if(!await page.evaluate(`new URLSearchParams(location.search).get('lang')==='zh'`))throw Error('Back retained an obsolete language URL');
  console.log('PASS latest choice replaces an obsolete language URL on Back');

  await page.navigate(origin+'/contact/?lang=ja&from=test#main',1280);
  await expectLocale('ja');
  await page.evaluate(`document.querySelector('.locale-switch [lang="en"]').click()`);
  await expectLocale('en');
  if(!await page.evaluate(`location.search.includes('from=test') && location.search.includes('lang=en') && location.hash==='#main'`))throw Error('Language switch lost URL state');
  await page.navigate(origin+'/apps/?lang=invalid',1280);
  await expectLocale('en');
  console.log('PASS explicit language links, English reset, and invalid locale fallback');

  await page.evaluate(`document.querySelector('.locale-switch [data-lang="vi"]').click()`);
  const fresh = await openPage(debugPort);
  await fresh.navigate(origin+'/community/',390);
  await fresh.waitUntil(`document.querySelector('#supportDialogTitle')?.textContent===${JSON.stringify(headings.en[0])}`);
  if(!await fresh.evaluate(`document.documentElement.lang==='en' && sessionStorage.getItem('portfolio.site.locale')===null`))throw Error('New tab inherited an unrelated session');
  await expectLocale('vi');
  fresh.close();
  console.log('PASS independent fresh tab session');

  const blocked=await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Blocked','SecurityError')}})`});
  await page.navigate(origin+'/',390);
  await expectLocale('en');
  await page.evaluate(`document.querySelector('.locale-switch [lang="ja"]').click()`);
  await expectLocale('ja');
  await page.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  console.log('PASS language switching with storage blocked');
  page.close();
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
