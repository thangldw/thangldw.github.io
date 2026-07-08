// DuckDB-WASM engine wrapper.
// Runs a full analytical SQL engine *inside the browser tab* — no server, no
// backend, no data leaving the user's machine. This is the core of the demo:
// the same read_parquet / window-function SQL you'd run in a warehouse, on the
// client. Loaded from jsDelivr as an ES module.

import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

let db = null;
let conn = null;

/** Boot the WASM engine once and hand back a live connection. */
export async function initDuckDB() {
  if (conn) return conn;

  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles); // picks eh/mvp build for this browser

  // The worker script must be same-origin, so wrap the CDN worker in a Blob URL.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
  );
  const worker = new Worker(workerUrl);
  db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  conn = await db.connect();
  return conn;
}

/** Register a file buffer and expose it as a queryable view named `table`. */
export async function loadParquet(url, table = "data") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load ${url} (${res.status})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  await db.registerFileBuffer(`${table}.parquet`, buf);
  await conn.query(`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${table}.parquet')`);
  return table;
}

/** Register raw CSV text (from a dropped file) as a queryable view. */
export async function loadCSV(text, table = "data") {
  await db.registerFileText(`${table}.csv`, text);
  await conn.query(
    `CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_csv_auto('${table}.csv', SAMPLE_SIZE=-1)`
  );
  return table;
}

/**
 * Run SQL and return plain JS { columns, rows }. Arrow ships integers as BigInt,
 * which JSON/DOM can't render — coerce them to Number here so the rest of the
 * app never has to think about it.
 */
export async function query(sql) {
  const table = await conn.query(sql);
  const fields = table.schema.fields;
  const columns = fields.map((f) => f.name);

  // Arrow typeId: Decimal=7, Date=8, Time=9, Timestamp=10.
  const temporal = new Set(
    fields.filter((f) => [8, 9, 10].includes(f.typeId)).map((f) => f.name)
  );
  // DuckDB surfaces DECIMAL and (crucially) HUGEINT — e.g. the result of sum() on
  // a BIGINT column — as Arrow Decimal, whose values arrive as unscaled integers
  // (string/bigint). Divide by 10^scale to recover the real number, otherwise
  // percentages read as "2000%" and aggregates come back as strings.
  const decimalScale = new Map(
    fields.filter((f) => f.typeId === 7).map((f) => [f.name, f.type.scale || 0])
  );

  const rows = table.toArray().map((row) => {
    const obj = row.toJSON();
    for (const k of columns) {
      const v = obj[k];
      if (v == null) {
        continue;
      } else if (decimalScale.has(k)) {
        obj[k] = Number(v) / 10 ** decimalScale.get(k);
      } else if (typeof v === "bigint") {
        obj[k] = Number(v);
      } else if (temporal.has(k)) {
        const d = v instanceof Date ? v : new Date(Number(v));
        obj[k] = fields.find((f) => f.name === k).typeId === 10
          ? d.toISOString().replace("T", " ").slice(0, 19)   // timestamp
          : d.toISOString().slice(0, 10);                    // date
      }
    }
    return obj;
  });
  return { columns, rows };
}
