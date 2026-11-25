// Hero for the home page: an isometric data platform (sources -> pipeline -> retrieval -> apps).
// Each stage builds in turn, then a light idle loop keeps the flow moving.
// Static when motion is reduced or on narrow screens.
import { locales } from './home-locales.mjs?v=20261125-three';

const NS = 'http://www.w3.org/2000/svg';
const S = 22, OX = 205, OY = 112, C = Math.cos(Math.PI / 6);
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
// Callout cards tie each area of work to the part of the platform it describes.
const CALLOUTS = [
 { color: '#f59e0b', card: [14, 12, 176], hot: [.4, .5, 2.1], from: 'right' },
 { color: '#16a36a', card: [14, 278, 176], hot: [4.3, .5, .46], from: 'right' },
 { color: '#a78bfa', card: [410, 12, 176], hot: [7.6, .5, 3.75], from: 'left' },
 { color: '#38bdf8', card: [410, 278, 176], hot: [10.8, .8, 1.55], from: 'left' }
];

function callout(parent, spec) {
 const [x, y, w] = spec.card, h = 50;
 const g = el('g', { class: 'callout' }, parent);
 const [hx, hy] = P(...spec.hot);
 const ax = spec.from === 'right' ? x + w : x, ay = y + h / 2;
 const line = el('line', { x1: ax, y1: ay, x2: hx, y2: hy, stroke: spec.color, 'stroke-width': 1.8, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, g);
 const card = el('g', {}, g);
 el('rect', { x, y, width: w, height: h, rx: 9, fill: '#fff' }, card);
 el('rect', { x, y: y + 9, width: 4, height: h - 18, rx: 2, fill: spec.color }, card);
 const title = el('text', { x: x + 16, y: y + 21, fill: '#10213a', 'font-size': 12.5, 'font-weight': 700 }, card);
 const sub = el('text', { x: x + 16, y: y + 37, fill: '#51607a', 'font-size': 10.5 }, card);
 const dot = el('circle', { cx: hx, cy: hy, r: 5, fill: spec.color, stroke: '#fff', 'stroke-width': 2 }, g);
 return { g, line, card, dot, title, sub };
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
 const svg = el('svg', { viewBox: '0 0 600 340', role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#0e1c33' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .5, cy: .55, r: .6 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .45 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .1 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)', 'url(#hg-glow)']) el('rect', { width: 600, height: 340, fill }, svg);

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

 const callouts = CALLOUTS.map(spec => callout(svg, spec));
 return { svg, plate, flow, slabs, pipe, chevrons, rag, sheets, lens, apps, callouts };
}

function animate(s) {
 const ease = 'cubic-bezier(.2,.7,.2,1)', pop = 'cubic-bezier(.3,1.5,.5,1)';
 const rise = (n, delay, dy = 28) => n.animate([{ transform: `translateY(${dy}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };

 s.plate.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'backwards' });
 s.flow.animate([{ opacity: 0 }, { opacity: .9 }], { duration: 600, delay: 500, fill: 'backwards' });
 s.slabs.forEach((g, i) => drop(g, 450 + i * 220));
 rise(s.pipe, 1300);
 s.chevrons.forEach((c, i) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 1750 + i * 120, fill: 'backwards' }));
 rise(s.rag, 1950, 34);
 s.sheets.forEach((g, i) => drop(g, 2350 + i * 200));
 grow(s.lens, 2900);
 s.apps.forEach(({ g, mark }, i) => { rise(g, 3100 + i * 200, 24); grow(mark, 3550 + i * 200); });

 const reveal = ({ card, line, dot }, delay) => {
  grow(dot, delay);
  line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: delay + 150, fill: 'backwards' });
  card.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: delay + 250, easing: ease, fill: 'backwards' });
 };
 [1300, 2000, 3000, 3900].forEach((t, i) => reveal(s.callouts[i], t));

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
  const setText = copy => {
   scene.svg.setAttribute('aria-label', copy.heroAlt);
   const items = copy.heroCallouts;
   scene.callouts.forEach((c, i) => { c.title.textContent = items[i][0]; c.sub.textContent = items[i][1]; });
  };
  const lang = document.documentElement.lang === 'zh-CN' ? 'zh' : document.documentElement.lang;
  setText(locales[lang] || locales.en);
  document.addEventListener('homelocale', e => setText(e.detail.copy));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
