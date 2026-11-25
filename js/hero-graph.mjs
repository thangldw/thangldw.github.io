// Hero for the home page: an overview of the work, done, now and next. Five isometric islands
// (data platforms, software engineering, generative AI, forward deployed engineering, AI in
// manufacturing) sit on a timeline, joined by a data flow, each with a localized callout card.
// The islands build in sequence, then packets keep moving along the flow. Static when motion is
// reduced and on the compact (stacked) layout.
import { locales } from './home-locales.mjs?v=20261125-overview';

const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6);
const R2 = Math.SQRT2;
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');
// Card accents per island; ERA maps each island to done (0), now (1) or next (2).
const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#60a5fa', '#16a36a'];
const ERA = [0, 0, 1, 1, 2];
const ERA_COLORS = ['#8fb0ff', '#ffffff', '#5fe0a8'];
const LAYOUTS = {
 wide: {
  w: 1232, h: 480, S: 22, cy: 190, flow: true, ribbon: { y: 410, label: 442 },
  card: { place: 'below', w: 224, h: 52, y: 300, title: 14, sub: 11.5 },
  islands: [[136, -25], [376, 25], [616, -25], [856, 25], [1096, -25]]
 },
 compact: {
  w: 600, h: 870, S: 20, cy: 110, flow: false,
  card: { place: 'right', w: 290, h: 68, dx: 138, title: 16, sub: 13, era: true },
  islands: [[150, 0], [150, 170], [150, 340], [150, 510], [150, 680]]
 }
};

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};
const f = n => n.toFixed(1);

function build(layout) {
 const { w, h, S, cy, card } = layout;
 const k = S / 22;
 const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#0e1c33' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .5, cy: .42, r: .6 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .38 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const next = el('radialGradient', { id: 'hg-next', cx: .5, cy: .5, r: .5 }, defs);
 el('stop', { offset: 0, 'stop-color': '#16a36a', 'stop-opacity': .35 }, next); el('stop', { offset: 1, 'stop-color': '#16a36a', 'stop-opacity': 0 }, next);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .1 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)', 'url(#hg-glow)']) el('rect', { width: w, height: h, fill }, svg);

 const slab = ['#2b4fb5', '#1f3fa0', '#16307f'];
 const blue = ['#b8ccff', '#3b6bef', '#2447b8'];
 const islands = layout.islands.map(([ox, dy], index) => {
  const oy = cy + dy;
  const P = (x, y, z = 0) => [ox + (x - y) * C * S, oy + (x + y) * .5 * S - z * S];
  const pts = list => list.map(p => P(...p).map(f).join(',')).join(' ');
  const poly = (list, fill, parent, extra = {}) => el('polygon', { points: pts(list), fill, 'stroke-linejoin': 'round', ...extra }, parent);
  const box = (parent, x, y, z, bw, bd, bh, top, left, right, extra = {}) => {
   const g = el('g', {}, parent);
   poly([[x, y + bd, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x, y + bd, z]], left, g, extra);
   poly([[x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x + bw, y, z]], right, g, extra);
   poly([[x, y, z + bh], [x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x, y + bd, z + bh]], top, g, extra);
   return g;
  };
  // A ground circle of radius r projects to an ellipse with these screen radii.
  const cyl = (parent, x, y, z, r, ch, top, side, bands = 0) => {
   const g = el('g', {}, parent);
   const [cx, by] = P(x, y, z), ty = P(x, y, z + ch)[1];
   const rx = r * R2 * C * S, ry = r * R2 * .5 * S;
   el('path', { d: `M${f(cx - rx)} ${f(ty)}V${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(by)}V${f(ty)}Z`, fill: side }, g);
   for (let b = 1; b <= bands; b++) {
    const yy = by - (ch * S) * b / (bands + 1);
    el('path', { d: `M${f(cx - rx)} ${f(yy)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(yy)}`, fill: 'none', stroke: top, 'stroke-width': 1.4 * k, opacity: .7 }, g);
   }
   el('ellipse', { cx: f(cx), cy: f(ty), rx: f(rx), ry: f(ry), fill: top }, g);
   return g;
  };
  const seg = (parent, a, b, attrs) => { const [u, v] = [P(...a), P(...b)]; return el('line', { x1: f(u[0]), y1: f(u[1]), x2: f(v[0]), y2: f(v[1]), 'stroke-linecap': 'round', ...attrs }, parent); };

  const g = el('g', {}, svg);
  const plate = el('g', {}, g);
  const isNext = ERA[index] === 2;
  if (isNext) { const [gx, gy] = P(0, 0); el('ellipse', { cx: gx, cy: gy, rx: 130 * k, ry: 80 * k, fill: 'url(#hg-next)' }, plate); }
  poly([[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]], '#16294d', plate, isNext ? { stroke: '#5fe0a8', 'stroke-width': 1.4, 'stroke-dasharray': '5 5' } : { stroke: '#2c4a86' });
  for (let i = -1; i <= 1; i++) for (const [a, b] of [[[i * 1.4, -2.2], [i * 1.4, 2.2]], [[-2.2, i * 1.4], [2.2, i * 1.4]]]) {
   seg(plate, a, b, { stroke: isNext ? '#2f6b5a' : '#2c4a86', 'stroke-width': .6, opacity: .6 });
  }
  const rise = [], drop = [], pop = [], idle = [];
  let hot;
  if (index === 0) {
   // Data platforms: a lake and warehouses fed by pipelines
   rise.push(box(g, -2, -2, 0, 4, 4, .22, ...slab));
   rise.push(box(g, -1.8, .2, .22, 1.9, 1.6, .1, '#7dd3fc', '#38bdf8', '#0ea5e9'));
   drop.push(cyl(g, -.95, -1.05, .22, .5, 1, '#bae6fd', '#0284c7', 1));
   drop.push(cyl(g, .95, -.75, .22, .7, 1.6, '#e0f2fe', '#0369a1', 2));
   drop.push(box(g, .55, .75, .22, 1, 1, .55, ...blue));
   [[[-.9, .9, .34], [-.95, -1.05, .34]], [[-.95, -1.05, .5], [.95, -.75, .5]], [[.95, -.75, .4], [1.05, 1.25, .4]]].forEach(([a, b]) => {
    pop.push(seg(g, a, b, { stroke: '#e0f2fe', 'stroke-width': 1.8 * k, 'stroke-dasharray': '1 5', opacity: .9 }));
   });
   hot = P(.95, -.75, 1.82);
  } else if (index === 1) {
   // Software engineering: an editor panel with code, and the modules it ships
   rise.push(box(g, -2, -2, 0, 4, 4, .22, ...slab));
   const panel = box(g, -1.8, -1.5, .22, 2.6, .2, 2, '#c9d6f2', '#101d38', '#7c8fb8');
   rise.push(panel);
   const face = -1.5 + .2 + .01;
   [[.4, 1.1, '#a78bfa'], [.7, 1.6, '#e2e8f0'], [1, .9, '#38bdf8'], [1.3, 1.9, '#e2e8f0'], [1.6, 1.3, '#f59e0b'], [1.9, .7, '#e2e8f0']].forEach(([z, len, color], q) => {
    const x0 = -1.55 + (q % 3 === 1 ? .25 : 0);
    pop.push(seg(g, [x0, face, z + .22], [x0 + len * .62, face, z + .22], { stroke: color, 'stroke-width': 2.4 * k, opacity: .9 }));
   });
   [[.4, .5, 0, .5], [.55, .65, .5, .45], [.7, .8, .95, .4]].forEach(([x, y, z, th]) => drop.push(box(g, x + .2, y, .22 + z, 1, 1, th, '#ddd6fe', '#8b5cf6', '#6d28d9')));
   hot = P(-.5, -1.5, 2.22);
  } else if (index === 2) {
   // Generative AI and RAG: documents retrieved into a model, then evaluated
   rise.push(box(g, -2, -2, 0, 4, 4, .22, ...slab));
   for (let q = 0; q < 4; q++) drop.push(box(g, -1.7, .3, .22 + q * .2, 1.3, 1.4, .12, '#fff7e6', '#fbbf24', '#d97706'));
   const core = box(g, -.1, -1.6, .22, 1.6, 1.6, 1.6, '#ede9fe', '#a78bfa', '#7c3aed');
   rise.push(core);
   [[-1, 1, 1.02], [-1, 1, .7]].forEach(([x, y, z], q) => {
    const [u, v] = [P(x, y, z), P(.7, -.8, 1.82)];
    const mx = (u[0] + v[0]) / 2, my = Math.min(u[1], v[1]) - (40 + q * 18) * k;
    pop.push(el('path', { d: `M${f(u[0])} ${f(u[1])}Q${f(mx)} ${f(my)} ${f(v[0])} ${f(v[1])}`, fill: 'none', stroke: '#fde68a', 'stroke-width': 1.6 * k, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }, g));
   });
   [[.9, .6], [1.5, .6], [.9, 1.2], [1.5, 1.2]].forEach(([x, y]) => pop.push(box(g, x, y, .22, .4, .4, .4, '#fef3c7', '#f59e0b', '#b45309')));
   const [sx, sy] = P(.7, -.8, 2.7);
   const r = 9 * k, t = 2.4 * k;
   const spark = el('path', { d: `M${f(sx)} ${f(sy - r)}L${f(sx + t)} ${f(sy - t)}L${f(sx + r)} ${f(sy)}L${f(sx + t)} ${f(sy + t)}L${f(sx)} ${f(sy + r)}L${f(sx - t)} ${f(sy + t)}L${f(sx - r)} ${f(sy)}L${f(sx - t)} ${f(sy - t)}Z`, fill: '#fff' }, g);
   pop.push(spark); idle.push({ node: spark, bob: true });
   hot = P(.7, -.8, 1.82);
  } else if (index === 3) {
   // Forward deployed engineering: on the customer's site, deploying alongside their systems
   rise.push(box(g, -2, -2, 0, 4, 4, .22, ...slab));
   rise.push(box(g, -1.8, -1.8, .22, 1.6, 1.6, 2.4, '#dbe6ff', '#8fa6d6', '#5f78ad'));
   const windows = el('g', {}, g);
   for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const z = .55 + row * .5, a = -1.65 + col * .5;
    poly([[a, -.19, z + .25], [a + .3, -.19, z + .25], [a + .3, -.19, z], [a, -.19, z]], '#fef9c3', windows, { opacity: .85 });
    poly([[-.19, a, z + .25], [-.19, a + .3, z + .25], [-.19, a + .3, z], [-.19, a, z]], '#dbeafe', windows, { opacity: .6 });
   }
   rise.push(windows);
   const mod = box(g, .4, .3, .22, 1.3, 1.3, .9, ...blue);
   drop.push(mod);
   pop.push(seg(g, [-.2, .2, .5], [.4, .9, .5], { stroke: '#fff', 'stroke-width': 1.8 * k, 'stroke-dasharray': '1 5' }));
   const [px, py] = P(-1, -1, 3.1);
   const pr = 10 * k;
   const pin = el('g', {}, g);
   el('path', { d: `M${f(px)} ${f(py + pr * 2.2)}C${f(px - pr * .5)} ${f(py + pr * 1.3)} ${f(px - pr)} ${f(py + pr * .8)} ${f(px - pr)} ${f(py)}A${f(pr)} ${f(pr)} 0 0 1 ${f(px + pr)} ${f(py)}C${f(px + pr)} ${f(py + pr * .8)} ${f(px + pr * .5)} ${f(py + pr * 1.3)} ${f(px)} ${f(py + pr * 2.2)}Z`, fill: '#60a5fa', stroke: '#fff', 'stroke-width': 1.6 }, pin);
   el('circle', { cx: f(px), cy: f(py), r: f(pr * .38), fill: '#fff' }, pin);
   pop.push(pin); idle.push({ node: pin, bob: true });
   hot = P(1.05, .95, 1.12);
  } else {
   // AI in manufacturing (next): a factory line with a vision check and a robot arm
   rise.push(box(g, -2, -2, 0, 4, 4, .22, '#1d6b52', '#165c45', '#0f4733'));
   const fac = el('g', {}, g);
   box(fac, -1.9, -1.9, .22, 2.4, 1.5, .9, '#c7f0dd', '#5fbf95', '#2f8f67');
   const z0 = 1.12, y0 = -1.9, y1 = -.4;
   for (let q = 0; q < 3; q++) {
    const a = -1.9 + q * .8, b = a + .8;
    poly([[a, y1, z0], [b, y1, z0], [b, y1, z0 + .45]], '#5fbf95', fac);
    poly([[a, y0, z0], [a, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#e6fbf1', fac);
    poly([[b, y0, z0], [b, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#8ee6c0', fac, { opacity: .9 });
   }
   box(fac, -1.7, -1.75, z0, .3, .3, 1.1, '#c7f0dd', '#5fbf95', '#2f8f67');
   rise.push(fac);
   rise.push(box(g, -1.9, .5, .22, 3.8, .7, .22, '#334a6e', '#22324f', '#1a273f'));
   for (let q = 0; q < 3; q++) {
    const item = box(g, -1.7 + q * 1.2, .65, .44, .4, .4, .35, '#fff', '#c9d6f2', '#a9bce6');
    idle.push({ node: item, dx: 1.2 * C * S, dy: 1.2 * .5 * S });
   }
   const [bx, by] = P(.2, .85, 1.5);
   const [lx, ly] = P(-.2, .65, .44), [rx, ry] = P(.6, 1.05, .44);
   const beam = el('path', { d: `M${f(bx)} ${f(by)}L${f(lx)} ${f(ly)}L${f(rx)} ${f(ry)}Z`, fill: '#5fe0a8', opacity: .35 }, g);
   idle.push({ node: beam, blink: true });
   pop.push(box(g, .05, .75, 1.45, .3, .3, .2, '#fff', '#5fe0a8', '#16a36a'));
   const arm = el('g', {}, g);
   cyl(arm, 1.3, -1, .22, .35, .3, '#c7f0dd', '#2f8f67');
   const joints = [P(1.3, -1, .52), P(1.3, -1, 1.5), P(1.6, .2, 1.85), P(1.75, .65, 1.2)];
   joints.slice(1).forEach((p, q) => el('line', { x1: f(joints[q][0]), y1: f(joints[q][1]), x2: f(p[0]), y2: f(p[1]), stroke: '#e6fbf1', 'stroke-width': 5 * k, 'stroke-linecap': 'round' }, arm));
   joints.forEach(p => el('circle', { cx: f(p[0]), cy: f(p[1]), r: f(3.6 * k), fill: '#16a36a', stroke: '#fff', 'stroke-width': 1.2 }, arm));
   drop.push(arm);
   hot = P(1.6, .2, 1.85);
  }

  let cardX, cardY, ax, ay;
  if (card.place === 'below') { cardX = ox - card.w / 2; cardY = card.y; ax = ox; ay = cardY; }
  else { cardX = ox + card.dx; cardY = oy - card.h / 2 + 10; ax = cardX; ay = cardY + card.h / 2; }
  const group = el('g', { class: 'callout' }, svg);
  const line = el('line', { x1: f(ax), y1: f(ay), x2: f(hot[0]), y2: f(hot[1]), stroke: COLORS[index], 'stroke-width': 1.8, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, group);
  const cardNode = el('g', {}, group);
  el('rect', { x: cardX, y: cardY, width: card.w, height: card.h, rx: 10, fill: '#fff' }, cardNode);
  el('circle', { cx: cardX + 22, cy: cardY + card.h / 2, r: 11, fill: COLORS[index] }, cardNode);
  const num = el('text', { x: cardX + 22, y: cardY + card.h / 2 + 4.5, fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, cardNode);
  num.textContent = String(index + 1);
  const lines = card.era ? [.3, .58, .84] : [null, .44, .76];
  const era = card.era ? el('text', { x: cardX + 42, y: cardY + card.h * lines[0], fill: ['#3b6bef', '#1d4ed8', '#0e7a4d'][ERA[index]], 'font-size': 11, 'font-weight': 700, 'letter-spacing': '.06em' }, cardNode) : null;
  const title = el('text', { x: cardX + 42, y: cardY + card.h * lines[1], fill: '#10213a', 'font-size': card.title, 'font-weight': 700 }, cardNode);
  const sub = el('text', { x: cardX + 42, y: cardY + card.h * lines[2], fill: '#51607a', 'font-size': card.sub }, cardNode);
  const dot = el('circle', { cx: f(hot[0]), cy: f(hot[1]), r: 5.5, fill: COLORS[index], stroke: '#fff', 'stroke-width': 2 }, group);
  return { g, plate, rise, drop, pop, idle, group, line, cardNode, dot, title, sub, era };
 });

 // data flow between neighbouring islands, from one plate's right corner to the next one's left
 const flows = [], packets = [];
 if (layout.flow) {
  const half = 2.2 * 2 * C * S + 6;
  for (let i = 0; i < layout.islands.length - 1; i++) {
   const [ax, ay] = layout.islands[i], [bx, by] = layout.islands[i + 1];
   const x1 = ax + half, y1 = cy + ay, x2 = bx - half, y2 = cy + by;
   flows.push(el('line', { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), stroke: i === 3 ? '#5fe0a8' : '#8fb0ff', 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: .9 }, svg));
   packets.push({ node: el('circle', { cx: f(x1), cy: f(y1), r: 4.5, fill: '#fff', opacity: 0 }, svg), dx: x2 - x1, dy: y2 - y1 });
  }
 }

 // timeline ribbon: done, now and next under the cards
 let ribbon = null;
 if (layout.ribbon) {
  const { y, label } = layout.ribbon;
  const xs = layout.islands.map(([x]) => x);
  const cuts = [40, (xs[1] + xs[2]) / 2, (xs[3] + xs[4]) / 2, w - 40];
  ribbon = { node: el('g', {}, svg), labels: [] };
  [0, 1, 2].forEach(e => {
   const attrs = { x1: cuts[e] + (e ? 8 : 0), y1: y, x2: cuts[e + 1] - (e < 2 ? 8 : 14), y2: y, stroke: ERA_COLORS[e], 'stroke-width': 3, 'stroke-linecap': 'round', opacity: e === 1 ? .95 : .75 };
   if (e === 2) Object.assign(attrs, { 'stroke-dasharray': '6 6' });
   el('line', attrs, ribbon.node);
   const text = el('text', { x: (cuts[e] + cuts[e + 1]) / 2, y: label, fill: ERA_COLORS[e], 'font-size': 13, 'font-weight': 700, 'letter-spacing': '.08em', 'text-anchor': 'middle', opacity: e === 1 ? 1 : .85 }, ribbon.node);
   ribbon.labels.push(text);
  });
  el('path', { d: `M${w - 46} ${y - 6}L${w - 36} ${y}L${w - 46} ${y + 6}`, fill: 'none', stroke: ERA_COLORS[2], 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ribbon.node);
  xs.forEach((x, i) => {
   el('line', { x1: x, y1: card.y + card.h + 4, x2: x, y2: y - 8, stroke: COLORS[i], 'stroke-width': 1.4, 'stroke-dasharray': '2 4', opacity: .7 }, ribbon.node);
   el('circle', { cx: x, cy: y, r: 6, fill: COLORS[i], stroke: '#0e1c33', 'stroke-width': 2.5 }, ribbon.node);
  });
 }
 return { svg, islands, flows, packets, ribbon };
}

function animate(scene) {
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 const rise = (n, delay) => n.animate([{ transform: 'translateY(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };
 const step = 720;

 scene.islands.forEach((isl, i) => {
  const t0 = 150 + i * step;
  isl.plate.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: t0, fill: 'backwards' });
  isl.rise.forEach((n, q) => rise(n, t0 + 300 + q * 120));
  isl.drop.forEach((n, q) => drop(n, t0 + 350 + q * 150));
  isl.pop.forEach((n, q) => grow(n, t0 + 700 + q * 90));
  const reveal = t0 + 800;
  grow(isl.dot, reveal);
  isl.line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: reveal + 150, fill: 'backwards' });
  isl.cardNode.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: reveal + 250, easing: ease, fill: 'backwards' });
  isl.idle.forEach((item, q) => {
   if (item.bob) item.node.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 3200, delay: 4200 + q * 350, iterations: Infinity, easing: 'ease-in-out' });
   else if (item.blink) item.node.animate([{ opacity: .1 }, { opacity: .45 }, { opacity: .1 }], { duration: 1400, delay: t0 + 1200, iterations: Infinity, easing: 'ease-in-out' });
   else item.node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .9 }, { transform: `translate(${item.dx}px,${item.dy}px)`, opacity: 0 }], { duration: 2600, delay: t0 + 1400, iterations: Infinity, easing: 'linear' });
  });
 });
 scene.packets.forEach(({ node, dx, dy }, i) => {
  const n = scene.packets.length, a = i / n, z = (i + 1) / n;
  const end = `translate(${dx}px,${dy}px)`;
  const frames = [{ offset: 0, opacity: 0, transform: 'translate(0,0)' }];
  if (a > 0) frames.push({ offset: a, opacity: 0, transform: 'translate(0,0)' });
  frames.push({ offset: a + .01, opacity: 1, transform: 'translate(0,0)' }, { offset: z - .01, opacity: 1, transform: end }, { offset: z, opacity: 0, transform: end });
  if (z < 1) frames.push({ offset: 1, opacity: 0, transform: end });
  node.animate(frames, { duration: 1200 * n, delay: 4400, iterations: Infinity, easing: 'linear' });
 });
 scene.flows.forEach((fl, i) => {
  fl.animate([{ opacity: 0 }, { opacity: .9 }], { duration: 500, delay: 700 + i * step, fill: 'backwards' });
  fl.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -9 }], { duration: 700, iterations: Infinity, delay: 1200 + i * step });
 });
 if (scene.ribbon) scene.ribbon.node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 3900, fill: 'backwards' });
}

if (figure && frame) {
 try {
  const compact = matchMedia('(max-width: 900px)').matches;
  const scene = build(compact ? LAYOUTS.compact : LAYOUTS.wide);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || compact;
  frame.replaceChildren(scene.svg);
  if (!still && typeof scene.svg.animate === 'function') animate(scene);
  // Shrink a line that would overflow its card (long translations) instead of letting it spill.
  const fit = (node, size) => {
   node.setAttribute('font-size', size);
   const room = layout.card.w - 52;
   for (let s = size; s > 9 && node.getComputedTextLength() > room; s -= .5) node.setAttribute('font-size', s - .5);
  };
  const layout = compact ? LAYOUTS.compact : LAYOUTS.wide;
  const setText = copy => {
   scene.svg.setAttribute('aria-label', copy.heroAlt);
   scene.islands.forEach((isl, i) => {
    isl.title.textContent = copy.heroCallouts[i][0]; isl.sub.textContent = copy.heroCallouts[i][1];
    fit(isl.title, layout.card.title); fit(isl.sub, layout.card.sub);
    if (isl.era) isl.era.textContent = copy.heroEras[ERA[i]].toUpperCase();
   });
   scene.ribbon?.labels.forEach((t, e) => { t.textContent = copy.heroEras[e].toUpperCase(); });
  };
  const lang = document.documentElement.lang === 'zh-CN' ? 'zh' : document.documentElement.lang;
  setText(locales[lang] || locales.en);
  document.addEventListener('homelocale', e => setText(e.detail.copy));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
