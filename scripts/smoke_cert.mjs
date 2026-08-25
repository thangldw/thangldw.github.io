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
    await page.waitUntil(`document.fonts.check('16px Inter')`);
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

  await page.navigate(`${origin}/404.html`, 1280);
  assertResult('404 recovery actions render as buttons', await page.evaluate(`(() => {
    const home = document.querySelector('.content-actions a[href="/"]');
    const apps = document.querySelector('.content-actions a[href="/apps/"]');
    const homeStyle = home ? getComputedStyle(home) : null;
    const appsStyle = apps ? getComputedStyle(apps) : null;
    return {
      ok: ['flex', 'inline-flex'].includes(homeStyle?.display)
        && ['flex', 'inline-flex'].includes(appsStyle?.display)
        && parseFloat(homeStyle.minHeight) >= 40
        && parseFloat(appsStyle.minHeight) >= 40
        && parseFloat(homeStyle.paddingLeft) >= 12
        && parseFloat(appsStyle.paddingLeft) >= 12,
      message: 'home=' + homeStyle?.display + '/' + homeStyle?.minHeight + '/' + homeStyle?.paddingLeft
        + ', apps=' + appsStyle?.display + '/' + appsStyle?.minHeight + '/' + appsStyle?.paddingLeft
    };
  })()`), page.exceptions);

  const pageBackgroundChecks = [
    ['/', 'Homepage'],
    ['/apps/', 'Apps catalog']
  ];
  for (const [backgroundPath, backgroundLabel] of pageBackgroundChecks) {
    await page.evaluate(`localStorage.removeItem("theme")`);
    await page.navigate(`${origin}${backgroundPath}`, 1280);
    assertResult(`${backgroundLabel} light background`, await page.evaluate(`(() => ({
      ok: document.documentElement.dataset.theme === 'light'
        && getComputedStyle(document.body).backgroundColor === 'rgb(251, 252, 254)',
      message: 'theme=' + document.documentElement.dataset.theme
        + ', background=' + getComputedStyle(document.body).backgroundColor
    }))()`), page.exceptions);

    await page.evaluate(`localStorage.setItem("theme", "dark")`);
    await page.navigate(`${origin}${backgroundPath}`, 1280);
    assertResult(`${backgroundLabel} dark background`, await page.evaluate(`(() => ({
      ok: document.documentElement.dataset.theme === 'dark'
        && getComputedStyle(document.body).backgroundColor === 'rgb(17, 19, 15)',
      message: 'theme=' + document.documentElement.dataset.theme
        + ', background=' + getComputedStyle(document.body).backgroundColor
    }))()`), page.exceptions);
  }

  await page.navigate(`${origin}/apps/`, 1280);
  await page.waitUntil('document.querySelector(".project-row")');
  assertResult('Apps catalog responsive project index', await page.evaluate(`(() => {
    const table = document.querySelector('.project-table');
    const scroller = document.querySelector('.project-table-scroll');
    const row = document.querySelector('.project-row');
    const style = getComputedStyle(table);
    return {
      ok: style.minWidth === '0px'
        && getComputedStyle(row).display === 'grid'
        && scroller.scrollWidth <= scroller.clientWidth
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: \`minWidth=\${style.minWidth}, row=\${getComputedStyle(row).display}, scroller=\${scroller.clientWidth}/\${scroller.scrollWidth}\`
    };
  })()`), page.exceptions);

  const appsDesktopViewports = [
    [1280, 720],
    [1440, 900],
    [1440, 1000]
  ];
  for (const [desktopWidth, desktopHeight] of appsDesktopViewports) {
    await page.navigate(`${origin}/apps/`, desktopWidth, desktopHeight);
    await page.waitUntil('document.querySelectorAll(".project-row").length === 10');
    assertResult(`Apps catalog fits ${desktopWidth}x${desktopHeight}`, await page.evaluate(`(() => {
      const scroller = document.querySelector('.project-table-scroll');
      const visibleRows = document.querySelectorAll('.project-row:not([hidden])');
      return {
        ok: document.documentElement.scrollHeight <= window.innerHeight
          && document.documentElement.scrollWidth <= window.innerWidth
          && scroller.scrollHeight <= scroller.clientHeight
          && visibleRows.length === 10,
        message: 'document=' + document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight
          + ', viewport=' + window.innerWidth + 'x' + window.innerHeight
          + ', scroller=' + scroller.clientWidth + 'x' + scroller.clientHeight
          + '/' + scroller.scrollWidth + 'x' + scroller.scrollHeight
          + ', rows=' + visibleRows.length
      };
    })()`), page.exceptions);
  }

  await page.navigate(`${origin}/apps/`, 390, 844);
  await page.waitUntil('document.querySelector(".project-row")');
  assertResult('Apps catalog mobile rows', await page.evaluate(`(() => {
    const scroller = document.querySelector('.project-table-scroll');
    const row = document.querySelector('.project-row');
    const description = row?.querySelector('.project-description');
    return {
      ok: document.documentElement.scrollHeight > window.innerHeight
        && document.documentElement.scrollWidth <= window.innerWidth
        && scroller.scrollWidth <= scroller.clientWidth
        && getComputedStyle(row).display === 'grid'
        && getComputedStyle(description).display !== 'none'
        && description.scrollWidth <= description.clientWidth,
      message: \`document=\${document.documentElement.scrollWidth}x\${document.documentElement.scrollHeight}/\${window.innerWidth}x\${window.innerHeight}, scroller=\${scroller.clientWidth}/\${scroller.scrollWidth}, row=\${getComputedStyle(row).display}, description=\${description?.clientWidth}/\${description?.scrollWidth}\`
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/`, 1280);
  await page.waitUntil('document.querySelector(".project-row")');

  assertResult('Toolbox releases in the apps catalog', await page.evaluate(`(() => {
    const rows = [...document.querySelectorAll('.project-row')];
    const byTitle = title => rows.find(row => row.querySelector('.project-name strong')?.textContent.trim() === title);
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
    const card = [...document.querySelectorAll('.project-row')]
      .find(candidate => candidate.querySelector('.project-name strong')?.textContent.trim() === 'KakeFlow');
    return {
      ok: card?.querySelector('a')?.href === 'https://thangldw.github.io/kakeflow/'
        && card?.querySelector('.project-status')?.textContent.trim() === 'v1.2.0'
        && card.textContent.includes('MIT License')
        && card?.querySelector('.project-action')?.getAttribute('aria-label') === 'Open KakeFlow',
      message: 'kakeflow=' + card?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('Neon Glider appears in the apps catalog', await page.evaluate(`(() => {
    const visibleRows = [...document.querySelectorAll('.project-row:not([hidden])')];
    const game = visibleRows.find(candidate =>
      candidate.querySelector('.project-name strong')?.textContent.trim() === 'Neon Glider'
    );
    return {
      ok: visibleRows.length === 10
        && game?.querySelector('a')?.href === 'https://thangldw.github.io/neon-glider/'
        && game?.querySelector('.project-status')?.textContent.trim() === 'Live'
        && game?.querySelector('.project-action')?.getAttribute('aria-label') === 'Play Neon Glider',
      message: 'visible=' + visibleRows.length + ', neonGlider=' + game?.textContent.trim()
    };
  })()`), page.exceptions);

  assertResult('Certification manifest updates portfolio catalogs', await page.evaluate(`(() => {
    const manifest = window.portfolioCertificationManifest;
    const card = [...document.querySelectorAll('.project-row')]
      .find(candidate => candidate.querySelector('.project-name strong')?.textContent.trim() === 'Certification Library');
    return {
      ok: manifest?.schemaVersion === '1.0'
        && manifest.certificationCount === manifest.certifications.length
        && card?.textContent.includes(manifest.certificationCount + ' certifications'),
      message: 'count=' + manifest?.certificationCount + ', card=' + card?.textContent.trim()
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem("theme")`);
  await page.navigate(`${origin}/`, 1280);
  await page.waitUntil('document.querySelector("#projectRail .resume-project")');
  assertResult('Home project hover uses the cool neutral surface', await page.evaluate(`(() => {
    const project = document.querySelector('#projectRail .resume-project');
    const hoverSurface = project
      ? getComputedStyle(project).getPropertyValue('--project-hover-surface').trim()
      : '';
    return {
      ok: hoverSurface === '#f3f6fa',
      message: 'hoverSurface=' + hoverSurface
    };
  })()`), page.exceptions);

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

  assertResult('Neon Glider appears in home side projects', await page.evaluate(`(() => {
    const project = [...document.querySelectorAll('#projectRail .resume-project')]
      .find(candidate => candidate.querySelector('h3')?.textContent.trim() === 'Neon Glider');
    return {
      ok: project?.href === 'https://thangldw.github.io/neon-glider/'
        && project.textContent.includes('Three.js')
        && project.textContent.includes('persistent high scores'),
      message: 'neonGlider=' + project?.textContent.trim()
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
      const isAppsCatalog = window.location.pathname === '/apps/';
      const isJapanGuide = window.location.pathname === '/apps/japan-pr-guide/';
      const result = {
        ok: (isAppsCatalog
          ? triggerRect?.width === 0 && triggerRect?.height === 0
          : triggerRect?.width > 0 && triggerRect?.height > 0)
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

  await page.evaluate(`
    localStorage.removeItem("theme");
    localStorage.removeItem("certification-library:learner-preferences:v1");
    localStorage.setItem("thangldw:apps:certification-library:state:v3", JSON.stringify({
      unfinishedSessions: { g: { questionIds: ["g-smoke-resume"] } }
    }));
  `);
  await page.navigate(`${origin}/apps/cert/`, 1280);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23');
  await page.waitUntil(`performance.getEntriesByType('resource').some(entry => entry.name.includes('/assets/ExperienceWorkspace-'))`);
  const protectedResourcesBeforeFocus = await page.evaluate(`performance.getEntriesByType('resource').filter(entry => entry.name.includes('/protected-data/')).length`);
  for (let tabIndex = 0; tabIndex < 4; tabIndex += 1) {
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  }
  await page.waitUntil(`document.activeElement?.dataset.certificationId === 'ccar-f'`);
  await page.waitUntil(`performance.getEntriesByType('resource').filter(entry => entry.name.includes('/protected-data/')).length > ${protectedResourcesBeforeFocus}`);
  const protectedResourcesAfterFocus = await page.evaluate(`performance.getEntriesByType('resource').filter(entry => entry.name.includes('/protected-data/')).length`);
  const awsCardPoint = await page.evaluate(`(() => {
    const rect = document.querySelector('[data-certification-id="aws"]')?.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...awsCardPoint });
  await page.waitUntil(`performance.getEntriesByType('resource').filter(entry => entry.name.includes('/protected-data/')).length > ${protectedResourcesAfterFocus}`);
  assertResult('Certification grouped gallery runtime', await page.evaluate(`(() => {
    const hero = document.querySelector('.hub-hero');
    const text = document.body.innerText;
    const groups = [...document.querySelectorAll('.hub-certification-group')];
    const technologyCards = [...groups[1].querySelectorAll('.hub-cert-tile')];
    const firstTechnologyRowTop = technologyCards[0].getBoundingClientRect().top;
    const firstTechnologyRow = technologyCards.filter(card => Math.abs(card.getBoundingClientRect().top - firstTechnologyRowTop) < 2);
    const gCard = document.querySelector('[data-certification-id="g"]');
    const sampleCard = document.querySelector('.hub-cert-tile');
    return {
      ok: document.title === 'Certification Library'
        && document.documentElement.dataset.theme === 'light'
        && document.documentElement.lang === 'en'
        && document.querySelector('.hub-theme-toggle')?.getAttribute('aria-label') === 'Switch to dark theme'
        && Boolean(hero)
        && text.includes('Build your next capability.')
        && document.querySelectorAll('.hub-certifications').length === 1
        && document.querySelectorAll('.hub-cert-tile').length === 23
        && groups.map(group => Number(group.dataset.certificationCount)).join('|') === '3|9|11'
        && firstTechnologyRow.length === 8
        && new Set(firstTechnologyRow.map(card => Math.round(card.getBoundingClientRect().left))).size === 8
        && gCard?.classList.contains('is-continuing')
        && gCard?.querySelector('.hub-cert-continue-tag')?.textContent.trim() === 'Continue'
        && gCard?.querySelector('.hub-cert-open-action')?.textContent.trim() === 'Open'
        && gCard?.querySelector('.hub-cert-continue-action')?.textContent.trim() === 'continue saved session'
        && !gCard?.hasAttribute('aria-label')
        && !gCard?.hasAttribute('lang')
        && gCard?.querySelector('.hub-cert-code')?.getAttribute('lang') === 'ja'
        && getComputedStyle(sampleCard).minHeight === '108px'
        && getComputedStyle(sampleCard.querySelector('.hub-cert-code')).fontSize === '18px'
        && getComputedStyle(sampleCard.querySelector('.hub-cert-name')).fontSize === '13.2px'
        && getComputedStyle(sampleCard.querySelector('.hub-cert-issuer')).fontSize === '10.8px'
        && document.querySelectorAll('input[aria-label="Search certifications"]').length === 0
        && document.querySelectorAll('select[aria-label^="Filter by"]').length === 0
        && document.querySelectorAll('.hub-result-count').length === 0
        && document.querySelectorAll('.hub-cert-list-item').length === 0
        && document.querySelectorAll('.learner-onboarding').length === 0
        && performance.getEntriesByType('resource').some(entry => entry.name.includes('/assets/ExperienceWorkspace-'))
        && performance.getEntriesByType('resource').filter(entry => entry.name.includes('/protected-data/')).length > ${protectedResourcesAfterFocus}
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'title=' + document.title
        + ', theme=' + document.documentElement.dataset.theme
        + ', hero=' + Boolean(hero)
        + ', groups=' + groups.map(group => group.dataset.certificationCount).join('|')
        + ', tiles=' + document.querySelectorAll('.hub-cert-tile').length
        + ', firstTechnologyRow=' + firstTechnologyRow.length
        + ', search=' + document.querySelectorAll('input[aria-label="Search certifications"]').length
        + ', filters=' + document.querySelectorAll('select[aria-label^="Filter by"]').length
        + ', document=' + document.documentElement.scrollWidth + '/' + window.innerWidth
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/`, 1910, 930);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification gallery light canvas fills wide viewports', await page.evaluate(`(() => {
    const htmlBackground = getComputedStyle(document.documentElement).backgroundColor;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const hubBackground = getComputedStyle(document.querySelector('.certification-hub')).backgroundColor;
    return {
      ok: htmlBackground === 'rgb(251, 250, 247)'
        && bodyBackground === 'rgb(251, 250, 247)'
        && hubBackground === 'rgb(251, 250, 247)'
        && document.querySelectorAll('.hub-cert-tile').length === 23
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'html=' + htmlBackground
        + ', body=' + bodyBackground
        + ', hub=' + hubBackground
        + ', viewport=' + window.innerWidth
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/`, 390, 844);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification gallery fits mobile', await page.evaluate(`(() => {
    const hero = document.querySelector('.hub-hero')?.getBoundingClientRect();
    const actions = document.querySelector('.hub-header-actions')?.getBoundingClientRect();
    const technologyCards = [...document.querySelectorAll('.hub-certification-group')][1].querySelectorAll('.hub-cert-tile');
    const card = document.querySelector('.hub-cert-tile')?.getBoundingClientRect();
    const theme = document.querySelector('.hub-theme-toggle')?.getBoundingClientRect();
    return {
      ok: Boolean(hero)
        && hero.left >= 0
        && hero.right <= window.innerWidth
        && actions.left >= 0
        && actions.right <= window.innerWidth
        && document.querySelectorAll('.hub-cert-tile').length === 23
        && new Set([...technologyCards].slice(0, 2).map(item => Math.round(item.getBoundingClientRect().left))).size === 2
        && card.height >= 108
        && theme.width === 44
        && theme.height === 44
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'hero=' + hero?.left + '/' + hero?.right
        + ', actions=' + actions?.left + '/' + actions?.right
        + ', cards=' + document.querySelectorAll('.hub-cert-tile').length
        + ', card=' + card?.width + 'x' + card?.height
        + ', theme=' + theme?.width + 'x' + theme?.height
        + ', scroll=' + document.documentElement.scrollWidth + '/' + window.innerWidth
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.setItem("theme", "dark")`);
  await page.navigate(`${origin}/apps/cert/`, 2048);
  await page.waitUntil('document.documentElement.dataset.theme === "dark" && document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification gallery dark canvas fills wide viewports', await page.evaluate(`(() => {
    const htmlBackground = getComputedStyle(document.documentElement).backgroundColor;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const hubBackground = getComputedStyle(document.querySelector('.certification-hub')).backgroundColor;
    return {
      ok: htmlBackground === 'rgb(17, 19, 15)'
        && bodyBackground === 'rgb(17, 19, 15)'
        && hubBackground === 'rgb(17, 19, 15)'
        && document.querySelectorAll('.hub-cert-tile').length === 23
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'html=' + htmlBackground
        + ', body=' + bodyBackground
        + ', hub=' + hubBackground
        + ', viewport=' + window.innerWidth
    };
  })()`), page.exceptions);

  await page.evaluate(`
    localStorage.setItem("theme", "light");
    localStorage.setItem("certification-library:learner-preferences:v1", JSON.stringify({
      schemaVersion: 1, completed: false, examDate: "", interfaceLanguage: "vi",
      primaryCertification: "g", weeklyMinutes: 300
    }));
  `);
  await page.navigate(`${origin}/apps/cert/`, 1280);
  await page.waitUntil('document.documentElement.lang === "vi" && document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification gallery localizes the complete Vietnamese interface', await page.evaluate(`(() => {
    const gCard = document.querySelector('[data-certification-id="g"]');
    return {
      ok: document.querySelector('.hub-brand')?.textContent.trim() === 'Thư viện chứng chỉ'
        && document.querySelector('.hub-disclaimer-link')?.textContent.trim() === 'Đọc tuyên bố miễn trừ'
        && document.querySelector('#hub-title')?.textContent.trim() === 'Xây dựng năng lực tiếp theo.'
        && [...document.querySelectorAll('.hub-certification-group h2')].map(item => item.textContent.trim()).join('|') === 'AI & Kiến trúc|Công nghệ|Kinh doanh, Tài chính & Ngôn ngữ'
        && gCard?.querySelector('.hub-cert-continue-tag')?.textContent.trim() === 'Tiếp tục'
        && gCard?.querySelector('.hub-cert-open-action')?.textContent.trim() === 'Mở'
        && gCard?.querySelector('.hub-cert-continue-action')?.textContent.trim() === 'tiếp tục phiên đã lưu'
        && gCard?.querySelector('.hub-cert-code')?.getAttribute('lang') === 'ja',
      message: 'lang=' + document.documentElement.lang
        + ', title=' + document.querySelector('#hub-title')?.textContent.trim()
        + ', groups=' + [...document.querySelectorAll('.hub-certification-group h2')].map(item => item.textContent.trim()).join('|')
    };
  })()`), page.exceptions);

  await page.evaluate(`
    localStorage.removeItem("certification-library:learner-preferences:v1");
    localStorage.setItem("theme", "light");
  `);
  await page.navigate(`${origin}/apps/cert/`, 1280);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23');
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__loadingWorkspaceSeen = false;
    const watchLoadingWorkspace = () => {
      const check = () => {
        if (document.body?.innerText.includes('Loading workspace')) window.__loadingWorkspaceSeen = true;
      };
      check();
      new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    };
    if (document.documentElement) watchLoadingWorkspace();
    else addEventListener('DOMContentLoaded', watchLoadingWorkspace, { once: true });
  ` });
  const warmedNavigationStartedAt = Date.now();
  await page.evaluate(`document.querySelector('[data-certification-id="ccar-f"]')?.click()`);
  await page.waitUntil('location.pathname.endsWith("/apps/cert/ccar-f/") && document.querySelector(".today-screen")', 2000);
  const warmedNavigationElapsedMs = Date.now() - warmedNavigationStartedAt;
  assertResult('Warmed certification navigation skips the workspace placeholder', await page.evaluate(`(() => ({
    ok: window.__loadingWorkspaceSeen === false
      && !document.body.innerText.includes('Loading workspace')
      && Boolean(document.querySelector('.today-screen')),
    message: 'placeholder=' + window.__loadingWorkspaceSeen
      + ', elapsed=${warmedNavigationElapsedMs}ms'
  }))()`), page.exceptions);

  await page.evaluate(`localStorage.setItem("theme", "dark")`);
  const childThemeChecks = [];
  for (const slug of certificationManifest.certifications.map(certification => certification.slug)) {
    await page.navigate(`${origin}/apps/cert/${slug}/`, 1280);
    await page.waitUntil('document.querySelector(".experience-shell .today-screen")');
    const result = await page.evaluate(`(() => ({
      theme: document.documentElement.dataset.theme,
      locked: document.documentElement.dataset.themeLocked,
      toggleCount: document.querySelectorAll("#themeToggle, .hub-theme-toggle").length,
      storedTheme: localStorage.getItem("theme"),
      hasSwitcher: Boolean(document.querySelector(".certification-switcher, .certification-switcher__dot"))
    }))()`);
    childThemeChecks.push({ slug, ...result, exceptions: [...page.exceptions] });
  }
  assertResult('Child certifications honor the stored theme in the new workspace', {
    ok: childThemeChecks.every(check =>
      check.theme === 'dark'
      && check.locked === undefined
      && check.toggleCount === 0
      && check.storedTheme === 'dark'
      && check.hasSwitcher === false
      && check.exceptions.length === 0
    ),
    message: JSON.stringify(childThemeChecks)
  }, []);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3'); localStorage.setItem('theme', 'light')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".today-screen")');
  assertResult('G evidence-first Today workspace', await page.evaluate(`(() => {
    const text = document.body.innerText;
    const primaryLabels = [...document.querySelectorAll('.workspace-navigation__primary > button span')]
      .map(item => item.textContent.trim()).join('|');
    const disclaimerLink = document.querySelector('.workspace-navigation__primary > a.workspace-navigation__disclaimer');
    return {
      ok: document.title === 'G検定'
        && document.documentElement.lang === 'ja'
        && primaryLabels === 'Today|Learn|Practice|Exam|Progress'
        && disclaimerLink?.getAttribute('href') === '/apps/cert/disclaimer/'
        && document.querySelector('.workspace-navigation__brand')?.getAttribute('href') === '/apps/cert/'
        && !document.querySelector('.certification-switcher, .certification-switcher__dot')
        && Boolean(document.querySelector('.today-primary-action'))
        && Boolean(document.querySelector('.today-evidence'))
        && Boolean(document.querySelector('#today-heading')?.textContent.trim())
        && Boolean(document.querySelector('.today-goal-details'))
        && text.includes('All progress stays in this browser.')
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'title=' + document.title
        + ', nav=' + primaryLabels
        + ', disclaimer=' + disclaimerLink?.getAttribute('href')
        + ', primary=' + Boolean(document.querySelector('.today-primary-action'))
        + ', evidence=' + Boolean(document.querySelector('.today-evidence'))
        + ', goal=' + document.querySelector('#today-heading')?.textContent.trim()
        + ', scroll=' + document.documentElement.scrollWidth + '/' + window.innerWidth
    };
  })()`), page.exceptions);

  assertResult('Desktop navigation exposes each unique destination directly', await page.evaluate(`(() => ({
    ok: document.querySelectorAll('.workspace-navigation__primary > button.workspace-navigation__primary-item').length === 5
      && document.querySelector('.workspace-navigation__primary > a.workspace-navigation__disclaimer')?.getAttribute('href') === '/apps/cert/disclaimer/'
      && !document.querySelector('.workspace-navigation__more')
      && !document.body.innerText.includes('Local data'),
    message: 'items=' + document.querySelectorAll('.workspace-navigation__primary > button.workspace-navigation__primary-item').length
      + ', disclaimer=' + document.querySelector('.workspace-navigation__primary > a.workspace-navigation__disclaimer')?.getAttribute('href')
      + ', more=' + Boolean(document.querySelector('.workspace-navigation__more'))
      + ', localData=' + document.body.innerText.includes('Local data')
  }))()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Practice'))?.click()`);
  await page.waitUntil('document.querySelector(".practice-program")');
  assertResult('G unified Practice Program', await page.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      ok: document.querySelector('.workspace-navigation__primary-item[aria-current="page"]')?.textContent.trim() === 'Practice'
        && text.includes('G検定 Practice Program')
        && Boolean(document.querySelector('[aria-label="Practice tracks"]'))
        && document.querySelectorAll('.practice-program__modules li').length > 0,
      message: 'active=' + document.querySelector('.workspace-navigation__primary-item[aria-current="page"]')?.textContent.trim()
        + ', program=' + text.includes('G検定 Practice Program')
        + ', tracks=' + Boolean(document.querySelector('[aria-label="Practice tracks"]'))
        + ', modules=' + document.querySelectorAll('.practice-program__modules li').length
    };
  })()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Exam'))?.click()`);
  await page.waitUntil('document.querySelector(".exam-campaign")');
  assertResult('G exam campaign gates', await page.evaluate(`(() => {
    const phases = [...document.querySelectorAll('.campaign-phases strong')].map(item => item.textContent.trim());
    const fullMock = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Start full mock');
    const timedSection = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Start timed section');
    return {
      ok: phases.join('|') === 'Foundation|Integration|Simulation|Taper'
        && fullMock?.disabled === false
        && timedSection?.disabled === false,
      message: 'phases=' + phases.join('|')
        + ', fullMock=' + fullMock?.disabled
        + ', timed=' + timedSection?.disabled
    };
  })()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Progress'))?.click()`);
  await page.waitUntil('document.querySelector(".progress-experience")');
  assertResult('G evidence Progress workspace', await page.evaluate(`(() => ({
    ok: Boolean(document.querySelector('[aria-label="Domain evidence chart"]'))
      && document.querySelector('.progress-domain table caption')?.textContent.trim() === 'Domain evidence details'
      && document.body.innerText.includes('Evidence, not activity'),
    message: 'chart=' + Boolean(document.querySelector('[aria-label="Domain evidence chart"]'))
      + ', table=' + document.querySelector('.progress-domain table caption')?.textContent.trim()
  }))()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('.workspace-navigation__primary-item')].find(candidate => candidate.textContent.trim() === 'Learn'))?.click()`);
  await page.waitUntil('document.querySelector(".learn-experience")', 30000);
  assertResult('G Learn overview without Knowledge Map UI', await page.evaluate(`(() => {
    const tabs = [...document.querySelectorAll('.learn-experience__tabs button')].map(button => button.textContent.trim());
    return {
      ok: tabs.join('|') === 'Overview|Terms & notes'
        && document.querySelector('.learn-experience__tabs button[aria-current="page"]')?.textContent.trim() === 'Overview'
        && document.querySelectorAll('.cert-learning-map__grid button').length > 0
        && !document.querySelector('.knowledge-graph-view')
        && ![...document.querySelectorAll('button')].some(button => /knowledge map|exam map/i.test(button.textContent)),
      message: 'tabs=' + tabs.join('|')
        + ', areas=' + document.querySelectorAll('.cert-learning-map__grid button').length
        + ', graph=' + Boolean(document.querySelector('.knowledge-graph-view'))
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/pmp/?view=learn`, 1280);
  await page.waitUntil('document.querySelectorAll(".cert-learning-map__grid button").length === 3', 30000);
  assertResult('PMP Learn study areas start the selected domain', await page.evaluate(`(async () => {
    const controls = [...document.querySelectorAll('.cert-learning-map__grid button')];
    const process = controls.find(button => button.getAttribute('aria-label') === 'Start Process 41% practice');
    process?.click();
    for (let attempt = 0; attempt < 120 && !document.querySelector('.focus-sprint'); attempt += 1) {
      await new Promise(resolveWait => setTimeout(resolveWait, 50));
    }
    const text = document.body.innerText;
    return {
      ok: controls.length === 3
        && Boolean(process)
        && document.querySelector('.focus-sprint h1')?.textContent.trim() === 'Process'
        && text.includes('Item 1 / 20'),
      message: 'areas=' + controls.length
        + ', process=' + Boolean(process)
        + ', heading=' + document.querySelector('.focus-sprint h1')?.textContent.trim()
        + ', item=' + text.includes('Item 1 / 20')
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/jlpt/?view=practice`, 1280);
  await page.waitUntil('document.querySelector(".practice-program") && document.querySelectorAll("[aria-label=\\"Practice tracks\\"] [role=\\"tab\\"]").length === 4', 30000);
  assertResult('JLPT unified Practice Program', await page.evaluate(`(() => ({
    ok: document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length === 4
      && document.querySelectorAll('.practice-program__modules li').length === 10
      && Boolean(document.querySelector('[data-module-action="jlpt:module:n1-vocabulary-tabs"]'))
      && document.body.innerText.includes('JLPT N1 Practice Program'),
    message: 'tracks=' + document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length
      + ', modules=' + document.querySelectorAll('.practice-program__modules li').length
  }))()`), page.exceptions);

  await page.evaluate(`document.querySelector('[data-module-action="jlpt:module:n1-vocabulary-tabs"]')?.click()`);
  await page.waitUntil('document.querySelector(".jlpt-vocabulary-workspace") && document.body.innerText.includes("1.685 từ")', 30000);
  assertResult('JLPT vocabulary stays inside the unified Practice workspace', await page.evaluate(`(() => ({
    ok: window.location.pathname === '/apps/cert/jlpt/'
      && Boolean(document.querySelector('.workspace-navigation__primary-item[aria-current="page"]'))
      && Boolean(document.querySelector('.jlpt-vocabulary-workspace'))
      && !document.querySelector('.language-practice-hero')
      && !document.querySelector('.jlpt-vocabulary-workspace__header')
      && Boolean(document.querySelector('button[aria-label="Quay lại tổng quan Practice"]'))
      && document.querySelectorAll('.jlpt-vocabulary-tabs button').length === 7
      && [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Ôn lại 0')
      && [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Mini test')
      && !document.querySelector('a[href*="n1-vocabulary-tabs/index.html"]'),
    message: 'url=' + window.location.href
      + ', tabs=' + document.querySelectorAll('.jlpt-vocabulary-tabs button').length
      + ', cards=' + document.querySelectorAll('.jlpt-vocabulary-card').length
  }))()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/n1-modules/n1-reading-library/index.html`, 1280);
  await page.waitUntil('document.querySelector(".n1-reading-library-view")', 30000);
  assertResult('JLPT reading library legacy URL opens native view', await page.evaluate(`(() => ({
    ok: window.location.pathname === '/apps/cert/n1-modules/n1-reading-library/index.html'
      && document.body.innerText.includes('256 bài đọc')
      && document.body.innerText.includes('Luyện bài này'),
    message: 'url=' + window.location.href
      + ', cards=' + document.querySelectorAll('.n1-reading-passage-card').length
  }))()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Luyện bài này'))?.click()`);
  await page.waitUntil('document.querySelector(".focus-sprint .rich-question-content__passage")');
  await page.evaluate(`([...document.querySelectorAll('button')].find(button => button.textContent.includes('Reveal Vietnamese translation')))?.click()`);
  await page.waitUntil('document.querySelector(".rich-question-content__passage [lang=vi]")');
  assertResult('JLPT reading practice reveals the translated passage', await page.evaluate(`(() => {
    const passage = document.querySelector('.rich-question-content__passage');
    const translation = passage?.querySelector('.rich-question-content__translation[lang="vi"]');
    return {
      ok: Boolean(translation)
        && translation.textContent.includes('Bản dịch tiếng Việt')
        && translation.textContent.length > 500,
      message: 'translation=' + Boolean(translation)
        + ', length=' + (translation?.textContent.length || 0)
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/fe/?view=practice`, 1280);
  await page.waitUntil('document.querySelector(".practice-program") && document.querySelectorAll("[aria-label=\\"Practice tracks\\"] [role=\\"tab\\"]").length > 0 && document.querySelectorAll(".practice-program__modules li").length > 0', 30000);
  assertResult('FE specialist Practice Program', await page.evaluate(`(() => ({
    ok: document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length > 0
      && document.querySelectorAll('.practice-program__modules li').length > 0
      && document.querySelector('.practice-program')?.getAttribute('aria-label')?.endsWith('Practice Program'),
    message: 'tracks=' + document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length
      + ', modules=' + document.querySelectorAll('.practice-program__modules li').length
  }))()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/ccar-f/?view=practice`, 1280);
  await page.waitUntil('document.querySelector(".practice-program") && document.querySelectorAll("[aria-label=\\"Practice tracks\\"] [role=\\"tab\\"]").length === 5', 30000);
  assertResult('CCAR domain Practice Program', await page.evaluate(`(() => ({
    ok: document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length === 5
      && ![...document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]')]
        .some(tab => tab.textContent.trim() === 'Official simulation')
      && document.querySelectorAll('.practice-program__modules li').length > 0,
    message: 'tracks=' + document.querySelectorAll('[aria-label="Practice tracks"] [role="tab"]').length
      + ', active=' + document.querySelector('[aria-label="Practice tracks"] [aria-selected="true"]')?.textContent.trim()
      + ', modules=' + document.querySelectorAll('.practice-program__modules li').length
  }))()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/g/`, 390, 844);
  await page.waitUntil('document.querySelector(".today-screen")');
  assertResult('G mobile evidence workspace', await page.evaluate(`(() => {
    const mobileNav = document.querySelector('.mobile-primary-nav');
    const support = document.querySelector('.support-floating-trigger');
    const disclaimerLink = mobileNav.querySelector('a.mobile-primary-nav__disclaimer[aria-label="Read full disclaimer"]');
    return {
      ok: getComputedStyle(mobileNav).display !== 'none'
        && mobileNav.querySelectorAll('button').length === 5
        && disclaimerLink?.getAttribute('href') === '/apps/cert/disclaimer/'
        && document.documentElement.scrollWidth <= window.innerWidth,
      message: 'display=' + getComputedStyle(mobileNav).display
        + ', buttons=' + mobileNav.querySelectorAll('button').length
        + ', disclaimer=' + disclaimerLink?.getAttribute('href')
        + ', support=' + getComputedStyle(support).display
        + ', scroll=' + document.documentElement.scrollWidth + '/' + window.innerWidth
    };
  })()`), page.exceptions);
  assertResult('G mobile learning navigation', await page.evaluate(`(() => ({
    ok: [...document.querySelectorAll('.mobile-primary-nav__item')]
      .map(item => item.textContent.trim()).includes('Learn'),
    message: [...document.querySelectorAll('.mobile-primary-nav__item')]
      .map(item => item.textContent.trim()).join('|')
  }))()`), page.exceptions);

  await page.evaluate(`([...document.querySelectorAll('.mobile-primary-nav__item')]
    .find(item => item.textContent.trim() === 'Progress'))?.click()`);
  await page.waitUntil('document.querySelector(".progress-experience")');
  assertResult('G mobile Progress stays within the viewport', await page.evaluate(`(() => ({
    ok: document.documentElement.scrollWidth <= window.innerWidth,
    message: 'scroll=' + document.documentElement.scrollWidth + '/' + window.innerWidth
  }))()`), page.exceptions);

  if (process.env.LEGACY_CERT_SMOKE === '1') {
  const childThemeChecks = [];
  for (const slug of certificationManifest.certifications.map(certification => certification.slug)) {
    await page.navigate(`${origin}/apps/cert/${slug}/`, 1280);
    await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
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

  await page.navigate(origin + '/apps/cert/pmp/', 1280);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
  assertResult('PMP complete July 2026 bank and learning metadata', await page.evaluate(`(async () => {
    const dashboardText = document.body.innerText;
    const learnButton = [...document.querySelectorAll('.workspace-navigation__primary-item')].find(candidate => candidate.textContent.trim() === 'Learn');
    learnButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const overviewTabs = [...document.querySelectorAll('.learn-experience__tabs button')].map(button => button.textContent.trim());
    const overviewAreas = document.querySelectorAll('.cert-learning-map__grid button').length;
    const termsButton = [...document.querySelectorAll('.learn-experience__tabs button')].find(candidate => candidate.textContent.trim() === 'Terms & notes');
    termsButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const termsText = document.body.innerText;
    const noteCount = document.querySelectorAll('.reference-notes details').length;
    return {
      ok: dashboardText.includes('0 / 180 answered')
        && !dashboardText.includes('Preview question bank')
        && overviewTabs.join('|') === 'Overview|Terms & notes'
        && overviewAreas > 0
        && termsText.includes('64 terms')
        && noteCount === 3
        && !document.querySelector('.knowledge-graph-view')
        && !document.querySelector('.knowledge-universe-stage'),
      message: 'dashboard180=' + dashboardText.includes('0 / 180 answered')
        + ', preview=' + dashboardText.includes('Preview question bank')
        + ', tabs=' + overviewTabs.join('|')
        + ', areas=' + overviewAreas
        + ', terms64=' + termsText.includes('64 terms')
        + ', notes=' + noteCount
        + ', graph=' + Boolean(document.querySelector('.knowledge-graph-view'))
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
  assertResult('G certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    const bankResources = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/apps/cert/protected-data/'));
    return {
      ok: document.title === 'G検定'
        && document.documentElement.lang === 'en'
        && text.includes("Today's target")
        && text.includes('Next full mock')
        && text.includes('Priority domain')
        && text.includes('Learn one concept first')
        && text.includes('Open concept')
        && text.includes('1 concept')
        && document.querySelectorAll('.duration-picker').length === 0
        && text.includes('Score unlocks after 40 unassisted answers, each domain meets its evidence minimum, and two recent valid full mocks.')
        && text.includes('Your study data is saved only in this browser')
        && text.includes('Backup or restore')
        && !text.includes('42%')
        && !text.includes('How to Use')
        && !document.querySelector('.self-study-path')
        && !document.querySelector('.study-tip')
        && bankResources.length === 1,
      message: \`title=\${document.title}, lang=\${document.documentElement.lang}, bankResources=\${bankResources.length}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  assertResult('G guided domain learning session', await page.evaluate(`(async () => {
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Study by Domain')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const startButton = document.querySelector('.module-card button:not([disabled])');
    const firstDomainLabel = document.querySelector('.module-card > div span')?.textContent.trim();
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
    const activeNavigation = document.querySelector('.nav-item.active span')?.textContent.trim();
    const vietnameseDisclosure = document.querySelector('.vietnamese-question-wrap');
    const vietnameseClosedByDefault = vietnameseDisclosure?.open === false;
    vietnameseDisclosure?.querySelector('summary')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const vietnameseOpensOnRequest = vietnameseDisclosure?.open === true;
    const text = document.body.innerText;
    const modeLabels = [...document.querySelectorAll('.study-mode-control span')]
      .map(item => item.textContent.trim());
    return {
      ok: activeNavigation === 'Study by Domain'
        && firstDomainLabel?.startsWith('RECOMMENDED')
        && !document.querySelector('.learn-mode-primer')
        && !text.includes('CONCEPT BRIEFING')
        && vietnameseClosedByDefault
        && vietnameseOpensOnRequest
        && modeLabels.join('|') === 'Smart Study|Exam',
      message: \`start=\${Boolean(startButton)}, recommended=\${firstDomainLabel}, active=\${activeNavigation}, modes=\${modeLabels.join('|')}, primer=\${Boolean(document.querySelector('.learn-mode-primer'))}, vietnamese=\${vietnameseClosedByDefault}/\${vietnameseOpensOnRequest}\`
    };
  })()`), page.exceptions);

  assertResult('G marked-question return to Practice Program', await page.evaluate(`(async () => {
    document.querySelector('.secondary-action')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Smart Study')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const text = document.body.innerText;
    return {
      ok: text.includes('G検定 Practice Program')
        && Boolean(document.querySelector('.practice-program'))
        && document.querySelector('.workspace-navigation__primary-item[aria-current="page"]')?.textContent.trim() === 'Practice',
      message: \`program=\${Boolean(document.querySelector('.practice-program'))}, text=\${text.slice(0, 180)}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');

  assertResult('G key-term active recall', await page.evaluate(`(async () => {
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Terms & Notes')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const search = document.querySelector('input[aria-label="Search key terms"]');
    const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setInputValue.call(search, 'Attention');
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const exactTerm = document.querySelector('.glossary-list details');
    exactTerm?.querySelector('summary')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const openConcept = [...(exactTerm?.querySelectorAll('button') || [])]
      .find(candidate => candidate.textContent.trim() === 'Open concept');
    const sourceFromTerm = [...(exactTerm?.querySelectorAll('button') || [])]
      .find(candidate => candidate.textContent.trim() === 'Practice source question');
    openConcept?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const exactConcept = document.querySelector('.focus-study-detail h3')?.textContent.trim();
    const conceptRatings = [...document.querySelectorAll('.focus-confidence-row button')];
    conceptRatings.find(button => button.textContent.trim() === 'again')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const stored = JSON.parse(localStorage.getItem('thangldw:apps:certification-library:state:v3') || '{}');
    const termLearning = stored.progress?.g?.termLearning || {};
    const storedRating = Object.values(termLearning).find(record => record.lastRating === 'again');
    [...document.querySelectorAll('button')]
      .find(candidate => candidate.textContent.trim() === 'Practice source question')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const sourceQuestionOpened = Boolean(document.querySelector('.question-pane'));
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Terms & Notes')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Active recall')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 50));
    const reveal = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Reveal definition');
    const summary = document.querySelector('[aria-label="Term recall progress"]')?.textContent.trim();
    return {
      ok: Boolean(document.querySelector('.term-recall-card'))
        && Boolean(reveal)
        && Boolean(openConcept)
        && Boolean(sourceFromTerm)
        && exactConcept === 'Attention'
        && conceptRatings.length === 4
        && storedRating?.dueAt
        && sourceQuestionOpened
        && /due · \\d+ studied/.test(summary || ''),
      message: \`card=\${Boolean(document.querySelector('.term-recall-card'))}, actions=\${Boolean(openConcept)}/\${Boolean(sourceFromTerm)}, concept=\${exactConcept}, ratings=\${conceptRatings.length}, stored=\${Boolean(storedRating?.dueAt)}, question=\${sourceQuestionOpened}, summary=\${summary}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');

  assertResult('G self-study confidence capture', await page.evaluate(`(async () => {
    const startButton = document.querySelector('.study-now-action');
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 150));
    const conceptFirst = document.querySelector('.focus-map-shell.concept-first-entry');
    const detailBeforeMap = conceptFirst?.querySelector('.focus-study-detail')?.compareDocumentPosition(
      conceptFirst.querySelector('.focus-map-stage')
    ) & Node.DOCUMENT_POSITION_FOLLOWING;
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Practice source question')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 150));
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
    const confidenceCapture = Boolean(document.querySelector('.confidence-capture'));
    const confidenceButtons = [...document.querySelectorAll('.confidence-capture button')];
    const preSubmitText = document.body.innerText;
    document.querySelector('.answer input')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    [...document.querySelectorAll('.confidence-capture button')].at(-1)?.click();
    for (let attempt = 0; attempt < 20 && document.querySelector('.primary-action')?.disabled; attempt += 1) {
      await new Promise(resolveWait => setTimeout(resolveWait, 25));
    }
    const submitButton = document.querySelector('.primary-action');
    const submitState = {
      disabled: submitButton?.disabled,
      label: submitButton?.textContent.trim(),
      selected: document.querySelectorAll('.answer.selected').length,
      confidence: document.querySelectorAll('.confidence-capture button[aria-pressed="true"]').length
    };
    submitButton?.click();
    for (let attempt = 0; attempt < 40 && !document.querySelector('.learning-details'); attempt += 1) {
      await new Promise(resolveWait => setTimeout(resolveWait, 25));
    }
    const learningDetails = document.querySelector('.learning-details');
    const learningControls = document.querySelector('.learning-controls');
    const disclosuresClosed = learningDetails?.open === false && learningControls?.open === false;
    learningDetails?.querySelector('summary')?.click();
    learningControls?.querySelector('summary')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const text = document.body.innerText;
    const ratingText = [...document.querySelectorAll('.review-rating button')]
      .map(button => button.innerText.replace(/\\s+/g, ' ').trim());
    return {
      ok: Boolean(conceptFirst)
        && Boolean(detailBeforeMap)
        && confidenceCapture
        && preSubmitText.includes('How confident are you?')
        && !preSubmitText.includes('Reveal only after trying to recall')
        && confidenceButtons.length === 3
        && opened && collapsed && reopened
        && mutedWhenClosed && clearWhenOpened
        && disclosuresClosed
        && text.includes('Correct answer and explanation')
        && text.includes('Memory cue')
        && ratingText.some(label => label.toLowerCase().includes('again') && label.includes('10 min')),
      message: \`start=\${Boolean(startButton)}, conceptFirst=\${Boolean(conceptFirst)}/\${Boolean(detailBeforeMap)}, confidence=\${confidenceCapture}, hint=\${opened}/\${collapsed}/\${reopened}, style=\${mutedWhenClosed}/\${clearWhenOpened}, submit=\${JSON.stringify(submitState)}, disclosuresClosed=\${disclosuresClosed}, ratings=\${ratingText.join('|')}\`
    };
  })()`), page.exceptions);

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 1280);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
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
    const finishButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Finish exam');
    finishButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 25));
    const finishPrompt = document.querySelector('#finish-exam-title')?.textContent;
    const continueButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Continue exam');
    continueButton?.click();
    return {
      ok: Boolean(document.querySelector('.question-pane'))
        && /^\\d{2,3}:\\d{2}$/.test(timer?.textContent || '')
        && examStartText.includes('The timer cannot be paused')
        && !document.querySelector('.pause-button')
        && !document.querySelector('.hint-note[open]')
        && finishPrompt === 'Submit your exam now?'
        && navigatorButtons.length === 145
        && lastQuestionCurrent
        && navigator.scrollTop > 0,
      message: \`start=\${Boolean(startButton)}, question=\${Boolean(document.querySelector('.question-pane'))}, timer=\${timer?.textContent}, finish=\${finishPrompt}, navigator=\${navigatorButtons.length}/\${navigator.scrollTop}\`
    };
  })()`), page.exceptions);

  for (const width of [700, 641]) {
    await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
    await page.navigate(`${origin}/apps/cert/g/`, width);
    await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
    assertResult(`G compact ledger layout at ${width}px`, await page.evaluate(`(async () => {
      const columns = element => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length;
      const dashboardColumns = columns(document.querySelector('.dashboard-ledger-row'));
      [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Study by Domain')?.click();
      await new Promise(resolveWait => setTimeout(resolveWait, 75));
      const moduleColumns = columns(document.querySelector('.module-card'));
      [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Smart Study')?.click();
      await new Promise(resolveWait => setTimeout(resolveWait, 75));
      const practiceColumns = columns(document.querySelector('.practice-card'));
      return {
        ok: dashboardColumns === 2
          && moduleColumns === 1
          && practiceColumns === 1
          && document.documentElement.scrollWidth <= window.innerWidth,
        message: \`dashboard=\${dashboardColumns}, module=\${moduleColumns}, practice=\${practiceColumns}, scroll=\${document.documentElement.scrollWidth}/\${window.innerWidth}\`
      };
    })()`), page.exceptions);
  }

  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 390);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
  assertResult('G mobile layout', await page.evaluate(`(() => ({
    ok: document.documentElement.scrollWidth <= window.innerWidth,
    message: \`scrollWidth=\${document.documentElement.scrollWidth}, viewport=\${window.innerWidth}\`
  }))()`), page.exceptions);
  assertResult('G mobile study controls', await page.evaluate(`(async () => {
    const startButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Open concept');
    startButton?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 200));
    const conceptFirst = document.querySelector('.focus-map-shell.concept-first-entry');
    [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === 'Practice source question')?.click();
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const trigger = document.querySelector('.support-floating-trigger');
    return {
      ok: Boolean(conceptFirst)
        && Boolean(document.querySelector('.question-actions'))
        && getComputedStyle(document.querySelector('.side-nav')).scrollSnapType.includes('x')
        && getComputedStyle(trigger).display === 'none',
      message: \`start=\${startButton?.textContent}, conceptFirst=\${Boolean(conceptFirst)}, actions=\${Boolean(document.querySelector('.question-actions'))}, support=\${getComputedStyle(trigger).display}\`
    };
  })()`), page.exceptions);
  await page.evaluate(`localStorage.removeItem('thangldw:apps:certification-library:state:v3')`);
  await page.navigate(`${origin}/apps/cert/g/`, 390);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
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
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
  assertResult('AWS certification dashboard', await page.evaluate(`(() => {
    const text = document.body.innerText;
    const shell = document.querySelector('.app-shell');
    return {
      ok: document.title === 'AWS SAA'
        && document.documentElement.lang === 'en'
        && getComputedStyle(shell).gridTemplateColumns.startsWith('252px ')
        && document.documentElement.scrollWidth <= window.innerWidth
        && text.includes("Today's target")
        && text.includes('Next full mock')
        && text.includes('Priority domain')
        && !text.includes('51%')
        && !text.includes('How to Use')
        && !document.querySelector('.study-tip'),
      message: \`title=\${document.title}, text=\${text.slice(0, 160)}\`
    };
  })()`), page.exceptions);

  await page.navigate(`${origin}/apps/cert/aws/`, 390);
  await page.waitUntil('document.querySelector(".dashboard-evidence-grid")');
  assertResult('AWS certification dashboard mobile layout', await page.evaluate(`(() => ({
    ok: getComputedStyle(document.querySelector('.app-shell')).gridTemplateColumns.startsWith('78px ')
      && document.documentElement.scrollWidth <= window.innerWidth
      && document.querySelector('.study-now-card')?.getBoundingClientRect().width <= window.innerWidth,
    message: 'grid=' + getComputedStyle(document.querySelector('.app-shell')).gridTemplateColumns
      + ', scroll=' + document.documentElement.scrollWidth + '/' + window.innerWidth
  }))()`), page.exceptions);

  }

  await page.evaluate(`localStorage.removeItem("certification-library:learner-preferences:v1"); localStorage.setItem("theme", "light")`);
  await page.navigate(`${origin}/apps/cert/`, 390, 844);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23 && navigator.serviceWorker?.ready');
  await page.evaluate(`navigator.serviceWorker.ready.then(() => true)`);
  await page.navigate(`${origin}/apps/cert/`, 390, 844);
  await page.waitUntil('navigator.serviceWorker?.controller && document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification PWA installs and controls the gallery', await page.evaluate(`(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifest = await fetch(document.querySelector('link[rel="manifest"]').href).then(response => response.json());
    const cacheNames = await caches.keys();
    return {
      ok: registration.scope.endsWith('/apps/cert/')
        && registration.active?.scriptURL.includes('/apps/cert/service-worker.js')
        && Boolean(navigator.serviceWorker.controller)
        && manifest.scope === '/apps/cert/'
        && manifest.start_url === '/apps/cert/'
        && cacheNames.some(name => name.startsWith('cert-shell-'))
        && cacheNames.includes('cert-runtime-v1'),
      message: 'scope=' + registration.scope
        + ', script=' + registration.active?.scriptURL
        + ', controller=' + Boolean(navigator.serviceWorker.controller)
        + ', manifest=' + manifest.scope + '/' + manifest.start_url
        + ', caches=' + cacheNames.join('|')
    };
  })()`), page.exceptions);

  await page.send('Network.enable');
  await page.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0
  });
  await page.navigate(`${origin}/apps/cert/`, 390, 844);
  await page.waitUntil('document.querySelectorAll(".hub-cert-tile").length === 23');
  assertResult('Certification PWA reopens the gallery offline', await page.evaluate(`(() => ({
    ok: Boolean(navigator.serviceWorker.controller)
      && document.querySelectorAll('.hub-certification-group').length === 3
      && document.querySelectorAll('.hub-cert-tile').length === 23
      && document.documentElement.scrollWidth <= window.innerWidth,
    message: 'controller=' + Boolean(navigator.serviceWorker.controller)
      + ', groups=' + document.querySelectorAll('.hub-certification-group').length
      + ', cards=' + document.querySelectorAll('.hub-cert-tile').length
  }))()`), page.exceptions);
  await page.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1
  });

  page.close();
  console.log('CERT smoke tests passed.');
} finally {
  await stopProcess(chrome);
  await stopProcess(server);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
