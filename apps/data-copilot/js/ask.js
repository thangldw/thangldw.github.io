// Keyless natural-language → SQL for the stock dataset.
//
// No LLM, no API key, no backend: a deterministic semantic layer that maps a
// question to an *intent*, extracts slots (tickers, a count, a time window),
// and generates real DuckDB SQL from a template. It's the same first-line
// pattern production NL-to-SQL systems use before ever reaching for a model —
// fast, transparent (we show the SQL), and it runs entirely in the tab.
//
// interpret(question, ctx) → { intent, sql, explanation, chart } on a match,
//                            { suggestions } when nothing is confident enough.

// Common ways people name the instruments in the basket, mapped to the symbol
// the pipeline stores. Names from meta are merged in at runtime on top of these.
const BASE_ALIASES = {
  apple: "AAPL", microsoft: "MSFT", msft: "MSFT", nvidia: "NVDA", nvda: "NVDA",
  alphabet: "GOOGL", google: "GOOGL", googl: "GOOGL", amazon: "AMZN", amzn: "AMZN",
  toyota: "7203.T", sony: "6758.T", softbank: "9984.T", "soft bank": "9984.T",
  mufg: "8306.T", mitsubishi: "8306.T",
  nikkei: "^N225", "nikkei 225": "^N225", n225: "^N225",
  "s&p": "^GSPC", "s&p 500": "^GSPC", sp500: "^GSPC", spx: "^GSPC", "s and p": "^GSPC",
};

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

export const ASK_EXAMPLES = [
  "Top 5 by return",
  "Which stocks fell?",
  "How volatile is each stock?",
  "Compare Toyota and Sony",
  "30-day moving average of NVDA",
  "Show Nikkei last 3 months",
  "Correlation between Apple and S&P 500",
  "Latest prices",
];

function buildAliases(ctx) {
  const map = { ...BASE_ALIASES };
  for (const t of ctx?.tickers || []) {
    map[t.ticker.toLowerCase()] = t.ticker;
    map[t.name.toLowerCase()] = t.ticker;
  }
  return map;
}

// Resolve ticker mentions in order of appearance, de-duplicated.
function resolveTickers(q, aliases) {
  const hits = [];
  for (const [alias, sym] of Object.entries(aliases)) {
    const idx = q.indexOf(alias);
    if (idx >= 0) hits.push({ sym, idx, len: alias.length });
  }
  // Prefer longer aliases at the same spot ("s&p 500" over "s&p"), then order by position.
  hits.sort((a, b) => a.idx - b.idx || b.len - a.len);
  const seen = new Set(), out = [];
  for (const h of hits) if (!seen.has(h.sym)) { seen.add(h.sym); out.push(h.sym); }
  return out;
}

function parseN(q) {
  const m = q.match(/\b(?:top|bottom|first|best|worst)\s+(\d+)/) || q.match(/\b(\d+)\b/);
  if (m) return Math.min(50, Math.max(1, parseInt(m[1], 10)));
  for (const [w, n] of Object.entries(NUM_WORDS)) if (new RegExp(`\\b${w}\\b`).test(q)) return n;
  return null;
}

// A DuckDB date predicate for "last N days/weeks/months", "last year", or "ytd".
function parseWindow(q) {
  const maxd = "(SELECT max(date) FROM stocks)";
  if (/\byear to date\b|\bytd\b/.test(q)) return `date >= date_trunc('year', ${maxd})`;
  const m = q.match(/\blast\s+(\d+)?\s*(day|week|month|year)s?\b/);
  if (m) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    return `date >= ${maxd} - INTERVAL ${n} ${m[2].toUpperCase()}`;
  }
  if (/\bpast month\b|\blast month\b/.test(q)) return `date >= ${maxd} - INTERVAL 1 MONTH`;
  return null;
}

const inList = (syms) => "(" + syms.map((s) => `'${s}'`).join(", ") + ")";
const whereWin = (win) => (win ? ` WHERE ${win}` : "");

// --- intent rules, tried in order; first match wins -------------------------
function rules(q, t, n, win) {
  const has = (re) => re.test(q);

  // Correlation of daily returns between two named instruments.
  if (has(/correl/) && t.length >= 2) {
    const [a, b] = t;
    return {
      intent: `Correlation of daily returns · ${a} vs ${b}`,
      sql:
`WITH r AS (
  SELECT ticker, date,
         close / lag(close) OVER (PARTITION BY ticker ORDER BY date) - 1 AS ret
  FROM stocks WHERE ticker IN ('${a}', '${b}')
)
SELECT round(corr(a.ret, b.ret), 3) AS correlation
FROM (SELECT date, ret FROM r WHERE ticker = '${a}') a
JOIN (SELECT date, ret FROM r WHERE ticker = '${b}') b USING (date)
WHERE a.ret IS NOT NULL AND b.ret IS NOT NULL;`,
    };
  }

  // Explicit comparison → rebased (indexed-to-100) performance, charted.
  if (has(/\bcompare\b|\bversus\b|\bvs\b/)) {
    const filter = t.length ? ` WHERE ticker IN ${inList(t)}` : "";
    return normalized(filter, t.length ? `Indexed performance · ${t.join(", ")}` : "Indexed performance · all");
  }

  // 30-day moving average vs close for one ticker (UNPIVOT → two chart lines).
  if (has(/moving\s*aver|\bma\b|\btrend/)) {
    const tk = t[0] || "AAPL";
    return {
      intent: `30-day moving average · ${tk}`,
      sql:
`SELECT date, series, value FROM (
  SELECT date, close,
         round(avg(close) OVER (ORDER BY date ROWS 29 PRECEDING), 2) AS ma30
  FROM stocks WHERE ticker = '${tk}'
) UNPIVOT (value FOR series IN (close, ma30))
ORDER BY date;`,
      chart: { xKey: "date", yKey: "value", seriesKey: "series" },
    };
  }

  // Annualized volatility (stddev of daily returns × √252).
  if (has(/volatil|\bstd\b|\brisk\b|\bstddev\b/)) {
    const filter = t.length ? ` WHERE ticker IN ${inList(t)}` : "";
    return {
      intent: t.length ? `Annualized volatility · ${t.join(", ")}` : "Annualized volatility · all",
      sql:
`SELECT ticker, name, round(stddev(ret) * sqrt(252) * 100, 1) AS annual_vol_pct
FROM (
  SELECT ticker, name,
         close / lag(close) OVER (PARTITION BY ticker ORDER BY date) - 1 AS ret
  FROM stocks${filter}
)
WHERE ret IS NOT NULL
GROUP BY ticker, name
ORDER BY annual_vol_pct DESC;`,
    };
  }

  // Average daily volume leaderboard.
  if (has(/\bvolume\b|\btraded\b|liquid/)) {
    const filter = t.length ? ` WHERE ticker IN ${inList(t)}` : "";
    return {
      intent: "Average daily volume",
      sql:
`SELECT ticker, name, round(avg(volume)) AS avg_volume
FROM stocks${filter}
GROUP BY ticker, name
ORDER BY avg_volume DESC;`,
    };
  }

  // Highest / lowest price over the window.
  if (has(/(highest|record|expensive|cheapest|lowest|52[\s-]*week).*(price|high|low)|price.*(high|low)|52[\s-]*week/)) {
    const low = has(/lowest|cheapest|\blow\b/);
    return {
      intent: low ? "Lowest price per ticker" : "Highest price per ticker",
      sql:
`SELECT ticker, name, ${low ? "min(low)" : "max(high)"} AS ${low ? "low_price" : "high_price"}
FROM stocks
GROUP BY ticker, name
ORDER BY ${low ? "low_price" : "high_price"} ${low ? "ASC" : "DESC"};`,
    };
  }

  // Return leaderboard (best / worst / gainers / losers), optional LIMIT + window.
  if (has(/\btop\b|\bbest\b|\bworst\b|winner|loser|\bgain|\blose|\blost\b|\bfell\b|\bfall|\bdrop|declin|\brose\b|\brise|\brank|\breturn|perform|leader|move/)) {
    const asc = has(/worst|loser|\blose|\blost\b|\bfell\b|\bfall|\bdrop|declin|\bdown\b/);
    const limit = n ? `\nLIMIT ${n}` : "";
    return {
      intent: `${asc ? "Worst" : "Best"} total return${n ? ` · top ${n}` : ""}${win ? " · windowed" : ""}`,
      sql:
`SELECT ticker, name, market,
       round(100 * (last(close ORDER BY date) - first(close ORDER BY date))
             / first(close ORDER BY date), 1) AS pct_return
FROM stocks${whereWin(win)}
GROUP BY ticker, name, market
ORDER BY pct_return ${asc ? "ASC" : "DESC"}${limit};`,
    };
  }

  // Two+ tickers without another verb → compare them (indexed).
  if (t.length >= 2) return normalized(` WHERE ticker IN ${inList(t)}`, `Indexed performance · ${t.join(", ")}`);

  // One ticker → its price series over the window.
  if (t.length === 1) {
    return {
      intent: `Price history · ${t[0]}`,
      sql: `SELECT date, close, volume\nFROM stocks\nWHERE ticker = '${t[0]}'${win ? ` AND ${win}` : ""}\nORDER BY date;`,
      chart: { xKey: "date", yKey: "close", seriesKey: null },
    };
  }

  // Performance / chart everything.
  if (has(/perform|normal|indexed|how have|chart|plot|graph|over time/)) {
    return normalized("", "Indexed performance · all");
  }

  // Snapshot of the latest close.
  if (has(/latest|current|\bnow\b|today|price|quote|\bclose\b|snapshot/)) {
    return {
      intent: "Latest close per ticker",
      sql:
`SELECT ticker, name, market, close, volume
FROM stocks
WHERE date = (SELECT max(date) FROM stocks)
ORDER BY close DESC;`,
    };
  }

  return null;
}

function normalized(filter, intent) {
  return {
    intent,
    sql:
`SELECT date, ticker, name,
       round(100 * close / first(close) OVER (PARTITION BY ticker ORDER BY date), 1) AS indexed
FROM stocks${filter}
ORDER BY date;`,
    chart: { xKey: "date", yKey: "indexed", seriesKey: "ticker" },
  };
}

export function interpret(question, ctx) {
  const q = " " + question.toLowerCase().trim() + " ";
  const aliases = buildAliases(ctx);
  const tickers = resolveTickers(q, aliases);
  const hit = rules(q, tickers, parseN(q), parseWindow(q));
  if (hit) return hit;
  return { suggestions: ASK_EXAMPLES };
}
