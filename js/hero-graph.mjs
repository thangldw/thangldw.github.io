// Hero for the home page: a row of four isometric islands (sources, pipeline, retrieval, apps)
// joined by a data flow, each with a localized callout card. The islands build in sequence,
// then packets keep moving along the flow. Static when motion is reduced.
import { locales } from './home-locales.mjs?v=20261125-three';

const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6);
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');
const COLORS = ['#f59e0b', '#a78bfa', '#38bdf8', '#16a36a'];
const LAYOUTS = {
 wide: { w: 1232, h: 240, S: 26, cy: 112, card: { w: 244, h: 46, y: 188, title: 14, sub: 11.5 }, islands: [[170, 0], [470, 0], [770, 0], [1070, 0]] },
 compact: { w: 600, h: 560, S: 30, cy: 128, card: { w: 270, h: 58, y: 214, title: 16, sub: 13 }, islands: [[150, 0], [450, 0], [150, 280], [450, 280]] }
};

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};

function build(layout) {
 const { w, h, S, cy, card } = layout;
 const k = S / 22;
 const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#0e1c33' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .5, cy: .5, r: .55 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .4 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .1 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)', 'url(#hg-glow)']) el('rect', { width: w, height: h, fill }, svg);

 const islands = layout.islands.map(([ox, dy], index) => {
  const oy = cy + dy;
  const P = (x, y, z = 0) => [ox + (x - y) * C * S, oy + (x + y) * .5 * S - z * S];
  const pts = list => list.map(p => P(...p).map(n => n.toFixed(1)).join(',')).join(' ');
  const poly = (list, fill, parent, extra = {}) => el('polygon', { points: pts(list), fill, 'stroke-linejoin': 'round', ...extra }, parent);
  const box = (parent, x, y, z, bw, bd, bh, top, left, right, extra = {}) => {
   const g = el('g', {}, parent);
   poly([[x, y + bd, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x, y + bd, z]], left, g, extra);
   poly([[x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x + bw, y, z]], right, g, extra);
   poly([[x, y, z + bh], [x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x, y + bd, z + bh]], top, g, extra);
   return g;
  };
  const g = el('g', {}, svg);
  const plate = el('g', {}, g);
  poly([[-2.4, -2.4], [2.4, -2.4], [2.4, 2.4], [-2.4, 2.4]], '#16294d', plate, { stroke: '#2c4a86' });
  for (let i = -1; i <= 1; i++) for (const [a, b] of [[[i * 1.6, -2.4], [i * 1.6, 2.4]], [[-2.4, i * 1.6], [2.4, i * 1.6]]]) {
   const [p, q] = [P(...a), P(...b)];
   el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: '#2c4a86', 'stroke-width': .6, opacity: .6 }, plate);
  }
  const rise = [], drop = [], pop = [], idle = [];
  let hot;
  const muted = ['#b9c4dc', '#5b6b8c', '#46557a'];
  if (index === 0) {
   // Discover: scattered, mismatched sources and a question mark
   [[-1.9, -1.9, .9], [.1, -2.1, 1.5], [-2, .1, .6], [-.5, -.6, 1.15], [1.2, .5, .75]].forEach(([x, y, th], q) => {
    const crate = box(g, x, y, 0, 1.1 + (q % 2) * .3, 1.1, th, ...muted);
    drop.push(crate);
   });
   [[[-1.3, -1.3], [-.6, -.1], [.2, -.6]], [[.6, -1.5], [.5, .3], [1.5, 1.3]]].forEach(path => {
    const d = path.map(([x, y], q) => `${q ? 'L' : 'M'}${P(x, y, .02).map(n => n.toFixed(1)).join(' ')}`).join('');
    pop.push(el('path', { d, fill: 'none', stroke: '#8fb0ff', 'stroke-width': 1.6, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round', opacity: .7 }, g));
   });
   const q = P(-.5 + .55, -.6 + .55, 3);
   const mark = el('text', { x: q[0], y: q[1], fill: '#fff', 'font-size': 26 * k, 'font-weight': 800, 'text-anchor': 'middle' }, g);
   mark.textContent = '?';
   pop.push(mark); idle.push({ node: mark, bob: true });
   hot = P(.05, -.05, 1.15);
  } else if (index === 1) {
   // Design: a blueprint plane hovering over the site, with the architecture drawn on it
   rise.push(box(g, -2, -2, 0, 4, 4, .22, '#2b4fb5', '#1f3fa0', '#16307f'));
   const z = 1.7;
   const plane = el('g', {}, g);
   poly([[-1.9, -1.9, z], [1.9, -1.9, z], [1.9, 1.9, z], [-1.9, 1.9, z]], 'rgba(143,176,255,.2)', plane, { stroke: '#8fb0ff', 'stroke-width': 1.4 });
   for (let i = -1; i <= 1; i++) for (const [m, n] of [[[i * 1.2, -1.9], [i * 1.2, 1.9]], [[-1.9, i * 1.2], [1.9, i * 1.2]]]) {
    const [u, v] = [P(m[0], m[1], z), P(n[0], n[1], z)];
    el('line', { x1: u[0], y1: u[1], x2: v[0], y2: v[1], stroke: '#8fb0ff', 'stroke-width': .7, opacity: .5 }, plane);
   }
   const nodes = [[-1.3, -1.3], [.5, -1.3], [-1.3, .4], [.5, .5]];
   [[0, 1], [0, 2], [1, 3], [2, 3]].forEach(([i, j]) => {
    const [u, v] = [P(nodes[i][0] + .3, nodes[i][1] + .3, z), P(nodes[j][0] + .3, nodes[j][1] + .3, z)];
    el('line', { x1: u[0], y1: u[1], x2: v[0], y2: v[1], stroke: '#fff', 'stroke-width': 1.6 * k, 'stroke-linecap': 'round' }, plane);
   });
   nodes.forEach(([x, y], q) => pop.push(box(plane, x, y, z, .7, .7, .3, ['#fff', '#cfe0ff', '#a9bce6'][0], '#8fb0ff', '#6f90e8')));
   [[-1.9, -1.9], [1.9, -1.9], [1.9, 1.9], [-1.9, 1.9]].forEach(([x, y]) => { const [u, v] = [P(x, y, .22), P(x, y, z)]; el('line', { x1: u[0], y1: u[1], x2: v[0], y2: v[1], stroke: '#2c4a86', 'stroke-width': 1.4 }, g); });
   [[-1.7, 1.0], [1.0, -1.7]].forEach(([x, y]) => rise.push(box(g, x, y, .22, .8, .8, .5, '#b8ccff', '#3b6bef', '#2447b8')));
   rise.push(plane); idle.push({ node: plane, bob: true });
   hot = P(.1, .1, z + .3);
  } else if (index === 2) {
   // Build: the platform goes up block by block, side by side with the customer's team
   rise.push(box(g, -2.1, -2.1, 0, 4.2, 4.2, .25, '#2b4fb5', '#1f3fa0', '#16307f'));
   const built = [[-1.7, -1.7, 1.2], [.1, -1.7, 1.9], [-1.7, .1, .9]];
   built.forEach(([x, y, th]) => {
    const blk = box(g, x, y, .25, 1.5, 1.5, th, '#b8ccff', '#3b6bef', '#2447b8');
    drop.push(blk);
   });
   const slot = el('g', {}, g);
   poly([[.1, .1, .25], [1.6, .1, .25], [1.6, 1.6, .25], [.1, 1.6, .25]], 'none', slot, { stroke: '#8fb0ff', 'stroke-width': 1.4, 'stroke-dasharray': '4 4' });
   pop.push(slot);
   const next = box(g, .35, .35, .25, 1, 1, 1, '#fff', '#c9d6f2', '#a9bce6');
   idle.push({ node: next, drop: true });
   hot = P(.85, -.95, 2.25 + .0);
  } else {
   // Run: a dependable system with evaluation gates passing
   rise.push(box(g, -2.1, -2.1, 0, 4.2, 4.2, .25, '#2b4fb5', '#1f3fa0', '#16307f'));
   const main = box(g, -1.6, -1.6, .25, 2, 2, 1.9, '#b8ccff', '#3b6bef', '#2447b8');
   rise.push(main);
   const cp = P(-.6, .4, 1.2);
   const badge = el('g', {}, g);
   el('circle', { cx: cp[0], cy: cp[1], r: 12 * k, fill: '#16a36a', stroke: '#fff', 'stroke-width': 2 }, badge);
   el('path', { d: `M${cp[0] - 5.5 * k} ${cp[1]}l${4 * k} ${4 * k} ${7.5 * k} ${-8 * k}`, fill: 'none', stroke: '#fff', 'stroke-width': 2.6 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, badge);
   pop.push(badge);
   const ring = el('circle', { cx: cp[0], cy: cp[1], r: 12 * k, fill: 'none', stroke: '#5fe0a8', 'stroke-width': 2 }, g);
   idle.push({ node: ring, pulse: true });
   [[.7, -1.2, .8], [.7, -.2, 1.3], [.7, .8, 1.8]].forEach(([x, y, th]) => rise.push(box(g, x, y, .25, .8, .8, th, '#b6f0d3', '#16a36a', '#0e7a4d')));
   hot = P(-.6, -.6, 2.15);
  }

  const cardX = ox - card.w / 2, cardY = card.y + dy;
  const group = el('g', { class: 'callout' }, svg);
  const line = el('line', { x1: ox, y1: cardY, x2: hot[0], y2: hot[1], stroke: COLORS[index], 'stroke-width': 1.8, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, group);
  const cardNode = el('g', {}, group);
  el('rect', { x: cardX, y: cardY, width: card.w, height: card.h, rx: 10, fill: '#fff' }, cardNode);
  el('circle', { cx: cardX + 22, cy: cardY + card.h / 2, r: 11, fill: COLORS[index] }, cardNode);
  const num = el('text', { x: cardX + 22, y: cardY + card.h / 2 + 4.5, fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, cardNode);
  num.textContent = String(index + 1);
  const title = el('text', { x: cardX + 42, y: cardY + card.h * .44, fill: '#10213a', 'font-size': card.title, 'font-weight': 700 }, cardNode);
  const sub = el('text', { x: cardX + 42, y: cardY + card.h * .76, fill: '#51607a', 'font-size': card.sub }, cardNode);
  const dot = el('circle', { cx: hot[0], cy: hot[1], r: 5.5, fill: COLORS[index], stroke: '#fff', 'stroke-width': 2 }, group);
  return { g, plate, rise, drop, pop, idle, group, line, cardNode, dot, title, sub };
 });

 // data flow between neighbouring islands; the compact grid has no link from row one to row two
 const flows = [], packets = [];
 const links = layout === LAYOUTS.wide ? [[0, 1], [1, 2], [2, 3]] : [[0, 1], [2, 3]];
 links.forEach(([a, b]) => {
  const [ax, ay] = layout.islands[a], [bx, by] = layout.islands[b];
  const lx1 = ax + 4.2 * C * S, lx2 = bx - 4.2 * C * S;
  flows.push(el('line', { x1: lx1, y1: cy + ay, x2: lx2, y2: cy + by, stroke: '#8fb0ff', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: .9 }, svg));
  packets.push({ node: el('circle', { cx: lx1, cy: cy + ay, r: 4.5, fill: '#fff', opacity: 0 }, svg), len: lx2 - lx1 });
 });
 return { svg, islands, flows, packets };
}

function animate(scene) {
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 const rise = (n, delay) => n.animate([{ transform: 'translateY(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };

 scene.islands.forEach((isl, i) => {
  const t0 = 150 + i * 900;
  isl.plate.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: t0, fill: 'backwards' });
  isl.rise.forEach((n, q) => rise(n, t0 + 300 + q * 120));
  isl.drop.forEach((n, q) => drop(n, t0 + 350 + q * 170));
  isl.pop.forEach((n, q) => grow(n, t0 + 700 + q * 140));
  const reveal = t0 + 800;
  grow(isl.dot, reveal);
  isl.line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: reveal + 150, fill: 'backwards' });
  isl.cardNode.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: reveal + 250, easing: ease, fill: 'backwards' });
  isl.idle.forEach((item, q) => {
   if (item.pulse) { item.node.style.transformBox = 'fill-box'; item.node.style.transformOrigin = 'center'; item.node.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 1800, delay: t0 + 1800, iterations: Infinity, easing: 'ease-out' }); }
   else if (item.drop) item.node.animate([{ transform: 'translateY(-46px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .35 }, { transform: 'translateY(0)', opacity: 1, offset: .85 }, { transform: 'translateY(0)', opacity: 0 }], { duration: 3000, delay: t0 + 1500, iterations: Infinity, easing: 'ease-in' });
   else if (item.bob) item.node.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 3200, delay: 3600 + q * 350, iterations: Infinity, easing: 'ease-in-out' });
   else item.node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .9 }, { transform: `translate(${item.dx}px,${item.dy}px)`, opacity: 0 }], { duration: 2600, delay: t0 + 1400, iterations: Infinity, easing: 'linear' });
  });
 });
 scene.packets.forEach(({ node, len }, i) => {
  const n = scene.packets.length, a = i / n, z = (i + 1) / n;
  const frames = [{ offset: 0, opacity: 0, transform: 'translateX(0)' }];
  if (a > 0) frames.push({ offset: a, opacity: 0, transform: 'translateX(0)' });
  frames.push({ offset: a + .01, opacity: 1, transform: 'translateX(0)' }, { offset: z - .01, opacity: 1, transform: `translateX(${len}px)` }, { offset: z, opacity: 0, transform: `translateX(${len}px)` });
  if (z < 1) frames.push({ offset: 1, opacity: 0, transform: `translateX(${len}px)` });
  node.animate(frames, { duration: 2000 * n, delay: 4200, iterations: Infinity, easing: 'linear' });
 });
 scene.flows.forEach((f, i) => {
  f.animate([{ opacity: 0 }, { opacity: .9 }], { duration: 500, delay: 700 + i * 900, fill: 'backwards' });
  f.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -9 }], { duration: 700, iterations: Infinity, delay: 1200 + i * 900 });
 });
}

if (figure && frame) {
 try {
  const compact = matchMedia('(max-width: 900px)').matches;
  const scene = build(compact ? LAYOUTS.compact : LAYOUTS.wide);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || compact;
  frame.replaceChildren(scene.svg);
  if (!still && typeof scene.svg.animate === 'function') animate(scene);
  const setText = copy => {
   scene.svg.setAttribute('aria-label', copy.heroAlt);
   scene.islands.forEach((isl, i) => { isl.title.textContent = copy.heroCallouts[i][0]; isl.sub.textContent = copy.heroCallouts[i][1]; });
  };
  const lang = document.documentElement.lang === 'zh-CN' ? 'zh' : document.documentElement.lang;
  setText(locales[lang] || locales.en);
  document.addEventListener('homelocale', e => setText(e.detail.copy));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
