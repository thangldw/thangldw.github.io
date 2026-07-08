// Auto-profiling + data-quality heuristics.
//
// The heavy lifting is one line of SQL: DuckDB's SUMMARIZE returns per-column
// type, min/max/avg/std, approx-unique count and null percentage. We wrap that,
// then layer *quality judgement* on top — the part where a data engineer's
// opinion matters more than the raw stats.

import { query } from "./duckdb.js";

/** Run SUMMARIZE and normalise its columns into a stable shape. */
export async function profileTable(table = "data") {
  const { rows } = await query(`SUMMARIZE ${table}`);
  const total = await rowCount(table);

  return rows.map((r) => {
    const col = {
      name: r.column_name,
      type: r.column_type,
      nullPct: num(r.null_percentage),
      unique: num(r.approx_unique),
      min: r.min,
      max: r.max,
      avg: num(r.avg),
      std: num(r.std),
      q25: r.q25,
      q50: r.q50,
      q75: r.q75,
      count: total,
    };
    col.flags = flagColumn(col, total); // ← quality judgement, see below
    return col;
  });
}

async function rowCount(table) {
  const { rows } = await query(`SELECT count(*) AS n FROM ${table}`);
  return num(rows[0].n);
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// TODO(thang): tune the data-quality heuristics.
//
// This is the interesting decision, and it's a judgement call — there is no one
// "correct" rule set. Given a profiled column, decide what deserves a flag an
// engineer would actually want to see before trusting the data. Return an array
// of { level, label } where level ∈ {"warn","info"} (warn = red, info = amber).
//
// Signals you have on `col`: type, nullPct, unique, count, min, max, avg, std,
// q25/q50/q75. Trade-offs to weigh:
//   • How many nulls is "a lot"? A hard 50% threshold is blunt; some columns are
//     legitimately sparse. Too sensitive and every report is noise.
//   • unique === 1  → constant column (often a bug or a leftover filter).
//   • unique === count on a non-key numeric → possibly an ID masquerading as a
//     measure (summing it is meaningless).
//   • std === 0 on a numeric → no variance, likely useless as a feature.
//   • Detecting outliers from just avg/std vs. the quartile spread (IQR).
//
// A reasonable default is implemented below so the app runs today — sharpen it.
function flagColumn(col, total) {
  const flags = [];
  const isNumeric = /INT|DECIMAL|DOUBLE|FLOAT|REAL|BIGINT|HUGEINT/i.test(col.type);

  if (col.nullPct !== null && col.nullPct >= 50) {
    flags.push({ level: "warn", label: `${col.nullPct}% null` });
  } else if (col.nullPct !== null && col.nullPct > 0) {
    flags.push({ level: "info", label: `${col.nullPct}% null` });
  }

  if (col.unique === 1) {
    flags.push({ level: "warn", label: "constant" });
  }

  if (isNumeric && col.std === 0) {
    flags.push({ level: "warn", label: "zero variance" });
  }

  if (isNumeric && col.unique !== null && total > 20 && col.unique === total) {
    flags.push({ level: "info", label: "unique per row (id-like?)" });
  }

  return flags;
}
// ---------------------------------------------------------------------------

/** One-line health summary for the banner. */
export function healthSummary(columns) {
  const warns = columns.reduce((n, c) => n + c.flags.filter((f) => f.level === "warn").length, 0);
  if (warns === 0) return { level: "ok", text: "No quality issues detected" };
  return { level: "warn", text: `${warns} column${warns > 1 ? "s" : ""} need a look` };
}
