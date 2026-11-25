// Hero for the home page: an isometric data platform (sources -> pipeline -> retrieval -> apps).
// Each stage builds in turn, then a light idle loop keeps the flow moving.
// Static when motion is reduced or on narrow screens.
const NS = 'http://www.w3.org/2000/svg';
const S = 25, OX = 150, OY = 100, C = Math.cos(Math.PI / 6);
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};
const P = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * .5 * S - z * S];
const pts = list => list.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const poly = (list, fill, parent, extra = {}) => el('polygon', { points: pts(list), fill, 'stroke-linejoin': 'round', ...extra }, parent);

function box(parent, x, y, z, w, d, h, top, left, right, extra = {}) {
 const g = el('g', {}, parent);
 poly([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], left, g, extra);
 poly([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], right, g, extra);
 poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top, g, extra);
 return g;
}

// Centred under an isometric anchor point so each label sits against its own block.
function tag(parent, label, anchor) {
 const g = el('g', {}, parent);
 const w = label.length * 6.2 + 16;
 const x = anchor[0] - w / 2, y = anchor[1] + 16;
 el('rect', { x, y: y - 11, width: w, height: 22, rx: 7, fill: '#fff' }, g);
 const t = el('text', { x: x + 8, y: y + 4, fill: '#10213a', 'font-size': 11.5, 'font-weight': 600 }, g);
 t.textContent = label;
 return g;
}

const icons = {
 cross: (c, g) => { const f = el('g', { fill: '#16a36a' }, g); el('rect', { x: c[0] - 3.5, y: c[1] - 9, width: 7, height: 18, rx: 2 }, f); el('rect', { x: c[0] - 9, y: c[1] - 3.5, width: 18, height: 7, rx: 2 }, f); return f; },
 book: (c, g) => { const f = el('g', { fill: '#1d4ed8' }, g); el('path', { d: `M${c[0] - 10} ${c[1] - 6}q10 -5 10 0v10q0 -5 -10 0z` }, f); el('path', { d: `M${c[0] + 10} ${c[1] - 6}q-10 -5 -10 0v10q0 -5 10 0z`, opacity: .7 }, f); return f; },
 molecule: (c, g) => {
  const f = el('g', { stroke: '#5236c0', 'stroke-width': 2.4, fill: '#5236c0' }, g);
  const p = [[c[0] - 8, c[1] + 5], [c[0] + 8, c[1] + 5], [c[0], c[1] - 8]];
  el('polygon', { points: pts(p), fill: 'none' }, f);
  p.forEach(([cx, cy]) => el('circle', { cx, cy, r: 3.8 }, f));
  return f;
 }
};

function build() {
 const svg = el('svg', { viewBox: '0 0 520 360', role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#0e1c33' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .5, cy: .55, r: .6 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .45 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .1 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)', 'url(#hg-glow)']) el('rect', { width: 520, height: 360, fill }, svg);

 const plate = el('g', {}, svg);
 poly([P(-1.5, -2), P(12.5, -2), P(12.5, 3), P(-1.5, 3)], '#16294d', plate, { stroke: '#2c4a86' });
 for (let i = -1; i < 13; i++) { const [a, b] = [P(i, -2), P(i, 3)]; el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#2c4a86', 'stroke-width': .6, opacity: .6 }, plate); }
 for (let j = -2; j < 4; j++) { const [a, b] = [P(-1.5, j), P(12.5, j)]; el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#2c4a86', 'stroke-width': .6, opacity: .6 }, plate); }

 const [fa, fb] = [P(1.6, .5, .02), P(9.6, .5, .02)];
 const flow = el('line', { x1: fa[0], y1: fa[1], x2: fb[0], y2: fb[1], stroke: '#8fb0ff', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: .9 }, svg);

 const slabs = [[0, 0], [.75, 1], [1.5, 2]].map(([z]) => {
  const g = box(svg, -.6, -.5, z, 2, 2, .55, '#a9c2ff', '#2f55c8', '#1f3fa0');
  [0, 1, 2].forEach(q => { const p = P(-.25 + q * .38, 1.5, z + .28); el('circle', { cx: p[0], cy: p[1], r: 2.2, fill: q === 0 ? '#5fe0a8' : '#cfe0ff' }, g); });
  return g;
 });

 const pipe = box(svg, 2.8, 0, 0, 3, 1, .45, '#8fb0ff', '#2f55c8', '#1f3fa0');
 const chevrons = [0, 1, 2, 3].map(q => { const x = 3.1 + q * .7; return poly([P(x, .25, .46), P(x + .35, .5, .46), P(x, .75, .46), P(x + .12, .5, .46)], '#10213a', svg); });

 const rag = box(svg, 6.6, -.6, 0, 2, 2.2, 1.9, '#b8ccff', '#3b6bef', '#2447b8');
 const sheets = [2.5, 3, 3.5].map((dz, q) => box(svg, 6.75 + q * .12, -.35 + q * .1, dz, 1.5, 1.7, .12, '#e6eeff', '#8fb0ff', '#6f90e8', { opacity: .95 }));
 const lens = el('g', { stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, svg);
 const lp = P(7.6, 1.7, 1.1);
 el('circle', { cx: lp[0], cy: lp[1], r: 9 }, lens);
 el('line', { x1: lp[0] + 6.5, y1: lp[1] + 6.5, x2: lp[0] + 15, y2: lp[1] + 15 }, lens);

 const apps = [[-1.4, 1.1, 'cross'], [.2, 1.5, 'book'], [1.8, .8, 'molecule']].map(([y, h, icon]) => {
  const g = el('g', {}, svg);
  box(g, 10.2, y, 0, 1.2, 1.2, h, '#ffffff', '#c9d6f2', '#a9bce6');
  const mark = icons[icon](P(10.8, y + .6, h), g);
  return { g, mark };
 });

 const tags = el('g', {}, svg);
 const labels = [tag(tags, 'Sources', P(.4, 1.6)), tag(tags, 'Pipeline', P(4.3, 1)), tag(tags, 'Retrieval', P(7.6, 1.6)), tag(tags, 'Applications', P(10.8, 3))];
 return { svg, plate, flow, slabs, pipe, chevrons, rag, sheets, lens, apps, labels };
}

function animate(s) {
 const ease = 'cubic-bezier(.2,.7,.2,1)', pop = 'cubic-bezier(.3,1.5,.5,1)';
 const rise = (n, delay, dy = 28) => n.animate([{ transform: `translateY(${dy}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const label = (n, delay) => n.animate([{ transform: 'translateX(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay, easing: ease, fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };

 s.plate.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'backwards' });
 s.flow.animate([{ opacity: 0 }, { opacity: .9 }], { duration: 600, delay: 500, fill: 'backwards' });
 s.slabs.forEach((g, i) => drop(g, 450 + i * 220));
 label(s.labels[0], 1150);
 rise(s.pipe, 1300);
 s.chevrons.forEach((c, i) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 1750 + i * 120, fill: 'backwards' }));
 label(s.labels[1], 1650);
 rise(s.rag, 1950, 34);
 s.sheets.forEach((g, i) => drop(g, 2350 + i * 200));
 grow(s.lens, 2900);
 label(s.labels[2], 2550);
 s.apps.forEach(({ g, mark }, i) => { rise(g, 3100 + i * 200, 24); grow(mark, 3550 + i * 200); });
 label(s.labels[3], 3500);

 // idle: the flow keeps moving and the sheets float, started after the build
 s.flow.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -9 }], { duration: 700, iterations: Infinity, delay: 1100 });
 s.sheets.forEach((g, i) => g.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 3200, delay: 3400 + i * 350, iterations: Infinity, easing: 'ease-in-out' }));
}

if (figure && frame) {
 try {
  const scene = build();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 720px)').matches;
  frame.replaceChildren(scene.svg);
  if (!still && typeof scene.svg.animate === 'function') animate(scene);
  document.addEventListener('homelocale', e => scene.svg.setAttribute('aria-label', e.detail.copy.heroAlt));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
