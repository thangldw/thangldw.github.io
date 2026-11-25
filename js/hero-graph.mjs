// Hero graph for the home page: every open-source repository is a branch, every merged
// pull request a node. Branches grow from the main line, merge back, and light up.
// Data mirrors the Community page; static when motion is reduced or on narrow screens.
const repos = [{"id": "rea", "name": "REA", "y": 44, "xs": 60, "xe": 500, "prs": [["1533", "Inspect local WASM artifacts", "https://github.com/morluto/rea/pull/1533"], ["2464", "Compare WASM interfaces", "https://github.com/morluto/rea/pull/2464"], ["1482", "Inspect PE resources", "https://github.com/morluto/rea/pull/1482"], ["1506", "Bound framework conventions", "https://github.com/morluto/rea/pull/1506"], ["2214", "Compare inventories using declared coverage", "https://github.com/morluto/rea/pull/2214"], ["2256", "NIBArchive resource-key joins", "https://github.com/morluto/rea/pull/2256"]]}, {"id": "chemprop", "name": "Chemprop", "y": 250, "xs": 210, "xe": 320, "prs": [["1379", "Dynamic graph sizes in exported models", "https://github.com/chemprop/chemprop/pull/1379"]]}, {"id": "xdsl", "name": "xDSL", "y": 112, "xs": 382, "xe": 490, "prs": [["6252", "Enable Ruff RUF033 in CI", "https://github.com/xdslproject/xdsl/pull/6252"]]}, {"id": "openmed", "name": "OpenMed", "y": 112, "xs": 118, "xe": 258, "prs": [["1601", "Vietnamese PII language pack", "https://github.com/maziyarpanahi/openmed/pull/1601"], ["1593", "Hungarian TAJ language pack", "https://github.com/maziyarpanahi/openmed/pull/1593"]]}, {"id": "nmos", "name": "Sony NMOS", "y": 112, "xs": 266, "xe": 374, "prs": [["502", "SMPTE 2022-7 temporal redundancy", "https://github.com/sony/nmos-cpp/pull/502"]]}, {"id": "hatena", "name": "Hatena Blog", "y": 250, "xs": 330, "xe": 440, "prs": [["193", "Run workflows from a subdirectory", "https://github.com/hatena/hatenablog-workflows/pull/193"]]}, {"id": "diagram", "name": "Diagram Design", "y": 250, "xs": 60, "xe": 200, "prs": [["101", "Quantitative polar charts", "https://github.com/cathrynlavery/diagram-design/pull/101"], ["105", "Correct effective-width checklist", "https://github.com/cathrynlavery/diagram-design/pull/105"]]}];

const NS = 'http://www.w3.org/2000/svg';
const MAIN_Y = 180, MAIN_X0 = 36, MAIN_X1 = 500;
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};

function lanePath({ y, xs, xe }) {
 const w = Math.abs(MAIN_Y - y) > 100 ? 50 : 34;
 const d = `M${xs} ${MAIN_Y} C${xs + w * .55} ${MAIN_Y} ${xs + w * .45} ${y} ${xs + w} ${y} H${xe - w} C${xe - w * .45} ${y} ${xe - w * .55} ${MAIN_Y} ${xe} ${MAIN_Y}`;
 return { d, w };
}

function build() {
 const svg = el('svg', { viewBox: '0 0 520 360', role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#10213a' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .9, cy: .5, r: .6 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .5 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .12 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)', 'url(#hg-glow)']) el('rect', { width: 520, height: 360, fill }, svg);

 const rings = el('g', { fill: 'none', stroke: '#fff', opacity: .16 }, svg);
 for (const r of [34, 62, 92, 126]) el('circle', { cx: MAIN_X1, cy: MAIN_Y, r }, rings);

 const lanes = el('g', { fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, svg);
 const colors = ['#8fb0ff', '#6f9bff', '#7fa4ff'];
 const main = el('path', { d: `M${MAIN_X0} ${MAIN_Y} H${MAIN_X1}`, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1 }, svg);
 const nodes = el('g', {}, svg);
 const timeline = [];

 [...repos].sort((a, b) => a.xs - b.xs).forEach((repo, order) => {
  const { d, w } = lanePath(repo);
  const color = colors[order % colors.length];
  const path = el('path', { d, stroke: color, pathLength: 1 }, lanes);
  const t0 = 450 + order * 230;
  const label = el('text', { x: repo.xs + w, y: repo.y + (repo.y < MAIN_Y ? -14 : 24), fill: '#dbe6ff', 'font-size': 10.5, 'font-weight': 600, opacity: .85 }, nodes);
  label.textContent = repo.name;
  el('circle', { cx: repo.xs, cy: MAIN_Y, r: 4.5, fill: '#fff' }, nodes);

  const run0 = repo.xs + w, run = repo.xe - w - run0;
  const prNodes = repo.prs.map(([number, title, url], i) => {
   const cx = run0 + run * (i + 1) / (repo.prs.length + 1);
   const a = el('a', { href: url, target: '_blank', rel: 'noopener', 'aria-label': `${repo.name} #${number}: ${title}` }, nodes);
   el('circle', { cx, cy: repo.y, r: 15, fill: 'transparent' }, a);
   const dot = el('circle', { cx, cy: repo.y, r: 6.5, fill: '#16a36a', stroke: '#10213a', 'stroke-width': 2.5 }, a);
   a.dataset.tip = JSON.stringify([repo.name, `#${number}`, title]);
   return { a, dot, frac: (i + 1) / (repo.prs.length + 1) };
  });
  const merge = el('g', {}, nodes);
  el('circle', { cx: repo.xe, cy: MAIN_Y, r: 9, fill: '#16a36a', stroke: '#10213a', 'stroke-width': 2.5 }, merge);
  el('path', { d: `M${repo.xe - 4} ${MAIN_Y} l3 3 5.5-6.5`, stroke: '#fff', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, merge);
  timeline.push({ path, prNodes, merge, t0 });
 });
 el('circle', { cx: MAIN_X0, cy: MAIN_Y, r: 10, fill: '#fff' }, svg);
 el('circle', { cx: MAIN_X1, cy: MAIN_Y, r: 16, fill: '#fff' }, svg);
 el('circle', { cx: MAIN_X1, cy: MAIN_Y, r: 7, fill: '#1d4ed8' }, svg);
 return { svg, main, timeline };
}

function animate({ main, timeline }) {
 const draw = (node, delay, duration) => node.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration, delay, fill: 'backwards', easing: 'ease-out' });
 const pop = (node, delay) => {
  node.style.transformBox = 'fill-box';
  node.style.transformOrigin = 'center';
  node.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, delay, fill: 'backwards' });
 };
 main.style.strokeDasharray = '1';
 draw(main, 100, 700);
 for (const lane of timeline) {
  lane.path.style.strokeDasharray = '1';
  draw(lane.path, lane.t0, 900);
  for (const { a, dot, frac } of lane.prNodes) {
   pop(a, lane.t0 + 900 * frac);
   dot.animate([{ fill: '#8fb0ff' }, { fill: '#16a36a' }], { duration: 350, delay: lane.t0 + 900, fill: 'backwards' });
  }
  pop(lane.merge, lane.t0 + 900);
 }
}

function bindTooltip(svg) {
 const tip = document.createElement('div');
 tip.className = 'hero-tip';
 tip.setAttribute('role', 'tooltip');
 tip.hidden = true;
 const [name, num, title] = ['b', 'span', 'span'].map(tag => tip.appendChild(document.createElement(tag)));
 figure.appendChild(tip);
 const show = a => {
  const [repo, number, text] = JSON.parse(a.dataset.tip);
  name.textContent = repo; num.textContent = ` ${number}`; title.textContent = ` ${text}`;
  tip.hidden = false;
  const box = a.querySelector('circle:last-child').getBoundingClientRect(), host = figure.getBoundingClientRect();
  const half = tip.offsetWidth / 2;
  const x = Math.min(Math.max(box.left + box.width / 2 - host.left, half + 4), host.width - half - 4);
  tip.style.left = `${x}px`;
  tip.style.top = `${box.top - host.top}px`;
 };
 const hide = () => { tip.hidden = true; };
 svg.querySelectorAll('a').forEach(a => {
  a.addEventListener('pointerenter', () => show(a));
  a.addEventListener('pointerleave', hide);
  a.addEventListener('focus', () => show(a));
  a.addEventListener('blur', hide);
 });
 document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
}

if (figure && frame) {
 try {
  const graph = build();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 720px)').matches;
  frame.replaceChildren(graph.svg);
  bindTooltip(graph.svg);
  if (!still && typeof graph.main.animate === 'function') animate(graph);
  document.addEventListener('homelocale', e => graph.svg.setAttribute('aria-label', e.detail.copy.heroAlt));
 } catch (error) {
  console.warn('Hero graph unavailable; keeping the static image.', error);
 }
}
