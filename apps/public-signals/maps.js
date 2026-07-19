export const LAND = [
  [[-168,72],[-150,61],[-135,58],[-125,50],[-124,40],[-117,32],[-106,25],[-97,19],[-90,19],[-83,25],[-80,31],[-74,41],[-61,47],[-54,53],[-60,60],[-78,69],[-100,73],[-130,71],[-168,72]],
  [[-81,12],[-74,5],[-70,-5],[-77,-15],[-72,-28],[-67,-40],[-61,-53],[-52,-45],[-47,-25],[-36,-7],[-50,2],[-64,10],[-81,12]],
  [[-53,82],[-25,80],[-18,70],[-28,60],[-44,60],[-58,69],[-53,82]],
  [[-10,36],[-17,25],[-15,12],[-5,4],[9,4],[15,-5],[24,-18],[34,-35],[42,-18],[51,11],[42,28],[31,32],[13,36],[-10,36]],
  [[-10,36],[-5,44],[8,45],[22,55],[40,60],[58,70],[90,77],[126,72],[160,61],[178,52],[160,45],[145,43],[137,35],[126,40],[118,30],[108,20],[100,8],[92,22],[80,9],[70,22],[58,25],[45,39],[32,42],[20,40],[8,43],[-10,36]],
  [[67,24],[76,8],[80,7],[88,22],[80,30],[67,24]],
  [[96,22],[104,8],[110,2],[119,-5],[129,-7],[137,-2],[130,8],[119,18],[108,22],[96,22]],
  [[112,-11],[114,-24],[129,-34],[145,-39],[154,-28],[146,-16],[132,-11],[112,-11]],
  [[166,-34],[174,-41],[178,-46],[169,-47],[166,-34]],
  [[129,31],[132,34],[136,35],[140,40],[145,44],[143,35],[138,33],[134,31],[129,31]],
  [[120,22],[122,25],[121,26],[119,24],[120,22]],
  [[47,-13],[50,-16],[49,-25],[44,-24],[43,-16],[47,-13]]
];

export function projectFlat(lon, lat, bounds, frame) {
  const {lonMin, lonMax, latMin, latMax} = bounds;
  const {width, height, left, right, top, bottom} = frame;
  return {
    x: left + (lon - lonMin) / (lonMax - lonMin) * (width - left - right),
    y: top + (latMax - lat) / (latMax - latMin) * (height - top - bottom)
  };
}

export function flatMapBase({id, bounds, frame, longitudeTicks, latitudeTicks}) {
  const {width, height, left, right, top, bottom} = frame;
  const p = (lon, lat) => projectFlat(lon, lat, bounds, frame);
  const paths = LAND.map(poly => poly.map(([lon,lat],index) => {
    const point=p(lon,lat); return `${index?'L':'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(' ') + ' Z').join(' ');
  return `<defs><clipPath id="${id}"><rect x="${left}" y="${top}" width="${width-left-right}" height="${height-top-bottom}"/></clipPath></defs>
    <rect x="${left}" y="${top}" width="${width-left-right}" height="${height-top-bottom}" fill="var(--portfolio-bg)"/>
    ${longitudeTicks.map(lon=>{const point=p(lon,bounds.latMin),label=lon===0?'0°':`${Math.abs(lon)}°${lon<0?'W':'E'}`;return `<line class="grid" x1="${point.x}" x2="${point.x}" y1="${top}" y2="${height-bottom}"/><text class="axis" text-anchor="middle" x="${point.x}" y="${height-9}">${label}</text>`;}).join('')}
    ${latitudeTicks.map(lat=>{const point=p(bounds.lonMin,lat);return `<line class="grid" x1="${left}" x2="${width-right}" y1="${point.y}" y2="${point.y}"/><text class="axis" x="4" y="${point.y+3}">${Math.abs(lat)}°${lat<0?'S':'N'}</text>`;}).join('')}
    <path d="${paths}" clip-path="url(#${id})" fill="var(--portfolio-accent-soft)" stroke="var(--portfolio-border-strong)" stroke-width="1"/>`;
}
