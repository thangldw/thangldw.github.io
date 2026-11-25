// Hero for the home page: one isometric "city" that gives the whole picture of the work. Five
// districts sit on a shared ground joined by data roads: data platforms at the back feed software
// engineering, the generative AI core and the customer's site, and everything flows on to AI in
// manufacturing at the front. Numbered markers match localized cards on either side. The city
// builds in sequence, then packets keep moving along the roads. Static when motion is reduced and
// on the compact (stacked) layout.
import { locales } from './home-locales.mjs?v=20261125-city';

const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6);
const R2 = Math.SQRT2;
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');
const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#60a5fa', '#16a36a'];
// done (0), now (1) or next (2), shown as a small status line on each card
const ERA = [0, 0, 1, 1, 2];
const ERA_INK = ['#3b6bef', '#1d4ed8', '#0e7a4d'];
// district centres on the ground grid, in drawing (back-to-front) order of their index
const DISTRICTS = [[-4, -4], [-4, 4], [0, 0], [4, -4], [4, 4]];
const LAYOUTS = {
 wide: {
  w: 1232, h: 480, S: 28, ox: 616, oy: 238,
  card: { w: 240, h: 70, title: 15, sub: 12 },
  cards: [[32, 62], [32, 205], [32, 348], [960, 128], [960, 282]]
 },
 compact: {
  w: 600, h: 880, S: 24, ox: 300, oy: 210,
  card: { w: 540, h: 70, title: 17, sub: 14 },
  cards: [[30, 452], [30, 536], [30, 620], [30, 704], [30, 788]]
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
 const { w, h, S, ox, oy, card } = layout;
 const k = S / 22;
 const P = (x, y, z = 0) => [ox + (x - y) * C * S, oy + (x + y) * .5 * S - z * S];
 const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const bg = el('linearGradient', { id: 'hg-bg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
 el('stop', { offset: 0, 'stop-color': '#0e1c33' }, bg); el('stop', { offset: 1, 'stop-color': '#1c3a78' }, bg);
 const glow = el('radialGradient', { id: 'hg-glow', cx: .5, cy: .5, r: .55 }, defs);
 el('stop', { offset: 0, 'stop-color': '#3b6bef', 'stop-opacity': .42 }, glow); el('stop', { offset: 1, 'stop-color': '#3b6bef', 'stop-opacity': 0 }, glow);
 const next = el('radialGradient', { id: 'hg-next', cx: .5, cy: .5, r: .5 }, defs);
 el('stop', { offset: 0, 'stop-color': '#16a36a', 'stop-opacity': .4 }, next); el('stop', { offset: 1, 'stop-color': '#16a36a', 'stop-opacity': 0 }, next);
 const dots = el('pattern', { id: 'hg-dots', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.2, fill: '#fff', opacity: .1 }, dots);
 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)']) el('rect', { width: w, height: h, fill }, svg);
 const [gx, gy] = P(0, 0);
 el('ellipse', { cx: gx, cy: gy, rx: 13 * C * S, ry: 8 * S, fill: 'url(#hg-glow)' }, svg);

 // Drawing helpers anchored at a grid offset, so each district is drawn in its own local units.
 const at = (cx = 0, cy = 0) => {
  const L = (x, y, z = 0) => P(cx + x, cy + y, z);
  const pts = list => list.map(p => L(...p).map(f).join(',')).join(' ');
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
   const [cx2, by] = L(x, y, z), ty = L(x, y, z + ch)[1];
   const rx = r * R2 * C * S, ry = r * R2 * .5 * S;
   el('path', { d: `M${f(cx2 - rx)} ${f(ty)}V${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx2 + rx)} ${f(by)}V${f(ty)}Z`, fill: side }, g);
   for (let b = 1; b <= bands; b++) {
    const yy = by - (ch * S) * b / (bands + 1);
    el('path', { d: `M${f(cx2 - rx)} ${f(yy)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx2 + rx)} ${f(yy)}`, fill: 'none', stroke: top, 'stroke-width': 1.4 * k, opacity: .7 }, g);
   }
   el('ellipse', { cx: f(cx2), cy: f(ty), rx: f(rx), ry: f(ry), fill: top }, g);
   return g;
  };
  const seg = (parent, a, b, attrs) => { const [u, v] = [L(...a), L(...b)]; return el('line', { x1: f(u[0]), y1: f(u[1]), x2: f(v[0]), y2: f(v[1]), 'stroke-linecap': 'round', ...attrs }, parent); };
  return { L, poly, box, cyl, seg };
 };

 const ground = el('g', {}, svg);
 const G = at();
 G.box(ground, -6, -6, -.45, 12, 12, .45, '#16294d', '#0f1d3a', '#0b1730');
 G.poly([[-6, -6], [6, -6], [6, 6], [-6, 6]], 'none', ground, { stroke: '#2c4a86', 'stroke-width': 1.2 });
 for (let i = -4; i <= 4; i += 2) {
  G.seg(ground, [i, -6, .001], [i, 6, .001], { stroke: '#2c4a86', 'stroke-width': .6, opacity: .5 });
  G.seg(ground, [-6, i, .001], [6, i, .001], { stroke: '#2c4a86', 'stroke-width': .6, opacity: .5 });
 }

 // Roads: a ring through the four edge cells plus spokes into the core. Each runs in the
 // direction the data flows: from the data platform at the back to the factory at the front.
 const ROADS = [
  [[-4, -2], [-4, 2]], [[-2, -4], [2, -4]], [[-2, 4], [2, 4]], [[4, -2], [4, 2]],
  [[-4, 0], [-2, 0]], [[0, -4], [0, -2]], [[2, 0], [4, 0]], [[0, 2], [0, 4]]
 ];
 const roads = el('g', {}, svg);
 const packets = [];
 ROADS.forEach(([a, b], i) => {
  const vert = a[0] === b[0], hw = .32;
  const quad = vert ? [[a[0] - hw, a[1]], [a[0] + hw, a[1]], [b[0] + hw, b[1]], [b[0] - hw, b[1]]]
   : [[a[0], a[1] - hw], [b[0], b[1] - hw], [b[0], b[1] + hw], [a[0], a[1] + hw]];
  G.poly(quad.map(([x, y]) => [x, y, .005]), '#0d1a33', roads);
  G.seg(roads, [...a, .01], [...b, .01], { stroke: i >= 6 ? '#5fe0a8' : '#8fb0ff', 'stroke-width': 1.6 * k, 'stroke-dasharray': '2 6', opacity: .85 });
  const [u, v] = [P(...a, .1), P(...b, .1)];
  packets.push({ node: el('circle', { cx: f(u[0]), cy: f(u[1]), r: 3.6 * k, fill: '#fff', opacity: 0 }, svg), dx: v[0] - u[0], dy: v[1] - u[1], i });
 });

 // Small details in the edge cells: server racks, a cloud, trees.
 const decor = [];
 const decorate = (cx, cy, parent) => {
  const D = at(cx, cy);
  const g = el('g', {}, parent);
  if (cx === -4 && cy === 0) {
   [[-1.5, -1.6], [-1.5, 1], [.7, 1.1]].forEach(([x, y]) => D.box(g, x, y, 0, .7, .6, .9, '#b8ccff', '#3b6bef', '#2447b8'));
  } else if (cx === 0 && cy === -4) {
   [[-1.4, .9], [1, 1.2], [1.1, -1.5]].forEach(([x, y]) => D.box(g, x, y, 0, .5, .5, .5, '#b8ccff', '#3b6bef', '#2447b8'));
   const [cl, ct] = D.L(-.9, -1.2, 2.3);
   const cloud = el('g', {}, g);
   [[0, 0, 13], [14, -6, 15], [28, 0, 12], [14, 4, 12]].forEach(([dx, dy, r]) => el('circle', { cx: f(cl + dx * k), cy: f(ct + dy * k), r: f(r * k), fill: '#e0ecff', opacity: .92 }, cloud));
   decor.push({ node: cloud, bob: true });
  } else {
   const trees = cx === 4 ? [[-1.5, -1.4], [-1, 1.3], [1.3, -1.3], [1.4, 1.2]] : [[-1.4, -1.3], [1.3, -1.4], [-1.3, 1.3], [1.2, 1.3]];
   trees.forEach(([x, y]) => {
    const [tx, ty] = D.L(x, y, .45);
    D.seg(g, [x, y, 0], [x, y, .3], { stroke: '#5b4a3a', 'stroke-width': 2.4 * k });
    el('circle', { cx: f(tx), cy: f(ty), r: f(7.5 * k), fill: '#2fbf87' }, g);
    el('circle', { cx: f(tx - 2.2 * k), cy: f(ty - 2.4 * k), r: f(3.2 * k), fill: '#7ee7bd', opacity: .8 }, g);
   });
  }
  return g;
 };

 const slab = ['#2b4fb5', '#1f3fa0', '#16307f'];
 const blue = ['#b8ccff', '#3b6bef', '#2447b8'];
 const drawDistrict = index => {
  const [dcx, dcy] = DISTRICTS[index];
  const { L, poly, box, cyl, seg } = at(dcx, dcy);
  const g = el('g', {}, svg);
  const rise = [], drop = [], pop = [], idle = [];
  let hot;
  if (index === 0) {
   // Data platforms: a lake and warehouses fed by pipelines
   rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .22, ...slab));
   rise.push(box(g, -1.7, .2, .22, 1.8, 1.5, .1, '#7dd3fc', '#38bdf8', '#0ea5e9'));
   drop.push(cyl(g, -.95, -1.05, .22, .5, 1, '#bae6fd', '#0284c7', 1));
   drop.push(cyl(g, .95, -.75, .22, .7, 1.6, '#e0f2fe', '#0369a1', 2));
   drop.push(box(g, .55, .7, .22, 1, 1, .55, ...blue));
   [[[-.9, .9, .34], [-.95, -1.05, .34]], [[-.95, -1.05, .5], [.95, -.75, .5]], [[.95, -.75, .4], [1.05, 1.2, .4]]].forEach(([a, b]) => {
    pop.push(seg(g, a, b, { stroke: '#e0f2fe', 'stroke-width': 1.8 * k, 'stroke-dasharray': '1 5', opacity: .9 }));
   });
   hot = L(.95, -.75, 2.3);
  } else if (index === 1) {
   // Software engineering: an editor panel with code, and the modules it ships
   rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .22, ...slab));
   rise.push(box(g, -1.8, -1.5, .22, 2.6, .2, 2, '#c9d6f2', '#101d38', '#7c8fb8'));
   const face = -1.5 + .2 + .01;
   [[.4, 1.1, '#a78bfa'], [.7, 1.6, '#e2e8f0'], [1, .9, '#38bdf8'], [1.3, 1.9, '#e2e8f0'], [1.6, 1.3, '#f59e0b'], [1.9, .7, '#e2e8f0']].forEach(([z, len, color], q) => {
    const x0 = -1.55 + (q % 3 === 1 ? .25 : 0);
    pop.push(seg(g, [x0, face, z + .22], [x0 + len * .62, face, z + .22], { stroke: color, 'stroke-width': 2.4 * k, opacity: .9 }));
   });
   [[.4, .5, 0, .5], [.55, .65, .5, .45], [.7, .8, .95, .4]].forEach(([x, y, z, th]) => drop.push(box(g, x + .2, y, .22 + z, 1, 1, th, '#ddd6fe', '#8b5cf6', '#6d28d9')));
   hot = L(-.5, -1.5, 2.7);
  } else if (index === 2) {
   // Generative AI and RAG: the core, with documents retrieved into it and checked
   rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .22, ...slab));
   for (let q = 0; q < 4; q++) drop.push(box(g, -1.7, .3, .22 + q * .2, 1.3, 1.4, .12, '#fff7e6', '#fbbf24', '#d97706'));
   rise.push(box(g, -.1, -1.6, .22, 1.6, 1.6, 1.6, '#ede9fe', '#a78bfa', '#7c3aed'));
   [[-1, 1, 1.02], [-1, 1, .7]].forEach(([x, y, z], q) => {
    const [u, v] = [L(x, y, z), L(.7, -.8, 1.82)];
    const mx = (u[0] + v[0]) / 2, my = Math.min(u[1], v[1]) - (40 + q * 18) * k;
    pop.push(el('path', { d: `M${f(u[0])} ${f(u[1])}Q${f(mx)} ${f(my)} ${f(v[0])} ${f(v[1])}`, fill: 'none', stroke: '#fde68a', 'stroke-width': 1.6 * k, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }, g));
   });
   [[.9, .6], [1.5, .6], [.9, 1.2], [1.5, 1.2]].forEach(([x, y]) => pop.push(box(g, x, y, .22, .4, .4, .4, '#fef3c7', '#f59e0b', '#b45309')));
   const [sx, sy] = L(1.4, -1.5, 2.6);
   const r = 9 * k, t = 2.4 * k;
   const spark = el('path', { d: `M${f(sx)} ${f(sy - r)}L${f(sx + t)} ${f(sy - t)}L${f(sx + r)} ${f(sy)}L${f(sx + t)} ${f(sy + t)}L${f(sx)} ${f(sy + r)}L${f(sx - t)} ${f(sy + t)}L${f(sx - r)} ${f(sy)}L${f(sx - t)} ${f(sy - t)}Z`, fill: '#fff' }, g);
   pop.push(spark); idle.push({ node: spark, bob: true });
   hot = L(.7, -.8, 2.5);
  } else if (index === 3) {
   // Forward deployed engineering: on the customer's site, deploying alongside their systems
   rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .22, ...slab));
   rise.push(box(g, -1.8, -1.8, .22, 1.6, 1.6, 2.4, '#dbe6ff', '#8fa6d6', '#5f78ad'));
   const windows = el('g', {}, g);
   for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const z = .55 + row * .5, a = -1.65 + col * .5;
    poly([[a, -.19, z + .25], [a + .3, -.19, z + .25], [a + .3, -.19, z], [a, -.19, z]], '#fef9c3', windows, { opacity: .85 });
    poly([[-.19, a, z + .25], [-.19, a + .3, z + .25], [-.19, a + .3, z], [-.19, a, z]], '#dbeafe', windows, { opacity: .6 });
   }
   rise.push(windows);
   drop.push(box(g, .4, .3, .22, 1.3, 1.3, .9, ...blue));
   pop.push(seg(g, [-.2, .2, .5], [.4, .9, .5], { stroke: '#fff', 'stroke-width': 1.8 * k, 'stroke-dasharray': '1 5' }));
   const [px, py] = L(-1, -1, 3.1);
   const pr = 10 * k;
   const pin = el('g', {}, g);
   el('path', { d: `M${f(px)} ${f(py + pr * 2.2)}C${f(px - pr * .5)} ${f(py + pr * 1.3)} ${f(px - pr)} ${f(py + pr * .8)} ${f(px - pr)} ${f(py)}A${f(pr)} ${f(pr)} 0 0 1 ${f(px + pr)} ${f(py)}C${f(px + pr)} ${f(py + pr * .8)} ${f(px + pr * .5)} ${f(py + pr * 1.3)} ${f(px)} ${f(py + pr * 2.2)}Z`, fill: '#60a5fa', stroke: '#fff', 'stroke-width': 1.6 }, pin);
   el('circle', { cx: f(px), cy: f(py), r: f(pr * .38), fill: '#fff' }, pin);
   pop.push(pin); idle.push({ node: pin, bob: true });
   hot = L(1.05, .95, 1.75);
  } else {
   // AI in manufacturing (next): a factory line with a vision check and a robot arm
   const [hx, hy] = L(0, 0);
   el('ellipse', { cx: hx, cy: hy, rx: 120 * k, ry: 72 * k, fill: 'url(#hg-next)' }, g);
   rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .22, '#1d6b52', '#165c45', '#0f4733', { stroke: '#5fe0a8', 'stroke-width': .8, 'stroke-dasharray': '4 4' }));
   const fac = el('g', {}, g);
   box(fac, -1.8, -1.8, .22, 2.4, 1.4, .9, '#c7f0dd', '#5fbf95', '#2f8f67');
   const z0 = 1.12, y0 = -1.8, y1 = -.4;
   for (let q = 0; q < 3; q++) {
    const a = -1.8 + q * .8, b = a + .8;
    poly([[a, y1, z0], [b, y1, z0], [b, y1, z0 + .45]], '#5fbf95', fac);
    poly([[a, y0, z0], [a, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#e6fbf1', fac);
    poly([[b, y0, z0], [b, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#8ee6c0', fac, { opacity: .9 });
   }
   box(fac, -1.6, -1.65, z0, .3, .3, 1.1, '#c7f0dd', '#5fbf95', '#2f8f67');
   rise.push(fac);
   rise.push(box(g, -1.8, .4, .22, 3.6, .7, .22, '#334a6e', '#22324f', '#1a273f'));
   for (let q = 0; q < 3; q++) {
    const item = box(g, -1.6 + q * 1.1, .55, .44, .4, .4, .35, '#fff', '#c9d6f2', '#a9bce6');
    idle.push({ node: item, dx: 1.1 * C * S, dy: 1.1 * .5 * S });
   }
   const [bx, by] = L(.2, .75, 1.5);
   const [lx, ly] = L(-.2, .55, .44), [rx, ry] = L(.6, .95, .44);
   const beam = el('path', { d: `M${f(bx)} ${f(by)}L${f(lx)} ${f(ly)}L${f(rx)} ${f(ry)}Z`, fill: '#5fe0a8', opacity: .35 }, g);
   idle.push({ node: beam, blink: true });
   pop.push(box(g, .05, .65, 1.45, .3, .3, .2, '#fff', '#5fe0a8', '#16a36a'));
   const arm = el('g', {}, g);
   cyl(arm, 1.3, -1, .22, .35, .3, '#c7f0dd', '#2f8f67');
   const joints = [L(1.3, -1, .52), L(1.3, -1, 1.5), L(1.55, .1, 1.85), L(1.65, .6, 1.2)];
   joints.slice(1).forEach((p, q) => el('line', { x1: f(joints[q][0]), y1: f(joints[q][1]), x2: f(p[0]), y2: f(p[1]), stroke: '#e6fbf1', 'stroke-width': 5 * k, 'stroke-linecap': 'round' }, arm));
   joints.forEach(p => el('circle', { cx: f(p[0]), cy: f(p[1]), r: f(3.6 * k), fill: '#16a36a', stroke: '#fff', 'stroke-width': 1.2 }, arm));
   drop.push(arm);
   hot = L(1.55, .1, 2.6);
  }
  return { g, rise, drop, pop, idle, hot };
 };

 // back to front: data, the two back edge cells, the middle row, the two front edge cells, factory
 const districts = [];
 const decorNodes = [];
 districts[0] = drawDistrict(0);
 decorNodes.push(decorate(-4, 0, svg), decorate(0, -4, svg));
 districts[1] = drawDistrict(1); districts[2] = drawDistrict(2); districts[3] = drawDistrict(3);
 decorNodes.push(decorate(0, 4, svg), decorate(4, 0, svg));
 districts[4] = drawDistrict(4);

 // numbered markers on the map, and the matching cards
 const markers = el('g', {}, svg);
 districts.forEach((d, i) => {
  const [mx, my] = d.hot;
  d.marker = el('g', {}, markers);
  el('circle', { cx: f(mx), cy: f(my), r: 12, fill: COLORS[i], stroke: '#fff', 'stroke-width': 2.5 }, d.marker);
  el('text', { x: f(mx), y: f(my + 4.5), fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, d.marker).textContent = String(i + 1);
  const [cardX, cardY] = layout.cards[i];
  d.cardNode = el('g', {}, svg);
  el('rect', { x: cardX, y: cardY, width: card.w, height: card.h, rx: 12, fill: '#fff' }, d.cardNode);
  el('rect', { x: cardX, y: cardY + 14, width: 4, height: card.h - 28, rx: 2, fill: COLORS[i] }, d.cardNode);
  el('circle', { cx: cardX + 26, cy: cardY + card.h / 2, r: 12, fill: COLORS[i] }, d.cardNode);
  el('text', { x: cardX + 26, y: cardY + card.h / 2 + 4.5, fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, d.cardNode).textContent = String(i + 1);
  d.era = el('text', { x: cardX + 48, y: cardY + card.h * .3, fill: ERA_INK[ERA[i]], 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': '.07em' }, d.cardNode);
  d.title = el('text', { x: cardX + 48, y: cardY + card.h * .58, fill: '#10213a', 'font-size': card.title, 'font-weight': 700 }, d.cardNode);
  d.sub = el('text', { x: cardX + 48, y: cardY + card.h * .82, fill: '#51607a', 'font-size': card.sub }, d.cardNode);
 });
 return { svg, ground, roads, packets, decor, decorNodes, districts };
}

function animate(scene) {
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 const rise = (n, delay) => n.animate([{ transform: 'translateY(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };
 const fade = (n, delay, duration = 500) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, fill: 'backwards' });

 scene.ground.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 100, easing: ease, fill: 'backwards' });
 fade(scene.roads, 500);
 scene.decorNodes.forEach((n, i) => fade(n, 3400 + i * 120));
 const ORDER = [0, 1, 2, 3, 4];
 ORDER.forEach((i, step) => {
  const d = scene.districts[i], t0 = 700 + step * 560;
  d.rise.forEach((n, q) => rise(n, t0 + q * 110));
  d.drop.forEach((n, q) => drop(n, t0 + 100 + q * 140));
  d.pop.forEach((n, q) => grow(n, t0 + 450 + q * 70));
  grow(d.marker, t0 + 650);
  d.cardNode.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: t0 + 700, easing: ease, fill: 'backwards' });
  d.idle.forEach(item => loop(item, t0 + 1400));
 });
 scene.decor.forEach(item => loop(item, 4000));
 scene.packets.forEach(({ node, dx, dy, i }) => {
  const end = `translate(${f(dx)}px,${f(dy)}px)`;
  node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .88 }, { transform: end, opacity: 0 }], { duration: 1900, delay: 3900 + (i % 4) * 420 + (i >= 4 ? 900 : 0), iterations: Infinity, easing: 'linear' });
 });

 function loop(item, delay) {
  if (item.bob) item.node.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 3200, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.blink) item.node.animate([{ opacity: .1 }, { opacity: .45 }, { opacity: .1 }], { duration: 1400, delay, iterations: Infinity, easing: 'ease-in-out' });
  else item.node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .9 }, { transform: `translate(${item.dx}px,${item.dy}px)`, opacity: 0 }], { duration: 2600, delay, iterations: Infinity, easing: 'linear' });
 }
}

if (figure && frame) {
 try {
  const compact = matchMedia('(max-width: 900px)').matches;
  const layout = compact ? LAYOUTS.compact : LAYOUTS.wide;
  const scene = build(layout);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || compact;
  frame.replaceChildren(scene.svg);
  if (!still && typeof scene.svg.animate === 'function') animate(scene);
  // Shrink a line that would overflow its card (long translations) instead of letting it spill.
  const fit = (node, size) => {
   node.setAttribute('font-size', size);
   const room = layout.card.w - 60;
   for (let s = size; s > 9 && node.getComputedTextLength() > room; s -= .5) node.setAttribute('font-size', s - .5);
  };
  const setText = copy => {
   scene.svg.setAttribute('aria-label', copy.heroAlt);
   scene.districts.forEach((d, i) => {
    d.title.textContent = copy.heroCallouts[i][0]; d.sub.textContent = copy.heroCallouts[i][1];
    d.era.textContent = copy.heroEras[ERA[i]].toUpperCase();
    fit(d.title, layout.card.title); fit(d.sub, layout.card.sub);
   });
  };
  const lang = document.documentElement.lang === 'zh-CN' ? 'zh' : document.documentElement.lang;
  setText(locales[lang] || locales.en);
  document.addEventListener('homelocale', e => setText(e.detail.copy));
 } catch (error) {
  console.warn('Hero unavailable; keeping the static image.', error);
 }
}
