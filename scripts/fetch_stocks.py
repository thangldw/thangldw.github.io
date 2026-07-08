#!/usr/bin/env python3
"""Extract daily OHLCV for a curated basket of tickers from the public Yahoo
Finance chart API, shape it into a tidy long-format table, and write Parquet +
metadata for the Data Copilot demo.

Keyless by design: the endpoint needs no API token, so the GitHub Actions cron
stays free and has no secret to leak. Run locally with `python scripts/fetch_stocks.py`.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

# --- Curated basket ---------------------------------------------------------
# A Tokyo-flavoured mix: US mega-cap tech + Japanese blue chips + two indices.
# Edit freely — (yahoo_symbol, display_name, market) is all the pipeline needs.
TICKERS = [
    ("AAPL",   "Apple",             "US"),
    ("MSFT",   "Microsoft",         "US"),
    ("NVDA",   "NVIDIA",            "US"),
    ("GOOGL",  "Alphabet",          "US"),
    ("AMZN",   "Amazon",            "US"),
    ("7203.T", "Toyota",            "JP"),
    ("6758.T", "Sony",              "JP"),
    ("9984.T", "SoftBank Group",    "JP"),
    ("8306.T", "MUFG",              "JP"),
    ("^N225",  "Nikkei 225",        "JP"),
    ("^GSPC",  "S&P 500",           "US"),
]

RANGE = "2y"       # how much history to pull
INTERVAL = "1d"    # daily bars
OUT_DIR = Path(__file__).resolve().parent.parent / "apps" / "data-copilot" / "data"
CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={range}&interval={interval}"


def fetch_one(symbol: str, retries: int = 3) -> dict:
    url = CHART_URL.format(symbol=urllib.parse.quote(symbol), range=RANGE, interval=INTERVAL)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (data-copilot cron)"})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as err:
            last_err = err
            time.sleep(2 * (attempt + 1))  # linear backoff — Yahoo throttles bursts
    raise RuntimeError(f"failed to fetch {symbol}: {last_err}")


def to_rows(payload: dict, name: str, market: str) -> pd.DataFrame:
    """Flatten one chart response into tidy rows: one (date, ticker) per line."""
    result = payload["chart"]["result"][0]
    meta = result["meta"]
    ts = result["timestamp"]
    q = result["indicators"]["quote"][0]
    adj = result["indicators"].get("adjclose", [{}])[0].get("adjclose", [None] * len(ts))

    df = pd.DataFrame(
        {
            "date": pd.to_datetime(ts, unit="s", utc=True).tz_convert(None).normalize(),
            "ticker": meta["symbol"],
            "name": name,
            "market": market,
            "currency": meta.get("currency"),
            "open": q["open"],
            "high": q["high"],
            "low": q["low"],
            "close": q["close"],
            "adj_close": adj,
            "volume": q["volume"],
        }
    )
    # Drop rows where the market was closed / Yahoo returned a null bar.
    return df.dropna(subset=["close"])


def main() -> int:
    frames: list[pd.DataFrame] = []
    failed: list[str] = []
    for symbol, name, market in TICKERS:
        try:
            frames.append(to_rows(fetch_one(symbol), name, market))
            print(f"  ok   {symbol:8} {name}")
        except Exception as err:  # keep going — one bad ticker shouldn't kill the run
            failed.append(symbol)
            print(f"  FAIL {symbol:8} {err}", file=sys.stderr)
        time.sleep(0.5)

    if not frames:
        print("no data fetched — aborting", file=sys.stderr)
        return 1

    data = pd.concat(frames, ignore_index=True).sort_values(["ticker", "date"])
    data["date"] = data["date"].dt.date          # store as DATE, not midnight TIMESTAMP
    data["volume"] = data["volume"].astype("Int64")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data.to_parquet(OUT_DIR / "stocks.parquet", index=False, compression="zstd")

    meta = {
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Yahoo Finance chart API (public, keyless)",
        "range": RANGE,
        "interval": INTERVAL,
        "row_count": int(len(data)),
        "date_min": data["date"].min().strftime("%Y-%m-%d"),
        "date_max": data["date"].max().strftime("%Y-%m-%d"),
        "tickers": [
            {"ticker": t, "name": n, "market": m}
            for (t, n, m) in TICKERS if t not in failed
        ],
        "failed": failed,
    }
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2))

    print(f"\nwrote {len(data):,} rows across {len(meta['tickers'])} tickers "
          f"({meta['date_min']} → {meta['date_max']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
