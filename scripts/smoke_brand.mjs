import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const debugPort=await freePort(),profile=await mkdtemp(resolve(tmpdir(),'jlpt-skills-smoke-'));
const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8797';
const server=process.env.SITE_ORIGIN?null:spawn(PYTHON,['-m','http.server','8797','--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
try{
 await waitFor(`http://127.0.0.1:${debugPort}/json/version`);const tab=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();const socket=new WebSocket(tab.webSocketDebuggerUrl);await once(socket,'open');const page=new CdpPage(socket);await page.send('Page.enable');await page.send('Runtime.enable');
 if(server)await waitFor(origin+'/jlpt-n1/');
 const routes=JSON.parse(await readFile(resolve(ROOT,'scripts/brand-routes.json'),'utf8')),reports=[];
 for(const route of routes){for(const width of [1280,390]){await page.navigate(origin+route,width);try{await page.waitUntil("document.querySelector('.site-brand')",10000);}catch{reports.push({route,width,absent:true});continue;}await page.evaluate('document.fonts.ready');for(const theme of ['light','dark']){await page.evaluate(`document.documentElement.dataset.theme='${theme}'`);await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1000,y:700});await new Promise(r=>setTimeout(r,230));const before=await page.evaluate(`(()=>{const a=document.querySelector('.site-brand'),m=a.querySelector('.site-brand-mark'),r=a.getBoundingClientRect();return{anchor:getComputedStyle(a).color,mark:getComputedStyle(m).color,border:getComputedStyle(m).borderTopColor,width:r.width,height:r.height,x:r.x+r.width/2,y:r.y+r.height/2}})()`);await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});await new Promise(r=>setTimeout(r,230));const hovered=await page.evaluate(`(()=>{const a=document.querySelector('.site-brand'),m=a.querySelector('.site-brand-mark'),r=a.getBoundingClientRect();return{anchor:getComputedStyle(a).color,mark:getComputedStyle(m).color,border:getComputedStyle(m).borderTopColor,decoration:getComputedStyle(a).textDecorationLine,spanDecoration:Array.from(a.querySelectorAll('span')).map(s=>getComputedStyle(s).textDecorationLine),width:r.width,height:r.height}})()`);await page.evaluate("document.querySelector('.site-brand').focus()");for(const modifiers of [0,8]){await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers});}const focused=await page.evaluate(`(()=>{const a=document.querySelector('.site-brand'),m=a.querySelector('.site-brand-mark');return{visible:a.matches(':focus-visible'),decoration:getComputedStyle(a).textDecorationLine,ring:[a,m].some(n=>getComputedStyle(n).outlineStyle!=='none'&&parseFloat(getComputedStyle(n).outlineWidth)>=2)}})()`);reports.push({route,width,theme,before,hovered,focused});await page.evaluate("document.querySelector('.site-brand').blur()");if(process.env.BRAND_SCREENSHOTS==='1'&&(route==='/'||route==='/jlpt-n1/'||route==='/cert/'))await page.send('Page.captureScreenshot',{format:'png'}).then(r=>writeFile(`/tmp/brand-${process.env.AUDIT_PHASE||'before'}-${route.replaceAll('/','')||'home'}-${theme}.png`,Buffer.from(r.data,'base64')));}console.log(route,width);}}
 const failures=[];for(const report of reports){if(report.absent){failures.push(report.route+': missing logo');continue;}const home=reports.find(x=>x.route==='/'&&x.theme===report.theme&&x.width===report.width);const h=report.hovered,b=report.before;if(h.decoration!=='none'||h.spanDecoration.some(x=>x!=='none'))failures.push(report.route+': underlined logo');if(h.anchor!==b.anchor||h.mark!==home.hovered.mark||h.border!==home.hovered.border)failures.push(report.route+': logo colors differ from homepage');if(!report.focused.visible||!report.focused.ring||report.focused.decoration!=='none')failures.push(report.route+': inaccessible keyboard focus');if(h.width!==b.width||h.height!==b.height)failures.push(report.route+': hover changes geometry');}if(failures.length)throw new Error(failures.join('\n'));console.log('PASS: '+reports.length+' light/dark hover states match homepage.');
await writeFile('/tmp/brand-'+(process.env.AUDIT_PHASE||'before')+'.json',JSON.stringify(reports,null,2));console.log('Header states:',reports.length);

}finally{if(server)await stopProcess(server);await stopProcess(chrome);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
