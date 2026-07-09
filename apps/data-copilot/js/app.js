// Orchestration: boot the engine, wire the tabs, run queries, render results.
import { initDuckDB, loadParquet, loadCSV, query } from "./duckdb.js";
import { profileTable, healthSummary } from "./profile.js";
import { lineChart } from "./charts.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  table: "stocks",
  lastResult: { columns: [], rows: [] },
};

// Example queries double as a guided tour of what DuckDB can do on this data.
const STOCK_EXAMPLES = [
  {
    label: "Normalized performance",
    sql: `-- Rebase every ticker to 100 on day one so you can compare them on one axis.
SELECT date, ticker, name,
       round(100 * close / first(close) OVER (PARTITION BY ticker ORDER BY date), 1) AS indexed
FROM stocks
ORDER BY date;`,
  },
  {
    label: "Total return leaderboard",
    sql: `-- first()/last() with ORDER BY: return over the whole window, per ticker.
SELECT ticker, name, market,
       round(100 * (last(close ORDER BY date) - first(close ORDER BY date))
             / first(close ORDER BY date), 1) AS pct_return
FROM stocks
GROUP BY ticker, name, market
ORDER BY pct_return DESC;`,
  },
  {
    label: "30-day moving average (AAPL)",
    sql: `-- A window frame: trailing 30-row average alongside the raw close.
SELECT date, close,
       round(avg(close) OVER (ORDER BY date ROWS 29 PRECEDING), 2) AS ma30
FROM stocks
WHERE ticker = 'AAPL'
ORDER BY date;`,
  },
  {
    label: "Annualized volatility",
    sql: `-- Daily returns via lag(), then stddev scaled to a yearly figure.
SELECT ticker, name,
       round(stddev(ret) * sqrt(252) * 100, 1) AS annual_vol_pct
FROM (
  SELECT ticker, name,
         close / lag(close) OVER (PARTITION BY ticker ORDER BY date) - 1 AS ret
  FROM stocks
)
WHERE ret IS NOT NULL
GROUP BY ticker, name
ORDER BY annual_vol_pct DESC;`,
  },
];

// --- boot -------------------------------------------------------------------
async function boot() {
  wireTabs();
  wireTheme();
  wireEditor();
  wireCSV();
  wireChartControls();

  try {
    await initDuckDB();
    await loadStocks();
  } catch (err) {
    $("#dsName").textContent = "Engine failed to load";
    $("#dsMeta").textContent = String(err);
    console.error(err);
  }
}

async function loadStocks() {
  await loadParquet("data/stocks.parquet", "stocks");
  state.table = "stocks";

  const meta = await fetch("data/meta.json").then((r) => r.json()).catch(() => null);
  $("#dsName").textContent = "Live market data";
  $("#dsMeta").textContent = meta
    ? `${meta.row_count.toLocaleString()} rows · ${meta.tickers.length} tickers · ${meta.date_min} → ${meta.date_max} · updated ${meta.last_updated.slice(0, 10)}`
    : "stocks.parquet";

  renderExamples(STOCK_EXAMPLES);
  $("#sql").value = STOCK_EXAMPLES[0].sql;
  await Promise.all([refreshProfile(), runQuery()]);
}

// --- profile ----------------------------------------------------------------
async function refreshProfile() {
  const cols = await profileTable(state.table);
  const health = healthSummary(cols);

  const banner = $("#healthBanner");
  banner.hidden = false;
  banner.className = `health-banner ${health.level}`;
  banner.innerHTML = `<i class="fa-solid ${health.level === "ok" ? "fa-circle-check" : "fa-triangle-exclamation"}"></i> ${health.text}`;

  const head = `<thead><tr>
    <th>column</th><th>type</th><th>nulls</th><th>unique</th>
    <th>min</th><th>max</th><th>mean</th><th>flags</th></tr></thead>`;
  const body = cols
    .map((c) => `<tr>
      <td class="c-name">${esc(c.name)}</td>
      <td class="c-type font-mono">${esc(c.type)}</td>
      <td>${c.nullPct ?? "—"}${c.nullPct != null ? "%" : ""}</td>
      <td>${c.unique?.toLocaleString() ?? "—"}</td>
      <td class="font-mono">${cell(c.min)}</td>
      <td class="font-mono">${cell(c.max)}</td>
      <td class="font-mono">${c.avg != null ? fmtNum(c.avg) : "—"}</td>
      <td>${c.flags.map((f) => `<span class="flag ${f.level}">${esc(f.label)}</span>`).join("") || "<span class='flag ok'>clean</span>"}</td>
    </tr>`)
    .join("");
  $("#profileTable").innerHTML = head + `<tbody>${body}</tbody>`;
}

// --- query ------------------------------------------------------------------
async function runQuery() {
  const sql = $("#sql").value.trim();
  if (!sql) return;
  const status = $("#runStatus");
  status.textContent = "running…";
  const t0 = performance.now();
  try {
    const result = await query(sql);
    state.lastResult = result;
    const ms = Math.max(1, Math.round(performance.now() - t0));
    status.textContent = `${result.rows.length.toLocaleString()} rows · ${ms} ms`;
    renderResult(result);
    syncChartControls();
  } catch (err) {
    status.textContent = "error";
    $("#resultTable").innerHTML = `<tbody><tr><td class="sql-error">${esc(String(err))}</td></tr></tbody>`;
    console.error(err);
  }
}

const MAX_RENDER = 20000; // safety ceiling so a runaway query can't freeze the tab

function renderResult({ columns, rows }) {
  const capped = rows.slice(0, MAX_RENDER);
  const head = `<thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`;
  const body = capped
    .map((r) => `<tr>${columns.map((c) => `<td class="font-mono">${cell(r[c])}</td>`).join("")}</tr>`)
    .join("");
  const note = rows.length > capped.length
    ? `<tfoot><tr><td colspan="${columns.length}">showing first ${capped.length.toLocaleString()} of ${rows.length.toLocaleString()} rows — scroll, or add a LIMIT / filter</td></tr></tfoot>`
    : "";
  $("#resultTable").innerHTML = head + `<tbody>${body}</tbody>` + note;
}

// --- chart ------------------------------------------------------------------
function syncChartControls() {
  const { columns, rows } = state.lastResult;
  const numeric = columns.filter((c) => rows.some((r) => Number.isFinite(Number(r[c]))));
  const dateish = columns.filter((c) => rows.some((r) => /^\d{4}-\d{2}-\d{2}/.test(String(r[c]))));
  const lowCard = columns.filter((c) => new Set(rows.map((r) => r[c])).size <= 12 && !numeric.includes(c));

  fillSelect("#xSel", columns, dateish[0] || columns[0]);
  fillSelect("#ySel", numeric, numeric.find((c) => !dateish.includes(c)) || numeric[0]);
  fillSelect("#seriesSel", ["(none)", ...lowCard], lowCard[0] || "(none)");
  drawChart();
}

function drawChart() {
  const { rows } = state.lastResult;
  const xKey = $("#xSel").value;
  const yKey = $("#ySel").value;
  const seriesSel = $("#seriesSel").value;
  const seriesKey = seriesSel === "(none)" ? null : seriesSel;
  if (!xKey || !yKey) return;
  lineChart($("#chartHost"), rows, { xKey, yKey, seriesKey });
}

// --- CSV upload -------------------------------------------------------------
function wireCSV() {
  const input = $("#csvInput");
  input.addEventListener("change", () => input.files[0] && ingestCSV(input.files[0]));

  // Whole-page drag & drop.
  ["dragover", "drop"].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev === "dragover") document.body.classList.add("dragging");
      else {
        document.body.classList.remove("dragging");
        const file = e.dataTransfer?.files?.[0];
        if (file && /\.csv$/i.test(file.name)) ingestCSV(file);
      }
    })
  );
  document.addEventListener("dragleave", () => document.body.classList.remove("dragging"));
}

async function ingestCSV(file) {
  const text = await file.text();
  await loadCSV(text, "user_data");
  state.table = "user_data";
  $("#dsName").textContent = file.name;
  $("#dsMeta").textContent = `${(file.size / 1024).toFixed(1)} KB · loaded in-browser`;
  renderExamples([{ label: "Preview", sql: "SELECT * FROM user_data LIMIT 100;" }]);
  $("#sql").value = "SELECT * FROM user_data LIMIT 100;";
  await Promise.all([refreshProfile(), runQuery()]);
}

// --- UI wiring --------------------------------------------------------------
function wireTabs() {
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      $(`#panel-${tab.dataset.tab}`).classList.add("is-active");
      if (tab.dataset.tab === "chart") drawChart();
    })
  );
}

function wireEditor() {
  $("#runBtn").addEventListener("click", runQuery);
  $("#sql").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runQuery(); }
  });
}

function wireChartControls() {
  ["#xSel", "#ySel", "#seriesSel"].forEach((s) => $(s).addEventListener("change", drawChart));
}

function wireTheme() {
  // The shared site header (js/site-header.js) owns the toggle button; we just
  // redraw the chart so its themed colors follow when the theme flips.
  document.addEventListener("themechange", () => {
    if (state.lastResult.rows.length) drawChart();
  });
}

function renderExamples(examples) {
  $("#examples").innerHTML = examples
    .map((ex, i) => `<button class="chip" data-i="${i}">${esc(ex.label)}</button>`)
    .join("");
  $("#examples").querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      $("#sql").value = examples[Number(chip.dataset.i)].sql;
      runQuery();
    })
  );
}

// --- helpers ----------------------------------------------------------------
function fillSelect(sel, options, selected) {
  $(sel).innerHTML = options.map((o) => `<option ${o === selected ? "selected" : ""}>${esc(o)}</option>`).join("");
}
function cell(v) {
  if (v === null || v === undefined) return "<span class='null'>∅</span>";
  if (typeof v === "number") return fmtNum(v);
  const s = String(v);
  return esc(s.length > 40 ? s.slice(0, 39) + "…" : s);
}
function fmtNum(n) {
  if (!Number.isFinite(n)) return esc(String(n));
  return Number.isInteger(n) ? n.toLocaleString() : Number(n.toFixed(4)).toLocaleString();
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

boot();
