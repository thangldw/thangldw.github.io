// Hero for the home page: an isometric stack in which every open-source repository is a block
// and every merged pull request a cube that lands on it. Blocks rise in sequence, cubes drop in.
// Data mirrors the Community page; static when motion is reduced or on narrow screens.
const repos = [{"id": "rea", "name": "REA", "y": 44, "xs": 60, "xe": 500, "prs": [["1533", "Inspect local WASM artifacts", "https://github.com/morluto/rea/pull/1533"], ["2464", "Compare WASM interfaces", "https://github.com/morluto/rea/pull/2464"], ["1482", "Inspect PE resources", "https://github.com/morluto/rea/pull/1482"], ["1506", "Bound framework conventions", "https://github.com/morluto/rea/pull/1506"], ["2214", "Compare inventories using declared coverage", "https://github.com/morluto/rea/pull/2214"], ["2256", "NIBArchive resource-key joins", "https://github.com/morluto/rea/pull/2256"]]}, {"id": "chemprop", "name": "Chemprop", "y": 250, "xs": 210, "xe": 320, "prs": [["1379", "Dynamic graph sizes in exported models", "https://github.com/chemprop/chemprop/pull/1379"]]}, {"id": "xdsl", "name": "xDSL", "y": 112, "xs": 382, "xe": 490, "prs": [["6252", "Enable Ruff RUF033 in CI", "https://github.com/xdslproject/xdsl/pull/6252"]]}, {"id": "openmed", "name": "OpenMed", "y": 112, "xs": 118, "xe": 258, "prs": [["1601", "Vietnamese PII language pack", "https://github.com/maziyarpanahi/openmed/pull/1601"], ["1593", "Hungarian TAJ language pack", "https://github.com/maziyarpanahi/openmed/pull/1593"]]}, {"id": "nmos", "name": "Sony NMOS", "y": 112, "xs": 266, "xe": 374, "prs": [["502", "SMPTE 2022-7 temporal redundancy", "https://github.com/sony/nmos-cpp/pull/502"]]}, {"id": "hatena", "name": "Hatena Blog", "y": 250, "xs": 330, "xe": 440, "prs": [["193", "Run workflows from a subdirectory", "https://github.com/hatena/hatenablog-workflows/pull/193"]]}, {"id": "diagram", "name": "Diagram Design", "y": 250, "xs": 60, "xe": 200, "prs": [["101", "Quantitative polar charts", "https://github.com/cathrynlavery/diagram-design/pull/101"], ["105", "Correct effective-width checklist", "https://github.com/cathrynlavery/diagram-design/pull/105"]]}];
const NS = 'http://www.w3.org/2000/svg';
const DX = 20, DY = 10, U = 12, OX = 64, OY = 272;
const W = 3, D = 2.4, GAP = 2.7, INK = '#10213a', COBALT = '#1d4ed8', PAPER = '#f4f7fd';
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};
const P = (gx, gy, z) => `${(OX + (gx - gy) * DX).toFixed(1)},${(OY + (gx + gy) * DY - z * U).toFixed(1)}`;
const poly = (pts, fill, parent) => el('polygon', { points: pts.map(p => P(...p)).join(' '), fill, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, parent);

// A box occupies [x0,x1] x [y0,y1] from z0 to z1; its visible faces are top, front-left and front-right.
function box({ x0, x1, y0, y1, z0, z1 }, fills, parent) {
 const g = el('g', {}, parent);
 poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], fills.left, g);
 poly([[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], fills.right, g);
 poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], fills.top, g);
 return g;
}

function build() {
 const svg = el('svg', { viewBox: '0 0 520 360', role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const floor = el('pattern', { id: 'hi-floor', width: DX * 2, height: DY * 2, patternUnits: 'userSpaceOnUse', x: OX % (DX * 2), y: OY % (DY * 2) }, defs);
 el('path', { d: `M0 ${DY}L${DX} 0L${DX * 2} ${DY}L${DX} ${DY * 2}Z`, fill: 'none', stroke: '#c9d3e6', 'stroke-width': 1 }, floor);
 const hatch = el('pattern', { id: 'hi-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
 el('rect', { width: 7, height: 7, fill: '#e3ebff' }, hatch);
 el('rect', { width: 3.6, height: 7, fill: COBALT }, hatch);
 el('rect', { width: 520, height: 360, fill: '#eaeff8' }, svg);
 el('rect', { width: 520, height: 360, fill: 'url(#hi-floor)' }, svg);

 const sorted = [...repos].sort((a, b) => a.prs.length - b.prs.length);
 const stack = el('g', {}, svg);
 const tags = el('g', {}, svg);
 const blocks = [];
 // back-most block first so nearer ones paint over it
 for (let i = sorted.length - 1; i >= 0; i--) {
  const repo = sorted[i];
  const y0 = -i * GAP, y1 = y0 + D, h = 1.6 + i * .7;
  const g = el('g', {}, stack);
  box({ x0: 0, x1: W, y0, y1, z0: 0, z1: h }, { left: INK, right: 'url(#hi-hatch)', top: PAPER }, g);
  const slots = [];
  for (let ix = 0; ix < 3; ix++) for (let iy = 0; iy < 2; iy++) slots.push([.12 + ix * .96, y0 + .16 + iy * 1.08]);
  slots.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const cubes = repo.prs.map(([number, title, url], k) => {
   const [cx, cy] = slots[k];
   const a = el('a', { href: url, target: '_blank', rel: 'noopener', 'aria-label': `${repo.name} #${number}: ${title}` }, g);
   box({ x0: cx, x1: cx + .8, y0: cy, y1: cy + .8, z0: h, z1: h + .8 }, { left: INK, right: COBALT, top: '#fff' }, a);
   a.dataset.tip = JSON.stringify([repo.name, `#${number}`, title]);
   return a;
  });
  const [tx, ty] = P(W, y0 + D / 2, .5).split(',').map(Number);
  const tag = el('g', {}, tags);
  const label = `${repo.name} \u00b7 ${repo.prs.length}`;
  const w = label.length * 6.1 + 16;
  el('rect', { x: tx + 10, y: ty - 10, width: w, height: 20, rx: 6, fill: INK }, tag);
  el('circle', { cx: tx, cy: ty, r: 3.2, fill: INK, stroke: '#fff', 'stroke-width': 1.5 }, tag);
  el('path', { d: `M${tx} ${ty}H${tx + 10}`, stroke: INK, 'stroke-width': 1.6 }, tag);
  const text = el('text', { x: tx + 18, y: ty + 4, fill: '#fff', 'font-size': 11, 'font-weight': 600 }, tag);
  text.textContent = label;
  blocks[i] = { g, cubes, tag };
 }
 return { svg, blocks };
}

function animate({ blocks }) {
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 blocks.forEach(({ g, cubes, tag }, i) => {
  const t0 = 150 + i * 300;
  g.animate([{ transform: 'translateY(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: t0, easing: ease, fill: 'backwards' });
  cubes.forEach((a, k) => a.animate([{ transform: 'translateY(-46px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 560, delay: t0 + 480 + k * 130, easing: 'ease-in', fill: 'backwards' }));
  tag.animate([{ transform: 'translateX(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, delay: t0 + 380, easing: ease, fill: 'backwards' });
 });
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
  const box = a.getBoundingClientRect(), host = figure.getBoundingClientRect();
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
  if (!still && typeof graph.svg.animate === 'function') animate(graph);
  document.addEventListener('homelocale', e => graph.svg.setAttribute('aria-label', e.detail.copy.heroAlt));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
