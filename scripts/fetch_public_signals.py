#!/usr/bin/env python3
"""Fetch public earthquake, climate, and air-quality signals without API keys."""

from __future__ import annotations

import json
import math
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


OUT_DIR = Path(__file__).resolve().parent.parent / "apps" / "public-signals" / "data"
LOOKBACK_DAYS = 365
TODAY = datetime.now(timezone.utc).date()
END_DATE = TODAY - timedelta(days=1)
START_DATE = END_DATE - timedelta(days=LOOKBACK_DAYS - 1)

CITIES = [
    {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503, "timezone": "Asia/Tokyo"},
    {"city": "Seoul", "country": "South Korea", "lat": 37.5665, "lon": 126.9780, "timezone": "Asia/Seoul"},
    {"city": "Taipei", "country": "Taiwan", "lat": 25.0330, "lon": 121.5654, "timezone": "Asia/Taipei"},
    {"city": "Bangkok", "country": "Thailand", "lat": 13.7563, "lon": 100.5018, "timezone": "Asia/Bangkok"},
    {"city": "Singapore", "country": "Singapore", "lat": 1.3521, "lon": 103.8198, "timezone": "Asia/Singapore"},
    {"city": "Shanghai", "country": "China", "lat": 31.2304, "lon": 121.4737, "timezone": "Asia/Shanghai"},
]

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
WEATHER_URL = "https://archive-api.open-meteo.com/v1/archive"
AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


def fetch_json(url: str, params: dict[str, object], retries: int = 3) -> object:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{url}?{query}", headers={"User-Agent": "thangldw-public-signals/1.0"}
    )
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
            last_error = error
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"request failed after {retries} attempts: {last_error}")


def region_for(latitude: float, longitude: float) -> str:
    if 24 <= latitude <= 46 and 122 <= longitude <= 150:
        return "Japan"
    if 21 <= latitude <= 26.5 and 119 <= longitude <= 123.5:
        return "Taiwan"
    if -12 <= latitude <= 25 and 95 <= longitude <= 135:
        return "Southeast Asia"
    if 0 <= latitude <= 60 and 135 < longitude <= 180:
        return "Western Pacific"
    return "East Asia"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    value = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def fetch_earthquakes() -> tuple[list[dict], dict]:
    payload = fetch_json(
        USGS_URL,
        {
            "format": "geojson",
            "starttime": START_DATE.isoformat(),
            "endtime": TODAY.isoformat(),
            "minlatitude": -12,
            "maxlatitude": 60,
            "minlongitude": 95,
            "maxlongitude": 180,
            "minmagnitude": 3,
            "orderby": "time-asc",
            "limit": 20000,
        },
    )
    rows: list[dict] = []
    for feature in payload.get("features", []):
        props = feature.get("properties", {})
        coordinates = feature.get("geometry", {}).get("coordinates", [])
        if len(coordinates) < 3 or props.get("mag") is None or props.get("time") is None:
            continue
        longitude, latitude, depth = map(float, coordinates[:3])
        event_time = datetime.fromtimestamp(props["time"] / 1000, tz=timezone.utc)
        rows.append(
            {
                "id": feature.get("id"),
                "time": event_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "date": event_time.strftime("%Y-%m-%d"),
                "place": props.get("place") or "Unknown location",
                "region": region_for(latitude, longitude),
                "magnitude": round(float(props["mag"]), 1),
                "depth_km": round(depth, 1),
                "longitude": round(longitude, 4),
                "latitude": round(latitude, 4),
                "significance": int(props.get("sig") or 0),
                "felt": int(props.get("felt") or 0),
                "alert": props.get("alert"),
                "status": props.get("status") or "unknown",
                "tsunami": bool(props.get("tsunami")),
                "distance_tokyo_km": round(haversine_km(latitude, longitude, 35.6762, 139.6503)),
            }
        )

    region_counts = Counter(row["region"] for row in rows)
    latest = max((row["time"] for row in rows), default=None)
    meta = {
        "row_count": len(rows),
        "date_min": min((row["date"] for row in rows), default=None),
        "date_max": max((row["date"] for row in rows), default=None),
        "latest_event": latest,
        "max_magnitude": max((row["magnitude"] for row in rows), default=None),
        "reviewed_pct": round(100 * sum(row["status"] == "reviewed" for row in rows) / max(1, len(rows)), 1),
        "regions": [{"region": name, "rows": count} for name, count in sorted(region_counts.items())],
        "source": "USGS Earthquake Catalog (FDSN Event Web Service)",
        "source_url": "https://earthquake.usgs.gov/fdsnws/event/1/",
    }
    return rows, meta


def daily_air(hourly: dict) -> dict[str, dict]:
    grouped: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    times = hourly.get("time", [])
    for index, timestamp in enumerate(times):
        day = timestamp[:10]
        for field in ("pm2_5", "pm10", "us_aqi", "nitrogen_dioxide"):
            values = hourly.get(field, [])
            value = values[index] if index < len(values) else None
            if value is not None:
                grouped[day][field].append(float(value))
    output: dict[str, dict] = {}
    for day, fields in grouped.items():
        output[day] = {
            "pm2_5": round(sum(fields["pm2_5"]) / len(fields["pm2_5"]), 1) if fields["pm2_5"] else None,
            "pm10": round(sum(fields["pm10"]) / len(fields["pm10"]), 1) if fields["pm10"] else None,
            "aqi": round(max(fields["us_aqi"]), 1) if fields["us_aqi"] else None,
            "no2": round(sum(fields["nitrogen_dioxide"]) / len(fields["nitrogen_dioxide"]), 1) if fields["nitrogen_dioxide"] else None,
        }
    return output


def fetch_city(city: dict) -> tuple[list[dict], list[str]]:
    failures: list[str] = []
    weather = fetch_json(
        WEATHER_URL,
        {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "start_date": START_DATE.isoformat(),
            "end_date": END_DATE.isoformat(),
            "daily": "temperature_2m_mean,temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            "timezone": city["timezone"],
        },
    )
    try:
        air = fetch_json(
            AIR_URL,
            {
                "latitude": city["lat"],
                "longitude": city["lon"],
                "start_date": START_DATE.isoformat(),
                "end_date": END_DATE.isoformat(),
                "hourly": "pm2_5,pm10,us_aqi,nitrogen_dioxide",
                "timezone": city["timezone"],
                "domains": "cams_global",
            },
        )
        air_by_day = daily_air(air.get("hourly", {}))
    except Exception as error:
        failures.append(f"{city['city']} air quality: {error}")
        air_by_day = {}

    daily = weather.get("daily", {})
    rows: list[dict] = []
    for index, day in enumerate(daily.get("time", [])):
        air_values = air_by_day.get(day, {})
        row = {
            "date": day,
            "city": city["city"],
            "country": city["country"],
            "latitude": city["lat"],
            "longitude": city["lon"],
            "temperature_mean": value_at(daily, "temperature_2m_mean", index),
            "temperature_min": value_at(daily, "temperature_2m_min", index),
            "temperature_max": value_at(daily, "temperature_2m_max", index),
            "precipitation_mm": value_at(daily, "precipitation_sum", index),
            "wind_max_kmh": value_at(daily, "wind_speed_10m_max", index),
            **air_values,
        }
        rows.append(row)
    return rows, failures


def value_at(data: dict, field: str, index: int) -> float | None:
    values = data.get(field, [])
    value = values[index] if index < len(values) else None
    return round(float(value), 1) if value is not None else None


def fetch_climate() -> tuple[list[dict], dict]:
    rows: list[dict] = []
    failures: list[str] = []
    for city in CITIES:
        try:
            city_rows, city_failures = fetch_city(city)
            rows.extend(city_rows)
            failures.extend(city_failures)
            print(f"  ok   {city['city']}: {len(city_rows)} daily rows")
        except Exception as error:
            failures.append(f"{city['city']}: {error}")
            print(f"  FAIL {city['city']}: {error}", file=sys.stderr)
        time.sleep(0.3)

    coverage = []
    for city in CITIES:
        city_rows = [row for row in rows if row["city"] == city["city"]]
        air_rows = sum(row.get("pm2_5") is not None for row in city_rows)
        coverage.append(
            {
                "city": city["city"],
                "rows": len(city_rows),
                "air_rows": air_rows,
                "date_min": min((row["date"] for row in city_rows), default=None),
                "date_max": max((row["date"] for row in city_rows), default=None),
            }
        )
    meta = {
        "row_count": len(rows),
        "date_min": min((row["date"] for row in rows), default=None),
        "date_max": max((row["date"] for row in rows), default=None),
        "cities": CITIES,
        "coverage": coverage,
        "failed": failures,
        "source": "Open-Meteo Historical Weather and Air Quality APIs",
        "source_url": "https://open-meteo.com/",
    }
    return rows, meta


def main() -> int:
    started = time.monotonic()
    print("Fetching earthquakes…")
    earthquakes, earthquake_meta = fetch_earthquakes()
    print(f"  ok   {len(earthquakes)} earthquake events")
    print("Fetching city climate and air quality…")
    climate, climate_meta = fetch_climate()
    if not earthquakes or not climate:
        print("required public-signal dataset is empty", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "earthquakes.json").write_text(json.dumps(earthquakes, separators=(",", ":")))
    (OUT_DIR / "city-climate.json").write_text(json.dumps(climate, separators=(",", ":")))

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    duration = round(time.monotonic() - started, 1)
    meta = {
        "last_updated": now_iso,
        "duration_s": duration,
        "lookback_days": LOOKBACK_DAYS,
        "earthquakes": earthquake_meta,
        "climate": climate_meta,
    }
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2))

    print(f"Wrote {len(earthquakes)} earthquakes and {len(climate)} city-days in {duration}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
