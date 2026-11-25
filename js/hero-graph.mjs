// Hero for the home page: one floating isometric "city" that gives the whole picture of the work.
// Five districts share one island joined by data roads: data platforms at the back feed software
// engineering, the generative AI core and the customer's site, and everything flows on to AI in
// manufacturing at the front. Numbered markers match localized cards on either side. The city
// builds in sequence, then traffic, data, screens and machines keep moving. Static only when the
// visitor asks for reduced motion.
import { locales } from './home-locales.mjs?v=5932586c';

const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6);
const R2 = Math.SQRT2;
const figure = document.getElementById('heroArt');
const frame = figure?.querySelector('div');
const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#60a5fa', '#22c55e'];
// done (0), now (1) or next (2), shown as a status pill on each card
const ERA = [0, 0, 1, 1, 2];
const ERA_PILL = [['#e0ecff', '#1d4ed8'], ['#dbe4ff', '#1e3a8a'], ['#dcfce7', '#15803d']];
const DISTRICTS = [[-4, -4], [-4, 4], [0, 0], [4, -4], [4, 4]];
const LAYOUTS = {
 wide: {
  w: 1232, h: 480, S: 28, ox: 616, oy: 250, leaders: true,
  card: { w: 228, h: 66, title: 15, sub: 12 },
  cards: [[26, 56], [26, 200], [26, 344], [978, 118], [978, 296]]
 },
 compact: {
  w: 600, h: 830, S: 24, ox: 300, oy: 200, leaders: false,
  card: { w: 540, h: 66, title: 17, sub: 14 },
  cards: [[30, 420], [30, 500], [30, 580], [30, 660], [30, 740]]
 }
};

const el = (name, attrs = {}, parent) => {
 const node = document.createElementNS(NS, name);
 for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
 if (parent) parent.appendChild(node);
 return node;
};
const f = n => n.toFixed(1);
// deterministic pseudo-random numbers so the scene is the same on every load
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// convex hull of screen points (monotone chain), used for soft ground shadows
const hull = pts => {
 const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
 const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
 const half = list => { const out = []; for (const q of list) { while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop(); out.push(q); } out.pop(); return out; };
 return [...half(p), ...half(p.reverse())];
};

function build(layout) {
 seed = 7;
 const { w, h, S, ox, oy, card } = layout;
 const k = S / 22;
 const P = (x, y, z = 0) => [ox + (x - y) * C * S, oy + (x + y) * .5 * S - z * S];
 const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': figure.querySelector('img')?.alt || '' });
 const defs = el('defs', {}, svg);
 const linear = (id, stops, x2 = 1, y2 = 1) => { const g = el('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, defs); stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); };
 const radial = (id, stops) => { const g = el('radialGradient', { id, cx: .5, cy: .5, r: .5 }, defs); stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); };
 linear('hg-bg', [[0, '#0a1630'], [.55, '#102a5c'], [1, '#1d3f86']]);
 linear('hg-shine', [[0, '#fff', .32], [.6, '#fff', .06], [1, '#fff', 0]]);
 linear('hg-shade', [[0, '#000', 0], [1, '#000', .28]], 0, 1);
 linear('hg-cyl', [[0, '#fff', .25], [.45, '#fff', 0], [1, '#000', .32]], 1, 0);
 linear('hg-holo', [[0, '#7dd3fc', .35], [1, '#7dd3fc', .05]], 0, 1);
 linear('hg-holo-g', [[0, '#5fe0a8', .35], [1, '#5fe0a8', .05]], 0, 1);
 linear('hg-beam', [[0, '#c4b5fd', 0], [1, '#c4b5fd', .55]], 0, 1);
 linear('hg-smoke', [[0, '#e2e8f0', .7], [1, '#e2e8f0', 0]], 0, 1);
 radial('hg-glow', [[0, '#3b6bef', .5], [1, '#3b6bef', 0]]);
 radial('hg-under', [[0, '#60a5fa', .45], [1, '#60a5fa', 0]]);
 radial('hg-next', [[0, '#22c55e', .45], [1, '#22c55e', 0]]);
 radial('hg-orb', [[0, '#ffffff'], [.35, '#f5f3ff'], [.75, '#a78bfa'], [1, '#7c3aed']]);
 radial('hg-lamp', [[0, '#fde68a', .9], [1, '#fde68a', 0]]);
 const blur = el('filter', { id: 'hg-blur', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
 el('feGaussianBlur', { stdDeviation: 3 * k }, blur);
 const glowF = el('filter', { id: 'hg-gl', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
 el('feGaussianBlur', { stdDeviation: 3.5 * k, result: 'b' }, glowF);
 const merge = el('feMerge', {}, glowF); el('feMergeNode', { in: 'b' }, merge); el('feMergeNode', { in: 'SourceGraphic' }, merge);
 const drop = el('filter', { id: 'hg-drop', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
 el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 4, 'flood-color': '#020617', 'flood-opacity': .45 }, drop);
 const dots = el('pattern', { id: 'hg-dots', width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
 el('circle', { cx: 2, cy: 2, r: 1.1, fill: '#fff', opacity: .08 }, dots);

 for (const fill of ['url(#hg-bg)', 'url(#hg-dots)']) el('rect', { width: w, height: h, fill }, svg);
 const [gx, gy] = P(0, 0);
 el('ellipse', { cx: gx, cy: gy, rx: 15 * C * S, ry: 9 * S, fill: 'url(#hg-glow)' }, svg);
 // twinkling particles
 const sparkles = [];
 const sky = el('g', {}, svg);
 for (let i = 0; i < 46; i++) {
  const sx = rnd() * w, sy = rnd() * h, r = (.6 + rnd() * 1.4) * k;
  sparkles.push(el('circle', { cx: f(sx), cy: f(sy), r: f(r), fill: rnd() > .8 ? '#a5f3fc' : '#fff', opacity: f(.15 + rnd() * .45) }, sky));
 }
 const meteors = [0, 1].map(() => el('line', { x1: 0, y1: 0, x2: f(-46 * k), y2: f(-20 * k), stroke: '#e0f2fe', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, svg));
 const leaderLayer = el('g', {}, svg);

 // Drawing helpers anchored at a grid offset, so each district is drawn in its own local units.
 const at = (cx = 0, cy = 0) => {
  const L = (x, y, z = 0) => P(cx + x, cy + y, z);
  const pts = list => list.map(p => L(...p).map(f).join(',')).join(' ');
  const poly = (list, fill, parent, extra = {}) => el('polygon', { points: pts(list), fill, 'stroke-linejoin': 'round', ...extra }, parent);
  const box = (parent, x, y, z, bw, bd, bh, top, left, right, extra = {}) => {
   const g = el('g', {}, parent);
   const lf = [[x, y + bd, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x, y + bd, z]];
   const rf = [[x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x + bw, y + bd, z], [x + bw, y, z]];
   const tf = [[x, y, z + bh], [x + bw, y, z + bh], [x + bw, y + bd, z + bh], [x, y + bd, z + bh]];
   poly(lf, left, g, extra); if (bh > .12) poly(lf, 'url(#hg-shade)', g);
   poly(rf, right, g, extra); if (bh > .12) poly(rf, 'url(#hg-shade)', g);
   poly(tf, top, g, extra); poly(tf, 'url(#hg-shine)', g, { stroke: '#fff', 'stroke-opacity': .28, 'stroke-width': .8 });
   return g;
  };
  // A ground circle of radius r projects to an ellipse with these screen radii.
  const cyl = (parent, x, y, z, r, ch, top, side, bands = 0) => {
   const g = el('g', {}, parent);
   const [cx2, by] = L(x, y, z), ty = L(x, y, z + ch)[1];
   const rx = r * R2 * C * S, ry = r * R2 * .5 * S;
   const d = `M${f(cx2 - rx)} ${f(ty)}V${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx2 + rx)} ${f(by)}V${f(ty)}Z`;
   el('path', { d, fill: side }, g); el('path', { d, fill: 'url(#hg-cyl)' }, g);
   for (let b = 1; b <= bands; b++) {
    const yy = by - (ch * S) * b / (bands + 1);
    el('path', { d: `M${f(cx2 - rx)} ${f(yy)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx2 + rx)} ${f(yy)}`, fill: 'none', stroke: top, 'stroke-width': 1.3 * k, opacity: .75 }, g);
   }
   el('ellipse', { cx: f(cx2), cy: f(ty), rx: f(rx), ry: f(ry), fill: top, stroke: '#fff', 'stroke-opacity': .35, 'stroke-width': .8 }, g);
   return g;
  };
  const seg = (parent, a, b, attrs) => { const [u, v] = [L(...a), L(...b)]; return el('line', { x1: f(u[0]), y1: f(u[1]), x2: f(v[0]), y2: f(v[1]), 'stroke-linecap': 'round', ...attrs }, parent); };
  const path = (parent, list, attrs) => el('path', { d: list.map((p, i) => `${i ? 'L' : 'M'}${L(...p).map(f).join(' ')}`).join(''), fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, parent);
  // soft shadow cast toward the lower right by a box of height bh standing at z
  const shadow = (parent, x, y, bw, bd, bh, z = .2) => {
   const s = bh * .55, foot = [[x, y], [x + bw, y], [x + bw, y + bd], [x, y + bd]];
   const pts2 = [...foot, ...foot.map(([a, b]) => [a + s, b - s * .35])].map(([a, b]) => L(a, b, z));
   return el('polygon', { points: hull(pts2).map(p => p.map(f).join(',')).join(' '), fill: '#020617', opacity: .4, filter: 'url(#hg-blur)' }, parent);
  };
  const windows = (parent, x, y, z, bw, bd, rows, cols, lit = '#fef9c3') => {
   const g = el('g', {}, parent);
   g.lit = [];
   const rowH = .32, gap = (bw - cols * .22) / (cols + 1), gapD = (bd - cols * .22) / (cols + 1);
   for (let r2 = 0; r2 < rows; r2++) for (let c2 = 0; c2 < cols; c2++) {
    const zz = z + .25 + r2 * (rowH + .14);
    const on = rnd() > .25;
    const a = x + gap + c2 * (.22 + gap), b = y + gapD + c2 * (.22 + gapD);
    const pane = poly([[a, y + bd + .01, zz + rowH], [a + .22, y + bd + .01, zz + rowH], [a + .22, y + bd + .01, zz], [a, y + bd + .01, zz]], on ? lit : '#334a6e', g, { opacity: on ? .95 : .7 });
    if (on) g.lit.push(pane);
    poly([[x + bw + .01, b, zz + rowH], [x + bw + .01, b + .22, zz + rowH], [x + bw + .01, b + .22, zz], [x + bw + .01, b, zz]], on ? '#dbeafe' : '#26385a', g, { opacity: on ? .75 : .7 });
   }
   return g;
  };
  // a floating hologram panel standing on the plane y = py, facing the viewer's left
  const holo = (parent, x0, x1, py, z0, z1, fill = 'url(#hg-holo)', stroke = '#7dd3fc') => {
   const g = el('g', {}, parent);
   poly([[x0, py, z1], [x1, py, z1], [x1, py, z0], [x0, py, z0]], fill, g, { stroke, 'stroke-width': 1.2, 'stroke-opacity': .9 });
   return g;
  };
  return { L, poly, box, cyl, seg, path, shadow, windows, holo };
 };

 // the floating island: a bedrock layer, the ground slab and its tile grid
 const G = at();
 const ground = el('g', {}, svg);
 const [ux, uy] = P(0, 0, -2.2);
 el('ellipse', { cx: ux, cy: uy, rx: 10 * C * S, ry: 3.2 * S, fill: 'url(#hg-under)', filter: 'url(#hg-blur)' }, ground);
 G.box(ground, -5.5, -5.5, -1.25, 11, 11, .8, '#13264d', '#0c1a38', '#091430');
 G.box(ground, -6, -6, -.45, 12, 12, .45, '#182f5e', '#13285a', '#0d1f47');
 const tiles = el('g', { opacity: .55 }, ground);
 for (let i = -5; i <= 5; i++) {
  G.seg(tiles, [i, -6, .002], [i, 6, .002], { stroke: '#2c4a86', 'stroke-width': .5 });
  G.seg(tiles, [-6, i, .002], [6, i, .002], { stroke: '#2c4a86', 'stroke-width': .5 });
 }
 G.poly([[-6, -6], [6, -6], [6, 6], [-6, 6]], 'none', ground, { stroke: '#7dd3fc', 'stroke-opacity': .9, 'stroke-width': 1.6, filter: 'url(#hg-gl)' });

 // Roads: a ring through the four edge cells plus spokes into the core, each running the way
 // data flows, from the data platform at the back toward the factory at the front.
 const ROADS = [
  [[-4, -2], [-4, 2]], [[-2, -4], [2, -4]], [[-2, 4], [2, 4]], [[4, -2], [4, 2]],
  [[-4, 0], [-2, 0]], [[0, -4], [0, -2]], [[2, 0], [4, 0]], [[0, 2], [0, 4]]
 ];
 const roads = el('g', {}, svg);
 const traffic = [];
 ROADS.forEach(([a, b], i) => {
  const vert = a[0] === b[0], hw = .42;
  const ext = .42;
  const [ea, eb] = vert ? [[a[0], a[1] - (i < 4 ? ext : 0)], [b[0], b[1] + (i < 4 ? ext : 0)]] : [[a[0] - (i < 4 ? ext : 0), a[1]], [b[0] + (i < 4 ? ext : 0), b[1]]];
  const quad = vert ? [[ea[0] - hw, ea[1]], [ea[0] + hw, ea[1]], [eb[0] + hw, eb[1]], [eb[0] - hw, eb[1]]]
   : [[ea[0], ea[1] - hw], [eb[0], eb[1] - hw], [eb[0], eb[1] + hw], [ea[0], ea[1] + hw]];
  G.poly(quad.map(([x, y]) => [x, y, .006]), '#0b1630', roads, { stroke: '#4b6aa8', 'stroke-opacity': .6, 'stroke-width': .8 });
  const lane = G.seg(roads, [...a, .012], [...b, .012], { stroke: i >= 6 ? '#5fe0a8' : '#fde68a', 'stroke-width': 1.3 * k, 'stroke-dasharray': `${4 * k} ${5 * k}`, opacity: .75 });
  traffic.push({ lane });
 });

 // vehicles and data packets that travel along the roads
 const vehicles = [];
 const carLayer = el('g', {}, svg);
 ROADS.forEach(([a, b], i) => {
  const vert = a[0] === b[0], [u, v] = [P(...a), P(...b)];
  const car = el('g', {}, carLayer);
  const off = .17 * (i % 2 ? 1 : -1);
  const [cxa, cya] = vert ? [a[0] + off, a[1]] : [a[0], a[1] + off];
  const [bw, bd] = vert ? [.28, .5] : [.5, .28];
  G.box(car, cxa - bw / 2, cya - bd / 2, .02, bw, bd, .2, ['#f8fafc', '#fde68a', '#a5f3fc', '#fbcfe8'][i % 4], '#94a3b8', '#64748b');
  const [hx, hy] = G.L(cxa, cya, .25);
  el('circle', { cx: f(hx), cy: f(hy), r: f(4 * k), fill: i >= 6 ? '#5fe0a8' : '#fff', opacity: .5, filter: 'url(#hg-blur)' }, car);
  vehicles.push({ node: car, dx: v[0] - u[0], dy: v[1] - u[1], i });
 });

 const slab = ['#2b4fb5', '#1f3fa0', '#16307f'];
 const blue = ['#c7d7ff', '#3b6bef', '#2447b8'];
 const idleAll = [];

 // street lamps and greenery in the edge cells, plus a cloud over the back-right one
 const decorNodes = [];
 const decorate = (cx, cy) => {
  const D = at(cx, cy);
  const g = el('g', {}, svg);
  const lamp = (x, y) => {
   D.seg(g, [x, y, 0], [x, y, .75], { stroke: '#94a3b8', 'stroke-width': 1.4 * k });
   const [lx, ly] = D.L(x, y, .8);
   el('circle', { cx: f(lx), cy: f(ly), r: f(9 * k), fill: 'url(#hg-lamp)' }, g);
   el('circle', { cx: f(lx), cy: f(ly), r: f(2 * k), fill: '#fef3c7' }, g);
  };
  const tree = (x, y, s2 = 1) => {
   D.shadow(g, x - .2, y - .2, .4, .4, .6 * s2, 0);
   D.seg(g, [x, y, 0], [x, y, .35 * s2], { stroke: '#6b4f3a', 'stroke-width': 2.4 * k });
   const [tx, ty] = D.L(x, y, .55 * s2);
   el('circle', { cx: f(tx), cy: f(ty), r: f(8 * k * s2), fill: '#15803d' }, g);
   el('circle', { cx: f(tx - 1.5 * k), cy: f(ty - 1.8 * k), r: f(6.4 * k * s2), fill: '#22c55e' }, g);
   el('circle', { cx: f(tx - 3 * k), cy: f(ty - 3.4 * k), r: f(2.6 * k * s2), fill: '#86efac', opacity: .9 }, g);
  };
  const corners = [[-1.35, -1.35], [1.35, -1.35], [-1.35, 1.35], [1.35, 1.35]];
  if (cx === -4 && cy === 0) {
   // server racks beside the pipeline road
   [[-1.65, -1.65], [.95, 1.0]].forEach(([x, y]) => {
    D.shadow(g, x, y, .7, .55, .95, 0);
    D.box(g, x, y, 0, .7, .55, .95, '#c7d7ff', '#334a6e', '#1f2f50');
    for (let r2 = 0; r2 < 4; r2++) D.seg(g, [x + .1, y + .56, .18 + r2 * .2], [x + .6, y + .56, .18 + r2 * .2], { stroke: r2 % 2 ? '#22c55e' : '#38bdf8', 'stroke-width': 1.4 * k });
   });
   tree(1.3, -1.3); tree(-1.3, 1.35, .85); lamp(.65, -.65); lamp(-.65, .65);
  } else if (cx === 0 && cy === -4) {
   tree(-1.35, 1.3, .9); tree(1.3, 1.3); lamp(-.65, -.65); lamp(.65, .65);
   D.shadow(g, -1.7, -1.7, .7, .7, .5, 0);
   D.box(g, -1.7, -1.7, 0, .7, .7, .5, '#c7d7ff', '#3b6bef', '#2447b8');
   const [cl, ct] = D.L(-.9, -.2, 2.5);
   const cloud = el('g', { filter: 'url(#hg-drop)' }, g);
   [[0, 0, 12], [13, -7, 14], [27, -1, 11], [14, 3, 11], [-10, 3, 8], [37, 4, 7]].forEach(([dx, dy, r]) => el('circle', { cx: f(cl + dx * k), cy: f(ct + dy * k), r: f(r * k), fill: '#eef4ff' }, cloud));
   el('text', { x: f(cl + 13 * k), y: f(ct + 4 * k), fill: '#2447b8', 'font-size': f(9 * k), 'font-weight': 800, 'text-anchor': 'middle' }, cloud).textContent = 'GCP';
   const rain = el('g', {}, g);
   for (let q = 0; q < 3; q++) { const [a1, b1] = [cl + (4 + q * 10) * k, ct + 14 * k]; el('line', { x1: f(a1), y1: f(b1), x2: f(a1), y2: f(b1 + 26 * k), stroke: '#7dd3fc', 'stroke-width': 1.6 * k, 'stroke-dasharray': `${3 * k} ${5 * k}`, opacity: .8 }, rain); }
   idleAll.push({ node: cloud, bob: true }, { node: rain, flowDown: true, list: [...rain.children] });
  } else {
   corners.forEach(([x, y], q) => tree(x, y, q % 2 ? .85 : 1));
   lamp(.65, -.65); lamp(-.65, .65);
  }
  decorNodes.push(g);
 };

 const drawDistrict = index => {
  const [dcx, dcy] = DISTRICTS[index];
  const D = at(dcx, dcy);
  const { L, poly, box, cyl, seg, path, shadow, windows, holo } = D;
  const g = el('g', {}, svg);
  const rise = [], dropN = [], pop = [], idle = [];
  let hot;
  if (index === 4) { const [hx, hy] = L(0, 0); el('ellipse', { cx: hx, cy: hy, rx: 130 * k, ry: 78 * k, fill: 'url(#hg-next)' }, g); }
  const pad = index === 4 ? ['#1d6b52', '#165c45', '#0f4733'] : slab;
  rise.push(box(g, -1.9, -1.9, 0, 3.8, 3.8, .2, ...pad, index === 4 ? { stroke: '#5fe0a8', 'stroke-width': .9, 'stroke-dasharray': '4 4' } : {}));
  if (index === 0) {
   // Data platforms: a lake, warehouses, an ETL plant and pipelines, with a live dashboard
   const lake = el('g', {}, g);
   box(lake, -1.75, .05, .2, 1.95, 1.7, .06, '#7dd3fc', '#38bdf8', '#0ea5e9');
   [[.35, .55], [.2, .3]].forEach(([r]) => { const [lx, ly] = L(-.78, .9, .27); el('ellipse', { cx: f(lx), cy: f(ly), rx: f(r * R2 * C * S), ry: f(r * R2 * .5 * S), fill: 'none', stroke: '#fff', 'stroke-opacity': .55, 'stroke-width': .9 }, lake); });
   rise.push(lake);
   [0, 1].forEach(q => { const [lx, ly] = L(-.78, .9, .27); const rp = el('ellipse', { cx: f(lx), cy: f(ly), rx: f(.5 * R2 * C * S), ry: f(.5 * R2 * .5 * S), fill: 'none', stroke: '#e0f2fe', 'stroke-width': 1.2, opacity: 0 }, g); idle.push({ node: rp, ripple: true, q }); });
   shadow(g, -1.7, -1.7, 1.25, 1.25, .75);
   const etl = el('g', {}, g);
   box(etl, -1.7, -1.7, .2, 1.25, 1.25, .75, ...blue);
   windows(etl, -1.7, -1.7, .2, 1.25, 1.25, 1, 3);
   box(etl, -1.5, -1.5, .95, .3, .3, .22, '#e2e8f0', '#94a3b8', '#64748b'); box(etl, -1.0, -1.45, .95, .25, .25, .32, '#e2e8f0', '#94a3b8', '#64748b');
   rise.push(etl);
   [[.35, -1.35, 1.5], [1.3, -1.35, 1.15], [1.3, -.35, .85]].forEach(([x, y, th]) => {
    shadow(g, x - .45, y - .45, .9, .9, th);
    dropN.push(cyl(g, x, y, .2, .45, th, '#e0f2fe', '#0284c7', 2));
   });
   const pipes = el('g', {}, g);
   const route = [[-.6, .4, .38], [-.6, -.35, .38], [.35, -.35, .38], [.35, -.9, .38]];
   path(pipes, route, { stroke: '#94a3b8', 'stroke-width': 5 * k });
   path(pipes, route, { stroke: '#e2e8f0', 'stroke-width': 2.4 * k });
   const flow = path(pipes, [[-.8, .9, .3], [-.6, .4, .38], ...route.slice(1), [1.3, -.35, .5]], { stroke: '#38bdf8', 'stroke-width': 2 * k, 'stroke-dasharray': `${2 * k} ${6 * k}` });
   pop.push(pipes); idle.push({ node: flow, flow: true });
   // dashboard hologram with bars and a trend line
   const dash = holo(g, -1.45, .25, -1.85, 1.3, 2.05);
   [[.25, .3], [.55, .55], [.85, .4], [1.15, .75], [1.45, .6]].forEach(([x, hh], q) => idle.push({ bar: true, q, node: poly([[-1.45 + x, -1.85, 1.4 + hh * .7], [-1.45 + x + .18, -1.85, 1.4 + hh * .7], [-1.45 + x + .18, -1.85, 1.4], [-1.45 + x, -1.85, 1.4]], '#bae6fd', dash, { opacity: .9 }) }));
   path(dash, [[-1.3, -1.85, 1.75], [-.9, -1.85, 1.85], [-.5, -1.85, 1.78], [-.1, -1.85, 1.95]], { stroke: '#fde68a', 'stroke-width': 1.6 * k });
   pop.push(dash); idle.push({ node: dash, bob: true });
   hot = L(.35, -1.35, 1.7);
  } else if (index === 1) {
   // Software engineering: a dev studio, an editor wall, CI checks and shipped containers
   shadow(g, -1.75, -1.75, 1.5, 1.3, 1.4);
   const studio = el('g', {}, g);
   box(studio, -1.75, -1.75, .2, 1.5, 1.3, 1.4, '#ede9fe', '#8b5cf6', '#6d28d9');
   windows(studio, -1.75, -1.75, .2, 1.5, 1.3, 2, 3, '#f5f3ff');
   box(studio, -1.55, -1.55, 1.6, .5, .4, .25, '#e2e8f0', '#94a3b8', '#64748b');
   rise.push(studio);
   // editor wall: a thin standing screen facing left with code lines
   shadow(g, .05, -1.65, 1.7, .14, 1.5);
   const wall = el('g', {}, g);
   box(wall, .05, -1.65, .2, 1.7, .14, 1.5, '#c9d6f2', '#0f1b33', '#7c8fb8');
   const face = -1.65 + .14 + .012;
   [[.35, .9, '#a78bfa'], [.55, 1.3, '#e2e8f0'], [.75, .7, '#38bdf8'], [.95, 1.45, '#e2e8f0'], [1.15, 1.0, '#f59e0b'], [1.35, .55, '#e2e8f0']].forEach(([z, len], q, arr) => {
    const x0 = .18 + (q % 3 === 1 ? .2 : 0);
    idle.push({ type: true, q, node: seg(wall, [x0, face, z + .2], [x0 + len * .9, face, z + .2], { stroke: arr[q][2], 'stroke-width': 2.2 * k, opacity: .95, pathLength: 1 }) });
   });
   rise.push(wall);
   // shipped containers
   [[.25, .3, 0, '#fb923c', '#ea580c', '#c2410c'], [.25, .3, .42, '#2dd4bf', '#0d9488', '#0f766e'], [.25, 1.05, 0, '#a78bfa', '#7c3aed', '#5b21b6']].forEach(([x, y, z, ...c3]) => {
    if (!z) shadow(g, x, y, 1.3, .6, .42);
    const ct = box(g, x, y, .2 + z, 1.3, .6, .4, ...c3);
    for (let r2 = 1; r2 < 6; r2++) seg(ct, [x + r2 * .22, y + .61, .24 + z], [x + r2 * .22, y + .61, .56 + z], { stroke: '#000', 'stroke-opacity': .18, 'stroke-width': 1 });
    dropN.push(ct);
    if (z) idle.push({ node: ct, lift: true });
   });
   // CI checks along the front
   [[-1.55, .45], [-1.55, .95], [-1.55, 1.45]].forEach(([x, y], q) => {
    const post = el('g', {}, g);
    box(post, x, y, .2, .32, .32, .35 + q * .12, '#bbf7d0', '#16a34a', '#15803d');
    const [px, py] = L(x + .16, y + .16, .75 + q * .12);
    el('circle', { cx: f(px), cy: f(py), r: f(5.5 * k), fill: '#22c55e', stroke: '#fff', 'stroke-width': 1.2 }, post);
    el('path', { d: `M${f(px - 2.6 * k)} ${f(py)}l${f(1.9 * k)} ${f(1.9 * k)} ${f(3.4 * k)} ${f(-3.6 * k)}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.5 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, post);
    pop.push(post);
    idle.push({ node: post.lastChild.previousSibling, ping: true, q }, { node: post.lastChild, ping: true, q });
   });
   hot = L(.9, -1.6, 1.85);
  } else if (index === 2) {
   // Generative AI and RAG: a glowing core tower with orbits, retrieval arcs and a vector store
   const plaza = cyl(g, 0, 0, .2, 1.55, .12, '#3b6bef', '#1f3fa0');
   rise.push(plaza);
   const ring1 = el('ellipse', { cx: 0, cy: 0, rx: f(1.75 * R2 * C * S), ry: f(1.75 * R2 * .5 * S), fill: 'none', stroke: '#c4b5fd', 'stroke-width': 1.4 * k, 'stroke-dasharray': `${6 * k} ${8 * k}`, opacity: .8 });
   const [r1x, r1y] = L(0, 0, .5); ring1.setAttribute('cx', f(r1x)); ring1.setAttribute('cy', f(r1y)); g.appendChild(ring1);
   shadow(g, -.7, -.7, 1.4, 1.4, 2.2, .32);
   const tower = el('g', {}, g);
   const tints = [['#ddd6fe', '#8b5cf6', '#6d28d9'], ['#e4dcff', '#9a6bfa', '#7442e0'], ['#ebe4ff', '#a97cfb', '#7c4ce8'], ['#f3eeff', '#b892fc', '#8b5cf6']];
   tints.forEach((c3, q) => box(tower, -.7 + q * .04, -.7 + q * .04, .32 + q * .52, 1.4 - q * .08, 1.4 - q * .08, .44, ...c3));
   for (let q = 0; q < 4; q++) seg(tower, [-.66 + q * .04, .7 - q * .04 + .01, .5 + q * .52], [.66 - q * .04, .7 - q * .04 + .01, .5 + q * .52], { stroke: '#fff', 'stroke-opacity': .5, 'stroke-width': 1 });
   rise.push(tower);
   const [ox2, oy2] = L(.05, .05, 2.75);
   const beam = el('rect', { x: f(ox2 - 7 * k), y: 0, width: f(14 * k), height: f(oy2), fill: 'url(#hg-beam)', opacity: .7 }, g);
   idle.push({ node: beam, glowPulse: true });
   const orbG = el('g', {}, g);
   const halo = el('circle', { cx: f(ox2), cy: f(oy2), r: f(17 * k), fill: '#a78bfa', opacity: .35, filter: 'url(#hg-blur)' }, orbG);
   el('circle', { cx: f(ox2), cy: f(oy2), r: f(10 * k), fill: 'url(#hg-orb)', filter: 'url(#hg-gl)' }, orbG);
   // neural nodes around the orb
   const nodes = [[-26, -6], [-16, -22], [8, -26], [26, -12], [24, 10], [-22, 12]];
   nodes.forEach(([dx, dy]) => el('line', { x1: f(ox2), y1: f(oy2), x2: f(ox2 + dx * k), y2: f(oy2 + dy * k), stroke: '#ddd6fe', 'stroke-width': 1, opacity: .7 }, orbG));
   nodes.forEach(([dx, dy], q) => { const a = nodes[(q + 1) % nodes.length]; el('line', { x1: f(ox2 + dx * k), y1: f(oy2 + dy * k), x2: f(ox2 + a[0] * k), y2: f(oy2 + a[1] * k), stroke: '#c4b5fd', 'stroke-width': .8, opacity: .45 }, orbG); });
   nodes.forEach(([dx, dy], q) => idle.push({ node: el('circle', { cx: f(ox2 + dx * k), cy: f(oy2 + dy * k), r: f(2.6 * k), fill: '#fff' }, orbG), twinkle: true, q }));
   for (let q = 0; q < 3; q++) idle.push({ node: el('circle', { r: f(2.4 * k), fill: '#f5f3ff', opacity: 0 }, g), along: `M${f(ox2)} ${f(oy2 - 12 * k)}V0`, dur: 2400, q });
   pop.push(orbG); idle.push({ node: halo, pulse: true });
   const ring2 = el('ellipse', { cx: f(ox2), cy: f(oy2 + 4 * k), rx: f(36 * k), ry: f(12 * k), fill: 'none', stroke: '#fde68a', 'stroke-width': 1.3 * k, 'stroke-dasharray': `${3 * k} ${7 * k}`, opacity: .85 }, g);
   pop.push(ring2); idle.push({ node: ring1, flow: true }, { node: ring2, flow: true, reverse: true });
   // document stacks and the retrieval arcs into the core
   [[-1.75, .55], [-1.15, 1.25]].forEach(([x, y]) => {
    shadow(g, x, y, .65, .5, .45);
    const stack = el('g', {}, g);
    for (let q = 0; q < 4; q++) box(stack, x, y, .2 + q * .11, .65, .5, .08, '#fffbeb', '#fbbf24', '#d97706');
    dropN.push(stack);
   });
   [[-1.4, .8, .7], [-.8, 1.5, .7]].forEach(([x, y, z], q) => {
    const [u, v] = [L(x, y, z), [ox2 - 6 * k, oy2 + 6 * k]];
    const mx = (u[0] + v[0]) / 2 - 12 * k, my = Math.min(u[1], v[1]) - (16 + q * 14) * k;
    const arc = el('path', { d: `M${f(u[0])} ${f(u[1])}Q${f(mx)} ${f(my)} ${f(v[0])} ${f(v[1])}`, fill: 'none', stroke: '#fde68a', 'stroke-width': 1.6 * k, 'stroke-dasharray': `${2 * k} ${5 * k}`, 'stroke-linecap': 'round' }, g);
    pop.push(arc); idle.push({ node: arc, flow: true });
    const chip = el('rect', { x: f(-4 * k), y: f(-3 * k), width: f(8 * k), height: f(6 * k), rx: 1.5, fill: '#fef3c7', stroke: '#f59e0b', 'stroke-width': 1, opacity: 0 }, g);
    idle.push({ node: chip, along: arc.getAttribute('d'), dur: 2200, q: q * 2 });
   });
   // vector store and eval cubes
   shadow(g, .9, .9, .7, .7, .7);
   dropN.push(cyl(g, 1.25, 1.25, .2, .38, .7, '#fef3c7', '#d97706', 2));
   [[1.2, -.25], [1.55, .2], [.75, .95]].forEach(([x, y]) => pop.push(box(g, x, y, .2, .28, .28, .28, '#fef3c7', '#f59e0b', '#b45309')));
   hot = [ox2 + 30 * k, oy2 + 8 * k];
  } else if (index === 3) {
   // Forward deployed engineering: the customer's HQ, with a deployed pod working alongside it
   shadow(g, -1.75, -1.75, 1.45, 1.45, 2.8);
   const hq = el('g', {}, g);
   box(hq, -1.75, -1.75, .2, 1.45, 1.45, 2.8, '#e2ebff', '#8fa6d6', '#5f78ad');
   windows(hq, -1.75, -1.75, .2, 1.45, 1.45, 5, 3).lit.filter((_, q) => q % 3 === 1).forEach((n, q) => idle.push({ node: n, flicker: true, q }));
   box(hq, -1.45, -1.45, 3, .85, .85, .14, '#cbd5e1', '#94a3b8', '#64748b');
   seg(hq, [-1.05, -1.05, 3.14], [-1.05, -1.05, 3.6], { stroke: '#cbd5e1', 'stroke-width': 1.4 * k });
   const [ax, ay] = L(-1.05, -1.05, 3.6);
   const beacon = el('circle', { cx: f(ax), cy: f(ay), r: f(2.6 * k), fill: '#f87171' }, hq);
   idle.push({ node: beacon, blinkFast: true });
   rise.push(hq);
   shadow(g, .05, -1.75, 1.6, 1.05, 1.1);
   const annex = el('g', {}, g);
   box(annex, .05, -1.75, .2, 1.6, 1.05, 1.1, '#f1f5f9', '#a5b4cf', '#7084a8');
   windows(annex, .05, -1.75, .2, 1.6, 1.05, 2, 4);
   rise.push(annex);
   // deployed pod with glowing seams and a cable into the HQ
   shadow(g, .35, .35, 1.25, 1.25, .85);
   const pod = el('g', {}, g);
   box(pod, .35, .35, .2, 1.25, 1.25, .85, ...blue);
   for (let r2 = 1; r2 < 4; r2++) idle.push({ node: seg(pod, [.35, 1.61, .2 + r2 * .2], [1.6, 1.61, .2 + r2 * .2], { stroke: '#7dd3fc', 'stroke-width': 1.2 * k, opacity: .9 }), twinkle: true, q: r2 });
   for (let r2 = 1; r2 < 4; r2++) seg(pod, [1.61, .35 + r2 * .3, .25], [1.61, .35 + r2 * .3, 1], { stroke: '#7dd3fc', 'stroke-width': 1 * k, opacity: .6 });
   dropN.push(pod);
   const cable = path(g, [[.35, .9, .3], [-.6, .9, .3], [-.6, -.25, .3]], { stroke: '#93c5fd', 'stroke-width': 2 * k, 'stroke-dasharray': `${2 * k} ${5 * k}` });
   pop.push(cable); idle.push({ node: cable, flow: true, reverse: true });
   // plaza with a bench and a small tree
   const plaza = el('g', {}, g);
   box(plaza, -1.7, .45, .2, 1.4, 1.2, .04, '#dbe4ff', '#9fb2d9', '#7c8fb8');
   box(plaza, -1.45, .7, .24, .7, .18, .14, '#a16207', '#854d0e', '#713f12');
   const [tx, ty] = L(-.7, 1.3, .7);
   el('circle', { cx: f(tx), cy: f(ty), r: f(8 * k), fill: '#16a34a' }, plaza); el('circle', { cx: f(tx - 2 * k), cy: f(ty - 2 * k), r: f(5.5 * k), fill: '#4ade80' }, plaza);
   pop.push(plaza);
   const [px, py] = L(-1.05, -1.05, 4.35);
   const pr = 9 * k;
   const pin = el('g', { filter: 'url(#hg-drop)' }, g);
   el('path', { d: `M${f(px)} ${f(py + pr * 2.2)}C${f(px - pr * .5)} ${f(py + pr * 1.3)} ${f(px - pr)} ${f(py + pr * .8)} ${f(px - pr)} ${f(py)}A${f(pr)} ${f(pr)} 0 0 1 ${f(px + pr)} ${f(py)}C${f(px + pr)} ${f(py + pr * .8)} ${f(px + pr * .5)} ${f(py + pr * 1.3)} ${f(px)} ${f(py + pr * 2.2)}Z`, fill: '#60a5fa', stroke: '#fff', 'stroke-width': 1.6 }, pin);
   el('circle', { cx: f(px), cy: f(py), r: f(pr * .38), fill: '#fff' }, pin);
   pop.push(pin); idle.push({ node: pin, bob: true });
   hot = L(.98, .98, 1.55);
  } else {
   // AI in manufacturing (next): a sawtooth hall, silos, a vision-checked line, robots, an AGV
   // and a digital twin hovering over the hall
   shadow(g, -1.8, -1.8, 2.4, 1.4, 1.4);
   const fac = el('g', {}, g);
   box(fac, -1.8, -1.8, .2, 2.4, 1.4, .9, '#dcfce7', '#4ade80', '#16a34a');
   const z0 = 1.1, y0 = -1.8, y1 = -.4;
   for (let q = 0; q < 3; q++) {
    const a = -1.8 + q * .8, b = a + .8;
    poly([[a, y1, z0], [b, y1, z0], [b, y1, z0 + .45]], '#4ade80', fac);
    poly([[a, y0, z0], [a, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#f0fdf4', fac);
    poly([[a, y0, z0], [a, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], 'url(#hg-shine)', fac);
    poly([[b, y0, z0], [b, y1, z0], [b, y1, z0 + .45], [b, y0, z0 + .45]], '#a5f3fc', fac, { opacity: .85 });
   }
   for (let q = 0; q < 4; q++) poly([[-1.65 + q * .55, -.39, .4], [-1.3 + q * .55, -.39, .4], [-1.3 + q * .55, -.39, .85], [-1.65 + q * .55, -.39, .85]], '#bbf7d0', fac, { opacity: .9 });
   box(fac, -1.6, -1.65, z0, .28, .28, 1.05, '#e2e8f0', '#94a3b8', '#64748b');
   rise.push(fac);
   const [sx, sy] = L(-1.46, -1.51, 2.3);
   const smoke = [0, 1, 2].map(q => el('circle', { cx: f(sx + q * 3 * k), cy: f(sy - q * 8 * k), r: f((5 + q * 2) * k), fill: '#e2e8f0', opacity: .5 - q * .12 }, g));
   smoke.forEach((n, q) => idle.push({ node: n, smoke: true, q }));
   [[1.0, -1.35, 1.2], [1.55, -.8, .95]].forEach(([x, y, th]) => { shadow(g, x - .32, y - .32, .64, .64, th); dropN.push(cyl(g, x, y, .2, .32, th, '#f0fdf4', '#16a34a', 1)); });
   // conveyor with rollers and products, a vision camera and its scan beam
   rise.push(box(g, -1.8, .35, .2, 3.6, .7, .22, '#475569', '#334155', '#1e293b'));
   for (let q = 0; q < 12; q++) seg(g, [-1.75 + q * .3, .36, .43], [-1.75 + q * .3, 1.04, .43], { stroke: '#64748b', 'stroke-width': .8 });
   for (let q = 0; q < 3; q++) {
    const item = box(g, -1.65 + q * 1.15, .5, .43, .38, .38, .3, '#fff', '#cbd5e1', '#94a3b8');
    idle.push({ node: item, dx: 1.15 * C * S, dy: 1.15 * .5 * S });
   }
   seg(g, [.2, .35, .43], [.2, .35, 1.55], { stroke: '#94a3b8', 'stroke-width': 1.6 * k });
   const [bx, by] = L(.2, .7, 1.45);
   const [lx, ly] = L(-.15, .45, .45), [rx, ry] = L(.55, 1.0, .45);
   const beam = el('path', { d: `M${f(bx)} ${f(by)}L${f(lx)} ${f(ly)}L${f(rx)} ${f(ry)}Z`, fill: '#5fe0a8', opacity: .35 }, g);
   idle.push({ node: beam, blink: true });
   pop.push(box(g, .05, .55, 1.45, .3, .3, .18, '#fff', '#5fe0a8', '#16a36a'));
   // two robot arms beside the line
   const arm = (x, y, reach) => {
    const a = el('g', {}, g);
    cyl(a, x, y, .2, .28, .25, '#e2e8f0', '#475569');
    const j = [L(x, y, .45), L(x, y, 1.25), L(x + reach[0], y + reach[1], 1.5), L(x + reach[0] * 1.3, y + reach[1] * 1.3, 1.0)];
    j.slice(1).forEach((p, q) => el('line', { x1: f(j[q][0]), y1: f(j[q][1]), x2: f(p[0]), y2: f(p[1]), stroke: '#f97316', 'stroke-width': 5 * k, 'stroke-linecap': 'round' }, a));
    j.forEach(p => el('circle', { cx: f(p[0]), cy: f(p[1]), r: f(3.2 * k), fill: '#1e293b', stroke: '#fff', 'stroke-width': 1 }, a));
    dropN.push(a); idle.push({ node: a, sway: true });
   };
   arm(1.35, -.05, [.05, .5]); arm(-1.0, 1.6, [.05, -.45]);
   // AGV crossing the front of the yard
   const agv = el('g', {}, g);
   box(agv, -1.6, 1.25, .2, .45, .35, .16, '#fde68a', '#f59e0b', '#b45309');
   box(agv, -1.5, 1.32, .36, .25, .2, .14, '#fff', '#cbd5e1', '#94a3b8');
   idle.push({ node: agv, dx: 2.6 * C * S, dy: 2.6 * .5 * S, slow: true });
   // digital twin: a wireframe hall hovering above, with a scanning plane
   const twin = el('g', {}, g);
   const wire = [[-1.3, -1.3], [.3, -1.3], [.3, -.6], [-1.3, -.6]];
   const tz0 = 2.35, tz1 = 3.0;
   poly(wire.map(([x, y]) => [x, y, tz0]), 'url(#hg-holo-g)', twin, { stroke: '#5fe0a8', 'stroke-width': 1.2 });
   poly(wire.map(([x, y]) => [x, y, tz1]), 'none', twin, { stroke: '#5fe0a8', 'stroke-width': 1.2 });
   wire.forEach(([x, y]) => seg(twin, [x, y, tz0], [x, y, tz1], { stroke: '#5fe0a8', 'stroke-width': 1 }));
   [[-1.3, tz1], [-.5, tz1 + .3], [.3, tz1]].reduce((a2, b2) => { seg(twin, [a2[0], -1.3, a2[1]], [b2[0], -1.3, b2[1]], { stroke: '#86efac', 'stroke-width': 1, 'stroke-dasharray': '3 3' }); return b2; });
   const scan = poly(wire.map(([x, y]) => [x, y, tz0]), '#5fe0a8', twin, { opacity: .35 });
   idle.push({ node: scan, scan: true, dy: -(tz1 - tz0) * S });
   pop.push(twin); idle.push({ node: twin, bob: true });
   hot = L(1.55, -.8, 1.3);
  }
  return { g, rise, drop: dropN, pop, idle, hot };
 };

 // back to front: data, the two back edge cells, the middle row, the two front edge cells, factory
 const districts = [];
 districts[0] = drawDistrict(0);
 decorate(-4, 0); decorate(0, -4);
 districts[1] = drawDistrict(1); districts[2] = drawDistrict(2); districts[3] = drawDistrict(3);
 decorate(0, 4); decorate(4, 0);
 districts[4] = drawDistrict(4);

 // numbered markers on the map, leader lines (behind the island) and the matching cards
 const markers = el('g', {}, svg);
 districts.forEach((d, i) => {
  const [mx, my0] = d.hot, my = my0 - 18 * k;
  d.marker = el('g', { filter: 'url(#hg-drop)' }, markers);
  el('line', { x1: f(mx), y1: f(my0), x2: f(mx), y2: f(my + 10), stroke: '#fff', 'stroke-width': 1.6, 'stroke-opacity': .9 }, d.marker);
  el('circle', { cx: f(mx), cy: f(my0), r: 2.6, fill: '#fff' }, d.marker);
  d.ring = el('circle', { cx: f(mx), cy: f(my), r: 12, fill: 'none', stroke: COLORS[i], 'stroke-width': 2, opacity: 0 }, markers);
  el('circle', { cx: f(mx), cy: f(my), r: 12, fill: COLORS[i], stroke: '#fff', 'stroke-width': 2.5 }, d.marker);
  el('text', { x: f(mx), y: f(my + 4.5), fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, d.marker).textContent = String(i + 1);
  const [cardX, cardY] = layout.cards[i];
  if (layout.leaders) {
   const right = cardX > ox;
   const sx = right ? cardX : cardX + card.w, sy = cardY + card.h / 2;
   const elbow = right ? sx - 26 : sx + 26;
   d.leader = el('path', { d: `M${f(sx)} ${f(sy)}H${f(elbow)}L${f(mx)} ${f(my)}`, fill: 'none', stroke: COLORS[i], 'stroke-width': 1.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round', opacity: .85 }, leaderLayer);
   d.spark = el('circle', { r: 3, fill: COLORS[i], opacity: 0, filter: 'url(#hg-gl)' }, leaderLayer);
  }
  d.cardNode = el('g', { filter: 'url(#hg-drop)' }, svg);
  el('rect', { x: cardX, y: cardY, width: card.w, height: card.h, rx: 12, fill: '#fff' }, d.cardNode);
  el('rect', { x: cardX, y: cardY + 14, width: 4, height: card.h - 28, rx: 2, fill: COLORS[i] }, d.cardNode);
  el('circle', { cx: cardX + 26, cy: cardY + card.h / 2, r: 12, fill: COLORS[i] }, d.cardNode);
  el('text', { x: cardX + 26, y: cardY + card.h / 2 + 4.5, fill: '#fff', 'font-size': 13, 'font-weight': 800, 'text-anchor': 'middle' }, d.cardNode).textContent = String(i + 1);
  d.pill = el('rect', { x: cardX + 46, y: cardY + 9, width: 40, height: 16, rx: 8, fill: ERA_PILL[ERA[i]][0] }, d.cardNode);
  d.era = el('text', { x: cardX + 53, y: cardY + 20.5, fill: ERA_PILL[ERA[i]][1], 'font-size': 9.5, 'font-weight': 800, 'letter-spacing': '.08em' }, d.cardNode);
  d.title = el('text', { x: cardX + 47, y: cardY + 43, fill: '#10213a', 'font-size': card.title, 'font-weight': 700 }, d.cardNode);
  d.sub = el('text', { x: cardX + 47, y: cardY + 59, fill: '#51607a', 'font-size': card.sub }, d.cardNode);
 });
 return { svg, ground, roads, traffic, vehicles, carLayer, decorNodes, districts, sparkles, idleAll, meteors, w, h };
}

function animate(scene) {
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 const rise = (n, delay) => n.animate([{ transform: 'translateY(26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay, easing: ease, fill: 'backwards' });
 const drop = (n, delay) => n.animate([{ transform: 'translateY(-44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .55 }, { transform: 'translateY(-4px)', offset: .8 }, { transform: 'translateY(0)' }], { duration: 620, delay, easing: 'ease-in', fill: 'backwards' });
 const grow = (n, delay) => { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 380, delay, easing: 'ease-out', fill: 'backwards' }); };
 const fade = (n, delay, duration = 500) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, fill: 'backwards' });

 scene.ground.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 100, easing: ease, fill: 'backwards' });
 fade(scene.roads, 500);
 fade(scene.carLayer, 3600);
 scene.decorNodes.forEach((n, i) => fade(n, 600 + i * 140));
 scene.sparkles.forEach((n, i) => n.animate([{ opacity: .1 }, { opacity: .7 }, { opacity: .1 }], { duration: 2400 + (i % 7) * 400, delay: (i % 11) * 230, iterations: Infinity, easing: 'ease-in-out' }));
 scene.districts.forEach((d, step) => {
  const t0 = 700 + step * 560;
  d.rise.forEach((n, q) => rise(n, t0 + q * 100));
  d.drop.forEach((n, q) => drop(n, t0 + 120 + q * 110));
  d.pop.forEach((n, q) => grow(n, t0 + 420 + q * 60));
  grow(d.marker, t0 + 650);
  if (d.leader) fade(d.leader, t0 + 700, 400);
  d.cardNode.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: t0 + 720, easing: ease, fill: 'backwards' });
  d.idle.forEach(item => loop(item, t0 + 1300));
 });
 scene.idleAll.forEach(item => loop(item, 3200));
 scene.districts.forEach((d, i) => {
  d.ring.style.transformBox = 'fill-box'; d.ring.style.transformOrigin = 'center';
  d.ring.animate([{ transform: 'scale(1)', opacity: .8 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 2200, delay: 4200 + i * 440, iterations: Infinity, easing: 'ease-out' });
  if (d.leader) loop({ node: d.spark, along: d.leader.getAttribute('d'), dur: 2600, q: i, back: true }, 4400);
  if (d.leader) d.leader.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 16 }], { duration: 1100, delay: 4000, iterations: Infinity });
 });
 scene.meteors.forEach((m, q) => {
  const x0 = scene.w * (.45 + q * .3), y0 = 18 + q * 30;
  m.animate([{ transform: `translate(${x0}px,${y0}px)`, opacity: 0 }, { opacity: .9, offset: .15 }, { transform: `translate(${x0 - 260}px,${y0 + 110}px)`, opacity: 0, offset: .4 }, { transform: `translate(${x0 - 260}px,${y0 + 110}px)`, opacity: 0 }], { duration: 7000, delay: 5000 + q * 3500, iterations: Infinity, easing: 'ease-out' });
 });
 scene.traffic.forEach(({ lane }) => lane.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -18 }], { duration: 900, iterations: Infinity }));
 scene.vehicles.forEach(({ node, dx, dy, i }) => {
  const twin = node.cloneNode(true);
  scene.carLayer.appendChild(twin);
  const period = 2600 + (i % 3) * 500;
  twin.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .88 }, { transform: `translate(${f(dx)}px,${f(dy)}px)`, opacity: 0 }], { duration: period, delay: 3800 + (i % 4) * 520 + period / 2, iterations: Infinity, easing: 'linear' });
  node.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .88 }, { transform: `translate(${f(dx)}px,${f(dy)}px)`, opacity: 0 }], { duration: 2600 + (i % 3) * 500, delay: 3800 + (i % 4) * 520, iterations: Infinity, easing: 'linear' });
 });

 function loop(item, delay) {
  const n = item.node;
  if (item.bob) n.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 3400, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.blink) n.animate([{ opacity: .08 }, { opacity: .45 }, { opacity: .08 }], { duration: 1400, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.ripple) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(.3)', opacity: .9 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 2800, delay: delay + item.q * 1400, iterations: Infinity, easing: 'ease-out' }); }
  else if (item.bar) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'bottom'; n.animate([{ transform: 'scaleY(1)' }, { transform: `scaleY(${(.45 + (item.q * 37 % 50) / 100).toFixed(2)})` }, { transform: 'scaleY(1.15)' }, { transform: 'scaleY(1)' }], { duration: 2600 + item.q * 300, delay, iterations: Infinity, easing: 'ease-in-out' }); }
  else if (item.type) { n.setAttribute('stroke-dasharray', '1 1'); n.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0, offset: .35 }, { strokeDashoffset: 0, offset: .85 }, { strokeDashoffset: 1 }], { duration: 4200, delay: delay + item.q * 260, iterations: Infinity, easing: 'ease-out' }); }
  else if (item.lift) n.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .45 }, { transform: 'translateY(-16px)', offset: .62 }, { transform: 'translateY(-16px)', offset: .78 }, { transform: 'translateY(0)', offset: .95 }, { transform: 'translateY(0)' }], { duration: 5200, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.ping) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: .08 }, { transform: 'scale(1)', offset: .2 }, { transform: 'scale(1)' }], { duration: 2400, delay: delay + item.q * 800, iterations: Infinity, easing: 'ease-out' }); }
  else if (item.twinkle) n.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 1600 + item.q * 230, delay: delay + item.q * 180, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.flicker) n.animate([{ opacity: .95 }, { opacity: .95, offset: .6 }, { opacity: .15, offset: .64 }, { opacity: .15, offset: .9 }, { opacity: .95, offset: .94 }, { opacity: .95 }], { duration: 5000 + item.q * 1300, delay: delay + item.q * 700, iterations: Infinity });
  else if (item.scan) n.animate([{ transform: 'translateY(0)', opacity: .1 }, { transform: `translateY(${f(item.dy)}px)`, opacity: .5 }, { transform: 'translateY(0)', opacity: .1 }], { duration: 3000, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.along) {
   n.style.offsetPath = `path("${item.along}")`; n.style.offsetRotate = '0deg';
   const [from, to] = item.back ? ['100%', '0%'] : ['0%', '100%'];
   n.animate([{ offsetDistance: from, opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .85 }, { offsetDistance: to, opacity: 0 }], { duration: item.dur, delay: delay + item.q * 600, iterations: Infinity, easing: 'ease-in-out' });
  }
  else if (item.glowPulse) n.animate([{ opacity: .35 }, { opacity: .8 }, { opacity: .35 }], { duration: 2800, delay, iterations: Infinity, easing: 'ease-in-out' });
  else if (item.blinkFast) n.animate([{ opacity: 1 }, { opacity: .15 }, { opacity: 1 }], { duration: 1100, delay, iterations: Infinity });
  else if (item.pulse) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center'; n.animate([{ transform: 'scale(.85)', opacity: .25 }, { transform: 'scale(1.25)', opacity: .5 }, { transform: 'scale(.85)', opacity: .25 }], { duration: 2600, delay, iterations: Infinity, easing: 'ease-in-out' }); }
  else if (item.flow) n.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: item.reverse ? 28 : -28 }], { duration: 1400, delay, iterations: Infinity });
  else if (item.flowDown) item.list.forEach(line => line.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -16 }], { duration: 700, delay, iterations: Infinity }));
  else if (item.smoke) n.animate([{ transform: 'translate(0,0) scale(.7)', opacity: 0 }, { opacity: .55, offset: .2 }, { transform: 'translate(6px,-22px) scale(1.4)', opacity: 0 }], { duration: 3000, delay: delay + item.q * 1000, iterations: Infinity, easing: 'ease-out' });
  else if (item.sway) { n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'bottom'; n.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0deg)' }], { duration: 3600, delay, iterations: Infinity, easing: 'ease-in-out' }); }
  else n.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .9 }, { transform: `translate(${f(item.dx)}px,${f(item.dy)}px)`, opacity: 0 }], { duration: item.slow ? 5200 : 2600, delay, iterations: Infinity, easing: item.slow ? 'ease-in-out' : 'linear' });
 }
}

if (figure && frame) {
 try {
  const compact = matchMedia('(max-width: 900px)').matches;
  const layout = compact ? LAYOUTS.compact : LAYOUTS.wide;
  const scene = build(layout);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  frame.replaceChildren(scene.svg);
  if (!still && typeof scene.svg.animate === 'function') animate(scene);
  // Shrink a line that would overflow its card (long translations) instead of letting it spill.
  const fit = (node, size) => {
   node.setAttribute('font-size', size);
   const room = layout.card.w - 58;
   for (let s = size; s > 9 && node.getComputedTextLength() > room; s -= .5) node.setAttribute('font-size', s - .5);
  };
  const setText = copy => {
   scene.svg.setAttribute('aria-label', copy.heroAlt);
   scene.districts.forEach((d, i) => {
    d.title.textContent = copy.heroCallouts[i][0]; d.sub.textContent = copy.heroCallouts[i][1];
    d.era.textContent = copy.heroEras[ERA[i]].toUpperCase();
    d.pill.setAttribute('width', f(d.era.getComputedTextLength() + 14));
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
