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
  const certificationManifest = await fetch(
    `${origin}/apps/cert/certifications-manifest.json`,
    { cache: 'no-store' }
  ).then(response => response.json());
  if (
    certificationManifest.schemaVersion !== '1.0'
    || certificationManifest.certificationCount !== certificationManifest.certifications.length
  ) {
    throw new Error('Certification manifest is invalid.');
  }
  const page = await openPage(debugPort);

  await page.navigate(`${origin}/`, 1280);
  await page.evaluate('document.fonts.ready');
  const canonicalFontFamily = await page.evaluate('getComputedStyle(document.body).fontFamily');
  const sharedFontPaths = [
    ['/', 'Homepage font'],
    ['/404.html', '404 font'],
    ['/apps/', 'Apps catalog font'],
    ['/apps/japan-pr-guide/', 'Japan PR Guide font'],
    ['/apps/cert/', 'Certification library font'],
    ['/apps/cert/g/', 'Certification child font']
  ];
  for (const [fontPath, fontLabel] of sharedFontPaths) {
    await page.navigate(`${origin}${fontPath}`, 1280);
    await page.evaluate('document.fonts.ready');
    assertResult(fontLabel, await page.evaluate(`(() => {
      const actual = getComputedStyle(document.body).fontFamily;
      const control = document.querySelector('button, input, select, textarea');
      const actualControl = control ? getComputedStyle(control).fontFamily : actual;
      const heading = document.querySelector('h1');
      const actualHeading = heading ? getComputedStyle(heading).fontFamily : actual;
      const expected = ${JSON.stringify(canonicalFontFamily)};
      return {
        ok: document.fonts.check('16px Inter')
          && actual === expected
          && actualControl === expected
          && actualHeading === expected,
        message: 'loaded=' + document.fonts.check('16px Inter')
          + ', expected=' + expected
          + ', actual=' + actual
          + ', control=' + actualControl
          + ', heading=' + actualHeading
      };
    })()`), page.exceptions);
  }

  await page.navigate(`${origin}/apps/`, 1280);
  await page.waitUntil('document.querySelector(".project-title-link")');
  assertResult('Apps catalog shared project cards', await page.evaluate(`(() => {
    const card = document.querySelector('.project-title-link');
    const style = getComputedStyle(card);
    return {
      ok: style.display === 'flex'
        && style.flexDirection === 'column'
        && style.minHeight === '210px'
        && style.padding === '18px'
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: \`display=\${style.display}, direction=\${style.flexDirection}, minHeight=\${style.minHeight}, padding=\${style.padding}\`
    };
  })()`), page.exceptions);

  assertResult('Toolbox releases in the apps catalog', await page.evaluate(`(() => {
    const cards = [...document.querySelectorAll('.project-card')];
    const byTitle = title => cards.find(card => card.querySelector('h2')?.textContent.trim() === title);
    const diskora = byTitle('Diskora');
    const changeora = byTitle('Changeora');
    const releaseUrl = 'https://github.com/thangldw/toolbox/releases/tag/v1.3.0';
    return {
      ok: diskora?.querySelector('.project-status')?.textContent.trim() === 'v1.2.0'
        && changeora?.querySelector('.project-status')?.textContent.trim() === 'v1.3.0'
        && diskora?.querySelector('a')?.href === releaseUrl
        && changeora?.querySelector('a')?.href === releaseUrl
        && diskora.textContent.includes('Undo Center')
        && changeora.textContent.includes('FSEvents'),
      message: 'diskora=' + diskora?.textContent.trim() + ', changeora=' + changeora?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('KakeFlow landing page in the apps catalog', await page.evaluate(`(() => {
    const card = [...document.querySelectorAll('.project-card')]
      .find(candidate => candidate.querySelector('h2')?.textContent.trim() === 'KakeFlow');
    return {
      ok: card?.querySelector('a')?.href === 'https://thangldw.github.io/kakeflow/'
        && card?.querySelector('.project-status')?.textContent.trim() === 'v1.2.0'
        && card.textContent.includes('MIT License')
        && card.textContent.includes('Open KakeFlow'),
      message: 'kakeflow=' + card?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('Certification manifest updates portfolio catalogs', await page.evaluate(`(() => {
    const manifest = window.portfolioCertificationManifest;
    const card = [...document.querySelectorAll('.project-card')]
      .find(candidate => candidate.querySelector('h2')?.textContent.trim() === 'Certification Library');
    return {
      ok: manifest?.schemaVersion === '1.0'
        && manifest.certificationCount === manifest.certifications.length
        && card?.textContent.includes(manifest.certificationCount + ' certifications'),
      message: 'count=' + manifest?.certificationCount + ', card=' + card?.textContent.trim()
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/`, 1280);
  await page.waitUntil('document.querySelector("#projectRail .resume-project")');
  assertResult('Toolbox releases in home side projects', await page.evaluate(`(() => {
    const projects = [...document.querySelectorAll('#projectRail .resume-project')];
    const byTitle = title => projects.find(project => project.querySelector('h3')?.textContent.trim() === title);
    const diskora = byTitle('Diskora');
    const changeora = byTitle('Changeora');
    const releaseUrl = 'https://github.com/thangldw/toolbox/releases/tag/v1.3.0';
    return {
      ok: diskora?.href === releaseUrl
        && changeora?.href === releaseUrl
        && diskora.textContent.includes('Undo Center')
        && changeora.textContent.includes('FSEvents'),
      message: 'diskora=' + diskora?.textContent.trim() + ', changeora=' + changeora?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('KakeFlow landing page in home side projects', await page.evaluate(`(() => {
    const project = [...document.querySelectorAll('#projectRail .resume-project')]
      .find(candidate => candidate.querySelector('h3')?.textContent.trim() === 'KakeFlow');
    return {
      ok: project?.href === 'https://thangldw.github.io/kakeflow/'
        && project.textContent.includes('Open-source local-first household finance'),
      message: 'kakeflow=' + project?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('Support dialog uses explicit external and local payment destinations', await page.evaluate(`(async () => {
    const trigger = document.querySelector('.support-floating-trigger');
    const dialog = document.querySelector('#supportDialog');
    trigger?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const sponsorForm = dialog?.querySelector('.sponsor-form');
    const closeButton = dialog?.querySelector('#supportClose');
    const heading = dialog?.querySelector('.support-dialog-heading');
    const headingStyle = heading ? getComputedStyle(heading) : null;
    const supportKicker = heading?.querySelector('.support-kicker');
    const supportKickerStyle = supportKicker ? getComputedStyle(supportKicker) : null;
    const intro = dialog?.querySelector('#supportDialogIntro');
    const introStyle = intro ? getComputedStyle(intro) : null;
    const international = dialog?.querySelector('.support-international');
    const bank = dialog?.querySelector('.support-bank');
    const qr = dialog?.querySelector('.support-bank img');
    const result = {
      ok: dialog?.open === true
        && closeButton?.textContent.trim() === '×'
        && closeButton?.getAttribute('aria-label') === 'Close support options'
        && headingStyle?.display === 'block'
        && headingStyle?.position === 'static'
        && headingStyle?.height !== '75px'
        && headingStyle?.paddingLeft === '0px'
        && parseFloat(headingStyle?.paddingRight) <= 36
        && supportKickerStyle?.fontFamily === getComputedStyle(document.body).fontFamily
        && introStyle?.whiteSpace === 'normal'
        && intro?.scrollWidth <= intro?.clientWidth
        && Math.abs(international?.getBoundingClientRect().width - bank?.getBoundingClientRect().width) <= 2
        && sponsorForm?.action === 'https://github.com/sponsors/thangldw/sponsorships'
        && sponsorForm?.target === '_blank'
        && dialog?.querySelector('.support-kofi-button')?.href === 'https://ko-fi.com/F4N224DDUV'
        && dialog?.querySelector('.support-kofi-button img')?.src === 'https://storage.ko-fi.com/cdn/kofi6.png?v=6'
        && dialog?.querySelector('#kofiframe') === null
        && dialog?.querySelectorAll('.support-option-icon').length === 0
        && dialog?.querySelectorAll('.fa-github, .fa-wallet').length === 0
        && qr?.getAttribute('src') === '/assets/support-vietqr-mb.jpg'
        && qr?.complete === true
        && qr?.naturalWidth === 845,
      message: 'open=' + dialog?.open
        + ', heading=' + headingStyle?.display + '/' + headingStyle?.position + '/' + headingStyle?.height
        + '/' + headingStyle?.paddingLeft + '/' + headingStyle?.paddingRight
        + ', kickerFont=' + supportKickerStyle?.fontFamily
        + ', intro=' + introStyle?.whiteSpace + '/' + intro?.scrollWidth + '/' + intro?.clientWidth
        + ', columns=' + international?.getBoundingClientRect().width + '/' + bank?.getBoundingClientRect().width
        + ', sponsor=' + sponsorForm?.action
        + ', target=' + sponsorForm?.target
        + ', kofi=' + dialog?.querySelector('.support-kofi-button')?.href
        + ', qrSrc=' + qr?.getAttribute('src')
        + ', qr=' + qr?.naturalWidth + 'x' + qr?.naturalHeight
    };
    dialog?.close();
    return result;
  })()`), page.exceptions);

  const sharedSupportPaths = [
    ['/apps/', 'Apps catalog'],
    ['/apps/japan-pr-guide/', 'Japan PR Guide'],
    ['/apps/cert/', 'Certification library support'],
    ['/apps/cert/g/', 'Certification child support']
  ];
  for (const [supportPath, supportLabel] of sharedSupportPaths) {
    await page.navigate(`${origin}${supportPath}`, 1280);
    await page.waitUntil('document.querySelector(".support-floating-trigger")');
    assertResult(supportLabel, await page.evaluate(`(async () => {
      const trigger = document.querySelector('.support-floating-trigger');
      const dialog = document.querySelector('#supportDialog');
      trigger?.click();
      await new Promise(resolveWait => setTimeout(resolveWait, 50));
      const sponsorForm = dialog?.querySelector('.sponsor-form');
      const amountLabel = dialog?.querySelector('.sponsor-amount-label');
      const intro = dialog?.querySelector('#supportDialogIntro');
      const international = dialog?.querySelector('.support-international');
      const bank = dialog?.querySelector('.support-bank');
      const qr = dialog?.querySelector('.support-bank img');
      const triggerRect = trigger?.getBoundingClientRect();
      const isJapanGuide = window.location.pathname === '/apps/japan-pr-guide/';
      const result = {
        ok: triggerRect?.width > 0
          && triggerRect?.height > 0
          && dialog?.open === true
          && sponsorForm?.action === 'https://github.com/sponsors/thangldw/sponsorships'
          && dialog?.querySelector('.support-kofi-button')?.href === 'https://ko-fi.com/F4N224DDUV'
          && dialog?.querySelectorAll('.support-option-icon').length === 0
          && dialog?.querySelectorAll('.fa-github, .fa-wallet').length === 0
          && getComputedStyle(intro).whiteSpace === 'normal'
          && intro.scrollWidth <= intro.clientWidth
          && (isJapanGuide || Math.abs(international.getBoundingClientRect().width - bank.getBoundingClientRect().width) <= 2)
          && dialog.scrollWidth <= dialog.clientWidth
          && dialog.scrollHeight <= dialog.clientHeight
          && (!isJapanGuide || (
            dialog.classList.contains('support-dialog--japan')
            && getComputedStyle(amountLabel).display === 'flex'
            && amountLabel.getBoundingClientRect().height < 30
          ))
          && qr?.getAttribute('src') === '/assets/support-vietqr-mb.jpg'
          && qr?.complete === true
          && qr?.naturalWidth === 845,
        message: 'trigger=' + triggerRect?.width + 'x' + triggerRect?.height
          + ', open=' + dialog?.open
          + ', sponsor=' + sponsorForm?.action
          + ', kofi=' + dialog?.querySelector('.support-kofi-button')?.href
          + ', dialog=' + dialog?.clientWidth + 'x' + dialog?.clientHeight
          + ', scroll=' + dialog?.scrollWidth + 'x' + dialog?.scrollHeight
          + ', amountLabel=' + amountLabel?.getBoundingClientRect().height + '/' + getComputedStyle(amountLabel).display
          + ', qr=' + qr?.naturalWidth + 'x' + qr?.naturalHeight
      };
      dialog?.close();
      return result;
    })()`), page.exceptions);
  }

  await page.evaluate(`localStorage.removeItem("theme")`);
  await page.navigate(`${origin}/apps/cert/`, 1280);
  await page.waitUntil(
    `document.querySelectorAll(".hub-cert-card").length === ${certificationManifest.certificationCount}`
  );
  assertResult('Certification library', await page.evaluate(`(() => {
    const cards = [...document.querySelectorAll('.hub-cert-card')];
    const hrefs = cards.map(card => card.getAttribute('href'));
    const expectedHrefs = ${JSON.stringify(
      certificationManifest.certifications.map(certification => certification.href)
    )};
    const style = getComputedStyle(cards[0]);
    return {
      ok: document.title === 'Certification Library'
        && document.documentElement.dataset.theme === 'light'
        && document.querySelector('.hub-theme-toggle')?.getAttribute('aria-label') === 'Switch to dark theme'
        && cards.length === ${certificationManifest.certificationCount}
        && new Set(hrefs).size === ${certificationManifest.certificationCount}
        && hrefs.every(href => expectedHrefs.includes(href))
        && style.display === 'flex'
        && style.flexDirection === 'column'
        && style.minHeight === '210px'
        && style.padding === '18px'
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: \`title=\${document.title}, theme=\${document.documentElement.dataset.theme}, cards=\${cards.length}, unique=\${new Set(hrefs).size}, minHeight=\${style.minHeight}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.setItem("theme", "dark")`);
  await page.navigate(`${origin}/apps/cert/`, 2048);
  await page.waitUntil(
    `document.documentElement.dataset.theme === "dark" && document.querySelectorAll(".hub-cert-card").length === ${certificationManifest.certificationCount}`
  );
  assertResult('Certification library dark canvas fills wide viewports', await page.evaluate(`(() => {
    const htmlBackground = getComputedStyle(document.documentElement).backgroundColor;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const hubBackground = getComputedStyle(document.querySelector('.certification-hub')).backgroundColor;
    return {
      ok: htmlBackground === 'rgb(17, 19, 15)'
        && bodyBackground === 'rgb(17, 19, 15)'
        && hubBackground === 'rgb(17, 19, 15)'
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'html=' + htmlBackground
        + ', body=' + bodyBackground
        + ', hub=' + hubBackground
        + ', viewport=' + window.innerWidth
    };
  })()`), page.exceptions);

  const childThemeChecks = [];
  for (const slug of certificationManifest.certifications.map(certification => certification.slug)) {
    await page.navigate(`${origin}/apps/cert/${slug}/`, 1280);
    await page.waitUntil('document.querySelector(".metric-grid")');
    const result = await page.evaluate(`(async () => {
      await new Promise(resolveWait => setTimeout(resolveWait, 100));
      return {
        theme: document.documentElement.dataset.theme,
        locked: document.documentElement.dataset.themeLocked,
        toggleCount: document.querySelectorAll("#themeToggle").length,
        storedTheme: localStorage.getItem("theme")
      };
    })()`);
    childThemeChecks.push({ slug, ...result, exceptions: [...page.exceptions] });
  }
  assertResult('Child certifications honor the stored theme without local toggles', {
    ok: childThemeChecks.every(check =>
      check.theme === 'dark'
      && check.locked === undefined
      && check.toggleCount === 0
      && check.storedTheme === 'dark'
      && check.exceptions.length === 0
    ),
    message: JSON.stringify(childThemeChecks)
  }, []);

  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('G certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      ok: document.title === 'G検定'
        && document.documentElement.lang === 'ja'
        && text.includes('0 unassisted · 0 hint-assisted')
        && text.includes('Start with a quick diagnostic')
        && text.includes('Start 7 questions')
        && text.includes('Score unlocks after 40 unassisted answers, all domains, and one full mock.')
        && text.includes('Your study data is saved only in this browser')
        && text.includes('Backup or restore')
        && !text.includes('42%')
        && !text.includes('How to Use')
        && !document.querySelector('.self-study-path')
        && !document.querySelector('.study-tip'),
      message: \`title=\${document.title}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  assertResult('G guided domain learning session', await page.evaluate(`(async () => {
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Study by Domain')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const startButton = document.querySelector('.module-card button:not([disabled])');
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const activeNavigation = document.querySelector('.nav-item.active span')?.textContent.trim();
    const vietnameseDisclosure = document.querySelector('.vietnamese-question-wrap');
    const vietnameseClosedByDefault = vietnameseDisclosure?.open === false;
    vietnameseDisclosure?.querySelector('summary')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const vietnameseOpensOnRequest = vietnameseDisclosure?.open === true;
    const text = document.body.innerText;
    return {
      ok: activeNavigation === 'Study by Domain'
        && !document.querySelector('.learn-mode-primer')
        && !text.includes('CONCEPT BRIEFING')
        && vietnameseClosedByDefault
        && vietnameseOpensOnRequest,
      message: \`start=\${Boolean(startButton)}, active=\${activeNavigation}, primer=\${Boolean(document.querySelector('.learn-mode-primer'))}, vietnamese=\${vietnameseClosedByDefault}/\${vietnameseOpensOnRequest}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');

  assertResult('G key-term active recall', await page.evaluate(`(async () => {
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Terms & Notes')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Active recall')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const reveal = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Reveal definition');
    return { ok: Boolean(document.querySelector('.term-recall-card')) && Boolean(reveal), message: \`card=\${Boolean(document.querySelector('.term-recall-card'))}, reveal=\${Boolean(reveal)}\` };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');

  assertResult('G self-study confidence capture', await page.evaluate(`(async () => {
    const startButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Start 7 questions');
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const hintButton = document.querySelector('.hint-reveal-button');
    const closedHintStyle = getComputedStyle(hintButton);
    const mutedWhenClosed = Number.parseFloat(closedHintStyle.opacity) < 0.7
      && closedHintStyle.filter.includes('blur');
    hintButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const opened = hintButton?.getAttribute('aria-expanded') === 'true';
    const openedHintStyle = getComputedStyle(hintButton);
    const clearWhenOpened = openedHintStyle.opacity === '1' && openedHintStyle.filter === 'none';
    hintButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const collapsed = hintButton?.getAttribute('aria-expanded') === 'false';
    hintButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const reopened = hintButton?.getAttribute('aria-expanded') === 'true';
    const text = document.body.innerText;
    return {
      ok: Boolean(document.querySelector('.confidence-capture'))
        && text.includes('How confident are you?')
        && !text.includes('Reveal only after trying to recall')
        && document.querySelectorAll('.confidence-capture button').length === 3
        && opened && collapsed && reopened
        && mutedWhenClosed && clearWhenOpened,
      message: \`start=\${Boolean(startButton)}, confidence=\${Boolean(document.querySelector('.confidence-capture'))}, hint=\${opened}/\${collapsed}/\${reopened}, style=\${mutedWhenClosed}/\${clearWhenOpened}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('G Exam Mode', await page.evaluate(`(async () => {
    const button = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Exam Mode');
    button.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const examStartText = document.body.innerText;
    const startButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim().startsWith('Start exam'));
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const timer = document.querySelector('.timer-area strong');
    const navigator = document.querySelector('.number-grid');
    const navigatorButtons = [...document.querySelectorAll('.number-grid button')];
    navigatorButtons.at(-1)?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const lastQuestionCurrent = navigatorButtons.at(-1)?.getAttribute('aria-current') === 'step';
    return {
      ok: Boolean(document.querySelector('.question-pane'))
        && /^\\d{2}:\\d{2}$/.test(timer?.textContent || '')
        && examStartText.includes('The timer cannot be paused')
        && !document.querySelector('.pause-button')
        && !document.querySelector('.hint-note[open]')
        && navigatorButtons.length === 145
        && lastQuestionCurrent
        && navigator.scrollTop > 0,
      message: \`start=\${Boolean(startButton)}, question=\${Boolean(document.querySelector('.question-pane'))}, timer=\${timer?.textContent}, navigator=\${navigatorButtons.length}/\${navigator.scrollTop}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 390);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('G mobile layout', await page.evaluate(`(() => ({
    ok: document.documentElement.scrollWidth <= window.innerWidth,
    message: \`scrollWidth=\${document.documentElement.scrollWidth}, viewport=\${window.innerWidth}\`
  }))()`), page.exceptions);
  assertResult('G mobile study controls', await page.evaluate(`(async () => {
    const startButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim().startsWith('Start ') && candidate.textContent.includes('questions'));
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const trigger = document.querySelector('.support-floating-trigger');
    return {
      ok: Boolean(document.querySelector('.question-actions'))
        && getComputedStyle(document.querySelector('.side-nav')).scrollSnapType.includes('x')
        && getComputedStyle(trigger).display === 'none',
      message: \`start=\${startButton?.textContent}, actions=\${Boolean(document.querySelector('.question-actions'))}, support=\${getComputedStyle(trigger).display}\`
    };
  })()`), page.exceptions);
  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 390);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('Shared support mobile layout', await page.evaluate(`(async () => {
    const trigger = document.querySelector('.support-floating-trigger');
    trigger?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const dialog = document.querySelector('#supportDialog');
    const options = dialog?.querySelector('.support-options');
    const rect = dialog?.getBoundingClientRect();
    const result = {
      ok: dialog?.open === true
        && rect?.width <= window.innerWidth
        && dialog.scrollWidth <= dialog.clientWidth
        && document.documentElement.scrollWidth <= window.innerWidth
        && getComputedStyle(options).gridTemplateColumns.split(' ').length === 1,
      message: \`dialog=\${rect?.width}x\${rect?.height}, grid=\${getComputedStyle(options).gridTemplateColumns}, scrollWidth=\${document.documentElement.scrollWidth}\`
    };
    dialog?.close();
    return result;
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/aws/`, 1280);
  await page.waitUntil('document.querySelector(".metric-grid")');
  assertResult('AWS certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      ok: document.title === 'AWS SAA'
        && document.documentElement.lang === 'en'
        && text.includes('0 unassisted · 0 hint-assisted')
        && !text.includes('51%')
        && !text.includes('How to Use')
        && !document.querySelector('.study-tip'),
      message: \`title=\${document.title}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  page.close();
  console.log('CERT smoke tests passed.');
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
