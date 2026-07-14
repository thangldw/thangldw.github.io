// Minimal dependency-free SVG charting. A multi-series line chart is enough to
// tell the story for time-series data; everything is drawn with the same design
// tokens as the rest of the site so it themes automatically.

const PALETTE = [
  "var(--accent)", "#f6a94a", "#5ecb9e", "#e46a8b",
  "#b98bff", "#4ec0e0", "#d7d34a", "#ef7f5a",
];

/** Render a line chart into `el`. rows: [{...}], keys pick the columns. */
export function lineChart(el, rows, { xKey, yKey, seriesKey } = {}) {
  el.innerHTML = "";
  if (!rows.length) {
    el.innerHTML = `<p class="chart-empty">No rows to plot.</p>`;
    return;
  }

  const W = el.clientWidth || 720;
  const H = 360;
  const pad = { top: 16, right: 16, bottom: 40, left: 64 };

  // Group rows into series.
  const groups = new Map();
  for (const r of rows) {
    const key = seriesKey ? String(r[seriesKey]) : yKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  // x is treated as an ordinal index over the sorted distinct x-values so that
  // dates and plain categories both work without a date scale.
  const xVals = [...new Set(rows.map((r) => String(r[xKey])))].sort();
  const xIndex = new Map(xVals.map((v, i) => [v, i]));
  const yVals = rows.map((r) => Number(r[yKey])).filter(Number.isFinite);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const yPad = (yMax - yMin) * 0.05 || 1;

  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const sx = (v) => pad.left + (xIndex.get(String(v)) / Math.max(1, xVals.length - 1)) * plotW;
  const sy = (v) =>
    pad.top + plotH - ((Number(v) - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * plotH;

  const svg = [`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img">`];

  // Y gridlines + labels.
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const val = (yMin - yPad) + ((yMax + yPad) - (yMin - yPad)) * (i / ticks);
    const y = sy(val);
    svg.push(`<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" class="grid"/>`);
    svg.push(`<text x="${pad.left - 8}" y="${y + 4}" class="axis-label" text-anchor="end">${fmt(val)}</text>`);
  }

  // X labels (thinned to ~6).
  const step = Math.ceil(xVals.length / 6);
  xVals.forEach((v, i) => {
    if (i % step !== 0 && i !== xVals.length - 1) return;
    svg.push(`<text x="${sx(v)}" y="${H - pad.bottom + 20}" class="axis-label" text-anchor="middle">${shortX(v)}</text>`);
  });

  // Series paths.
  let ci = 0;
  for (const [name, pts] of groups) {
    const color = PALETTE[ci % PALETTE.length];
    const sorted = pts
      .filter((r) => Number.isFinite(Number(r[yKey])))
      .sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey])));
    const d = sorted
      .map((r, i) => `${i ? "L" : "M"}${sx(r[xKey]).toFixed(1)},${sy(r[yKey]).toFixed(1)}`)
      .join(" ");
    svg.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`);
    ci++;
  }

  svg.push("</svg>");

  // Legend (only when there are real series).
  let legend = "";
  if (seriesKey && groups.size > 1) {
    legend =
      `<div class="chart-legend">` +
      [...groups.keys()]
        .map((name, i) => `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${name}</span>`)
        .join("") +
      `</div>`;
  }

  el.innerHTML = svg.join("") + legend;
}

function fmt(v) {
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortX(v) {
  // Keep the day for ISO dates so distinct daily points do not collapse into
  // repeated month labels on the x-axis.
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return s.length > 10 ? s.slice(0, 9) + "…" : s;
}
