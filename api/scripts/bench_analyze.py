"""Quick benchmark for analyze hot paths."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from analysis import compute_analog_events, compute_strategy_grid, resolve_analysis_date
from data_loader import load_bitcoin_data
from service import (
    _contour_payload,
    _find_boundary_h,
    _k_distribution_payload,
    _price_context,
    analyze_payload,
    get_config,
)

df = load_bitcoin_data(auto_update=False)
config = get_config()
H_values = config["timeframes"]["H_days"]
T_values = config["timeframes"]["T_days"]
analysis_date = resolve_analysis_date(df, df.index.max().strftime("%Y-%m-%d"))
H_min, H_max = min(H_values), max(H_values)
T_min, T_max = min(T_values), max(T_values)


def timed(label: str, fn):
    t0 = time.perf_counter()
    result = fn()
    dt = time.perf_counter() - t0
    extra = ""
    if isinstance(result, dict):
        extra = f", json {len(json.dumps(result)) / 1024:.0f} KB"
    print(f"{label}: {dt:.2f}s{extra}")
    return result


timed("find_boundary_h", lambda: _find_boundary_h(df, analysis_date, H_min, H_max))
timed("price_context", lambda: _price_context(df, analysis_date, H_values))
timed("contour step=3", lambda: _contour_payload(
    df, analysis_date, H_min, H_max, T_min, T_max, 3, 0.01, 200, 90
))
timed("strategy_grid", lambda: compute_strategy_grid(
    df, analysis_date, H_values, T_values, 0.01
))
timed("analog_events", lambda: compute_analog_events(df, analysis_date, 200, 90, 0.01))
timed("k_distribution", lambda: _k_distribution_payload(df, analysis_date, 200, 0.01))
timed("analyze_payload", lambda: analyze_payload(None, 200, 90, 0.01, 0, 10))
