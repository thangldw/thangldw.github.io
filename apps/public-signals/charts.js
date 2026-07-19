export const $ = (selector) => document.querySelector(selector);
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const mean = values => { const clean = values.filter(Number.isFinite); return clean.length ? clean.reduce((a,b)=>a+b,0)/clean.length : null; };
export const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString(undefined,{maximumFractionDigits:digits}) : "—";
export const daysAgo = (iso, days) => new Date(iso + "T00:00:00Z").getTime() - (days - 1) * 86400000;

export function stat(label, value, note) {
  return `<div class="signal-stat"><div class="signal-stat-label">${esc(label)}</div><div class="signal-stat-value">${esc(value)}</div><div class="signal-stat-note">${esc(note)}</div></div>`;
}

export function evidence(items) {
  return items.map(([value,label]) => `<div class="evidence-item"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join("");
}

export function horizontalBars(host, rows, {valueLabel = v => fmt(v), color = "var(--signal-violet)"} = {}) {
  const width = 620, left = 150, right = 70, top = 8, rowH = 38, height = Math.max(150, top + rows.length * rowH + 14);
  const max = Math.max(1, ...rows.map(r => r.value));
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img">
    ${rows.map((r,i) => { const y=top+i*rowH; const w=(r.value/max)*(width-left-right); return `<text class="chart-label" x="0" y="${y+16}">${esc(r.label)}</text><rect x="${left}" y="${y+5}" width="${width-left-right}" height="12" fill="var(--portfolio-surface-2)"/><rect x="${left}" y="${y+5}" width="${Math.max(1,w)}" height="12" fill="${r.color||color}"/><text class="value" x="${width-right+10}" y="${y+16}">${esc(valueLabel(r.value,r))}</text>`; }).join("")}
  </svg>`;
}

export function tooltipify(host) {
  let tip = document.querySelector(".chart-tooltip");
  if (!tip) { tip=document.createElement("div"); tip.className="chart-tooltip"; tip.hidden=true; document.body.appendChild(tip); }
  host.onpointermove = event => {
    const target = event.target.closest("[data-tip]");
    if (!target) { tip.hidden=true; return; }
    tip.innerHTML=target.dataset.tip; tip.hidden=false;
    tip.style.left=Math.min(innerWidth-270,event.clientX+14)+"px"; tip.style.top=Math.min(innerHeight-100,event.clientY+14)+"px";
  };
  host.onpointerleave=()=>{tip.hidden=true;};
}

export function lineChart(host, series, options = {}) {
  const width=760,height=300,left=42,right=18,top=20,bottom=34;
  const all=series.flatMap(s=>s.values).filter(v=>Number.isFinite(v.value));
  if (!all.length) { host.textContent="No data for this window."; return; }
  let min=Math.min(...all.map(v=>v.value)), max=Math.max(...all.map(v=>v.value));
  if (options.zero) min=Math.min(0,min); if (max===min) max=min+1;
  const n=Math.max(...series.map(s=>s.values.length));
  const x=i=>left+(i/Math.max(1,n-1))*(width-left-right), y=v=>top+(1-(v-min)/(max-min))*(height-top-bottom);
  const ticks=[0,.25,.5,.75,1];
  host.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(options.label||'Time-series chart')}">
    ${ticks.map(t=>`<line class="grid" x1="${left}" x2="${width-right}" y1="${top+t*(height-top-bottom)}" y2="${top+t*(height-top-bottom)}"/><text class="axis" x="0" y="${top+t*(height-top-bottom)+4}">${fmt(max-t*(max-min),0)}</text>`).join("")}
    ${series.map((s,si)=>{const pts=s.values.map((v,i)=>`${x(i)},${y(v.value)}`).join(' ');return `<polyline fill="none" stroke="${s.color}" stroke-width="${s.focus?3:1.25}" opacity="${s.focus?1:.28}" points="${pts}"/>${s.focus?s.values.filter((_,i)=>i%Math.ceil(s.values.length/20)===0).map((v,i)=>`<circle cx="${x(i*Math.ceil(s.values.length/20))}" cy="${y(v.value)}" r="2.4" fill="${s.color}"/>`).join(''):''}`;}).join("")}
    <text class="axis" x="${left}" y="${height-8}">${esc(options.start||'')}</text><text class="axis" text-anchor="end" x="${width-right}" y="${height-8}">${esc(options.end||'')}</text>
  </svg>`;
}
