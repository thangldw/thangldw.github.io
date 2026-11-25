// Hero for the home page: a row of four isometric islands (sources, pipeline, retrieval, apps)
// joined by a data flow, each with a localized callout card. The islands build in sequence,
// then packets keep moving along the flow. Static when motion is reduced.
import { locales } from './home-locales.mjs?v=20261125-three';

const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6);
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');
const COLORS = ['#f59e0b', '#16a36a', '#a78bfa', '#38bdf8'];
const LAYOUTS = {
 wide: { w: 1232, h: 240, S: 24, cy: 108, card: { w: 250, h: 48, y: 182, title: 14, sub: 11.5 }, islands: [[170, 0], [470, 0], [770, 0], [1070, 0]] },
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
  if (index === 0) {
   [[-1.7, -1.5, 3], [.3, -.2, 2]].forEach(([x, y, n], s) => {
    const size = s ? 1.6 : 1.9;
    for (let q = 0; q < n; q++) {
     const slab = box(g, x, y, q * .72, size, size, .5, '#a9c2ff', '#2f55c8', '#1f3fa0');
     [0, 1, 2].forEach(i => { const p = P(x + .3 + i * .38, y + size, q * .72 + .26); el('circle', { cx: p[0], cy: p[1], r: 2 * k, fill: i === 0 ? '#5fe0a8' : '#cfe0ff' }, slab); });
     drop.push(slab);
    }
    if (!s) hot = P(x + size / 2, y + size / 2, 2 * .72 + .5);
   });
  } else if (index === 1) {
   const a = box(g, -2, -1, 0, 3.4, .9, .4, '#8fb0ff', '#2f55c8', '#1f3fa0');
   const b = box(g, -1.1, .3, 0, 3, .8, .34, '#8fb0ff', '#2f55c8', '#1f3fa0');
   rise.push(a, b);
   for (let q = 0; q < 4; q++) { const x = -1.7 + q * .75; pop.push(el('polygon', { points: pts([[x, -.8, .41], [x + .35, -.55, .41], [x, -.3, .41], [x + .12, -.55, .41]]), fill: '#10213a' }, g)); }
   const packet = box(g, -1.9, -.75, .4, .5, .5, .4, '#fff', '#c9d6f2', '#a9bce6');
   idle.push({ node: packet, dx: 3 * C * S, dy: 1.5 * S });
   hot = P(-.3, -.55, .4);
  } else if (index === 2) {
   rise.push(box(g, -.9, -1.5, 0, 1.9, 2, 1.7, '#b8ccff', '#3b6bef', '#2447b8'));
   rise.push(box(g, 1.2, .4, 0, 1, 1, .65, '#cfe0ff', '#6f90e8', '#4a6fd0'));
   [2.5, 3, 3.5].forEach((z, q) => drop.push(box(g, -.75 + q * .12, -1.25 + q * .1, z, 1.5, 1.7, .12, '#e6eeff', '#8fb0ff', '#6f90e8', { opacity: .95 })));
   const lens = el('g', { stroke: '#fff', 'stroke-width': 3 * k, fill: 'none', 'stroke-linecap': 'round' }, g);
   const lp = P(.0, .5, .85);
   el('circle', { cx: lp[0], cy: lp[1], r: 9 * k }, lens);
   el('line', { x1: lp[0] + 6.5 * k, y1: lp[1] + 6.5 * k, x2: lp[0] + 15 * k, y2: lp[1] + 15 * k }, lens);
   pop.push(lens);
   idle.push(...drop.map(n => ({ node: n, bob: true })));
   hot = P(-.1, -.4, 3.7);
  } else {
   const tiles = [[-1.9, -1.9, 1.1, 'cross'], [-.2, -1.9, 1.5, 'book'], [-1.9, -.2, .8, 'molecule'], [-.2, -.2, 1.3, 'bars']];
   tiles.forEach(([x, y, th, icon]) => {
    const tile = el('g', {}, g);
    box(tile, x, y, 0, 1.5, 1.5, th, '#ffffff', '#c9d6f2', '#a9bce6');
    const c = P(x + .75, y + .75, th);
    const m = el('g', {}, tile);
    if (icon === 'cross') { m.setAttribute('fill', '#16a36a'); el('rect', { x: c[0] - 3.5 * k, y: c[1] - 9 * k, width: 7 * k, height: 18 * k, rx: 2 }, m); el('rect', { x: c[0] - 9 * k, y: c[1] - 3.5 * k, width: 18 * k, height: 7 * k, rx: 2 }, m); }
    if (icon === 'book') { m.setAttribute('fill', '#1d4ed8'); el('path', { d: `M${c[0] - 10 * k} ${c[1] - 6 * k}q${10 * k} ${-5 * k} ${10 * k} 0v${10 * k}q0 ${-5 * k} ${-10 * k} 0z` }, m); el('path', { d: `M${c[0] + 10 * k} ${c[1] - 6 * k}q${-10 * k} ${-5 * k} ${-10 * k} 0v${10 * k}q0 ${-5 * k} ${10 * k} 0z`, opacity: .7 }, m); }
    if (icon === 'molecule') {
     m.setAttribute('stroke', '#5236c0'); m.setAttribute('stroke-width', 2.4 * k); m.setAttribute('fill', '#5236c0');
     const p = [[c[0] - 8 * k, c[1] + 5 * k], [c[0] + 8 * k, c[1] + 5 * k], [c[0], c[1] - 8 * k]];
     el('polygon', { points: p.map(q => q.join(',')).join(' '), fill: 'none' }, m);
     p.forEach(([cx, cyy]) => el('circle', { cx, cy: cyy, r: 3.8 * k }, m));
    }
    if (icon === 'bars') { m.setAttribute('fill', '#e08a00'); [[-8, 2, 5], [-2, -3, 10], [4, -8, 15]].forEach(([dx, top, bh]) => el('rect', { x: c[0] + dx * k, y: c[1] + (top - 2) * k, width: 5 * k, height: bh * k, rx: 1 }, m)); }
    rise.push(tile); pop.push(m);
   });
   hot = P(-.2 + .75, -1.9 + .75, 1.5);
  }

  const cardX = ox - card.w / 2, cardY = card.y + dy;
  const group = el('g', { class: 'callout' }, svg);
  const line = el('line', { x1: ox, y1: cardY, x2: hot[0], y2: hot[1], stroke: COLORS[index], 'stroke-width': 1.8, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, group);
  const cardNode = el('g', {}, group);
  el('rect', { x: cardX, y: cardY, width: card.w, height: card.h, rx: 10, fill: '#fff' }, cardNode);
  el('rect', { x: cardX, y: cardY + 10, width: 4, height: card.h - 20, rx: 2, fill: COLORS[index] }, cardNode);
  const title = el('text', { x: cardX + 18, y: cardY + card.h * .44, fill: '#10213a', 'font-size': card.title, 'font-weight': 700 }, cardNode);
  const sub = el('text', { x: cardX + 18, y: cardY + card.h * .76, fill: '#51607a', 'font-size': card.sub }, cardNode);
  const dot = el('circle', { cx: hot[0], cy: hot[1], r: 5.5, fill: COLORS[index], stroke: '#fff', 'stroke-width': 2 }, group);
  return { g, plate, rise, drop, pop, idle, group, line, cardNode, dot, title, sub };
 });

 // data flow between neighbouring islands; the compact grid has no link from row one to row two
 const flows = [];
 const links = layout === LAYOUTS.wide ? [[0, 1], [1, 2], [2, 3]] : [[0, 1], [2, 3]];
 links.forEach(([a, b]) => {
  const [ax, ay] = layout.islands[a], [bx, by] = layout.islands[b];
  flows.push(el('line', { x1: ax + 4.2 * C * S, y1: cy + ay, x2: bx - 4.2 * C * S, y2: cy + by, stroke: '#8fb0ff', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: .9 }, svg));
 });
 return { svg, islands, flows };
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
   if (item.bob) item.node.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 3200, delay: 3600 + q * 350, iterations: Infinity, easing: 'ease-in-out' });
   else item.node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .9 }, { transform: `translate(${item.dx}px,${item.dy}px)`, opacity: 0 }], { duration: 2600, delay: t0 + 1400, iterations: Infinity, easing: 'linear' });
  });
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
