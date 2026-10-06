#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
 for(const width of [1280,390]){
 await page.navigate(origin+'/jlpt-n1/',width);await page.waitUntil("document.querySelectorAll('[data-skill]').length>5");await page.evaluate('document.fonts.ready');
 const layout=await page.evaluate(`({ok:document.documentElement.scrollWidth<=innerWidth, cards:document.querySelectorAll('.skill').length})`);assertResult(`JLPT skill layout ${width}`,layout,page.exceptions);
 await page.send('Page.captureScreenshot',{format:'png'}).then(r=>writeFile(`/tmp/jlpt-skills-${width}.png`,Buffer.from(r.data,'base64')));
 await page.evaluate("document.querySelector('[data-skill=\"grammar-choice\"]').click();document.getElementById('count').value='5';document.getElementById('mode').value='scored';document.getElementById('start').click()");await page.waitUntil("document.querySelector('[data-choice]')");
 await page.evaluate("document.querySelector('input[name=confidence][value=unsure]').click();document.querySelector('[data-choice]').click()");
 assertResult(`Visible confidence choices persist ${width}`,await page.evaluate("({ok:document.querySelectorAll('input[name=confidence]').length===2&&!document.querySelector('select#confidence')&&document.querySelector('input[name=confidence]:checked').value==='unsure'&&document.documentElement.scrollWidth<=innerWidth})"),page.exceptions);
 await page.evaluate("document.getElementById('check').click()");await page.waitUntil("document.querySelector('.feedback')&&document.getElementById('next')");
 assertResult(`JLPT response feedback ${width}`,await page.evaluate("({ok:document.querySelectorAll('.choice.correct').length===1&&!!document.querySelector('.feedback').innerText.trim()})"),page.exceptions);
 await page.send('Page.captureScreenshot',{format:'png'}).then(r=>writeFile(`/tmp/jlpt-feedback-${width}.png`,Buffer.from(r.data,'base64')));
 await page.evaluate("document.getElementById('note').value='My recall note';document.getElementById('note').dispatchEvent(new Event('input'));document.getElementById('next').click()");await page.waitUntil("document.querySelector('[data-choice]')&&!document.querySelector('.feedback')");
 await page.send('Page.reload');await page.waitUntil("document.querySelector('[data-choice]')");assertResult(`JLPT refresh resumes without content in storage ${width}`,await page.evaluate("({ok:JSON.parse(localStorage.getItem('jlpt-n1-skills-v1')).state.session.index===1&&!localStorage.getItem('jlpt-n1-skills-v1').includes('explanation')&&!localStorage.getItem('jlpt-n1-skills-v1').includes('choices')})"),page.exceptions);
 await page.evaluate("document.getElementById('finish').click()");await page.waitUntil("document.getElementById('home')");await page.evaluate("document.getElementById('home').click();document.querySelector('[data-skill=\"kanji-reading\"]').click();document.getElementById('mode').value='recall';document.getElementById('count').value='5';document.getElementById('start').click()");await page.waitUntil("document.getElementById('check')&&!document.querySelector('[data-choice]')");await page.evaluate("document.getElementById('check').click()");await page.waitUntil("document.querySelector('[data-rate=good]')");await page.evaluate("document.querySelector('[data-rate=good]').click()");await page.waitUntil("document.getElementById('next')");assertResult(`JLPT self-recall flow ${width}`,{ok:true},page.exceptions);await page.evaluate("document.getElementById('finish').click();location.hash='#progress'");await page.waitUntil("document.getElementById('export')");assertResult(`JLPT progress layout ${width}`,await page.evaluate("({ok:document.documentElement.scrollWidth<=innerWidth})"),page.exceptions);
 }
 for(const width of [320,390,1280]){await page.navigate(origin+'/pmp/',width);await page.evaluate('document.fonts.ready');assertResult(`PMP other certifications header ${width}`,await page.evaluate("({ok:document.querySelector('header a.other-certifications')?.getAttribute('href')==='/cert/'&&document.documentElement.scrollWidth<=innerWidth})"),page.exceptions);}
 await page.navigate(origin+'/apps/',390);await page.waitUntil("document.querySelector('[data-project-id=\"jlpt-n1-skills\"]')");assertResult('Apps exposes standalone N1 practice',await page.evaluate("({ok:document.querySelector('[data-project-id=\"jlpt-n1-skills\"]').getAttribute('href')==='/jlpt-n1/'&&document.documentElement.scrollWidth<=innerWidth})"),page.exceptions);
 await page.navigate(origin+'/cert/',1280);await page.waitUntil("document.querySelectorAll('.hub-cert-tile').length===23");assertResult('Cert catalog uses standalone JLPT route',await page.evaluate("({ok:!!document.querySelector('a[href=\"/jlpt-n1/\"]')})"),page.exceptions);
 for(const width of [320,768]){await page.navigate(origin+'/jlpt-n1/',width);await page.waitUntil("document.querySelector('[data-skill]')");for(const mode of ['light','dark']){await page.evaluate(`if(document.documentElement.dataset.theme!=='${mode}')document.getElementById('themeToggle').click()`);assertResult(`Homepage theme control ${width} ${mode}`,await page.evaluate(`({ok:document.documentElement.dataset.theme==='${mode}'&&!!document.querySelector('#themeToggle i.fa-${mode==='dark'?'sun':'moon'}')&&!!document.querySelector('.site-brand-mark')&&getComputedStyle(document.querySelector('.site-brand-mark')).borderTopWidth==='2px'})`),page.exceptions);assertResult(`JLPT theme layout ${width} ${mode}`,await page.evaluate("({ok:document.documentElement.scrollWidth<=innerWidth})"),page.exceptions);}}
 await page.navigate(origin+'/cert/aws/',1280);try{await page.waitUntil("document.body.innerText.includes('Start today’s plan')",25000);}catch(e){console.log('CERT DEBUG',await page.evaluate("({text:document.body.innerText,exceptions:performance.getEntriesByType('resource').map(r=>r.name)})"),page.exceptions);throw e;}assertResult('Certification API hydration',await page.evaluate("({ok:!document.body.innerText.includes('Failed to fetch')&&!document.body.innerText.includes('Phiên không hợp lệ')})"),page.exceptions);
 await page.navigate(origin+'/jlpt/?skill=grammar-choice#learn',390);await page.waitUntil("location.pathname==='/jlpt-n1/'&&location.search==='?skill=grammar-choice'&&location.hash==='#learn'");assertResult('Old JLPT URL preserves skill and hash',{ok:true},page.exceptions);
 await page.navigate(origin+'/cert/n1-modules/n1-grammar-exams/',390);await page.waitUntil("location.pathname==='/jlpt-n1/'&&document.getElementById('start')");assertResult('Legacy JLPT skill redirect',{ok:true},page.exceptions);

 socket.close();console.log('PASS: standalone skill learning, source feedback, self recall, progress, reload, mobile, legacy redirect, Cert hydration and routes.');
}finally{if(server)await stopProcess(server);await stopProcess(chrome);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
