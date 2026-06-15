"""Build full dashboard payloads from analysis primitives."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pandas as pd

from analysis import (
    AnalogEvent,
    StrategyResult,
    compute_analog_events,
    compute_cp_at,
    compute_cp_for_side,
    compute_strategy_grid,
    load_config,
    rank_strategies,
    resolve_analysis_date,
    smoothed_cp,
)
from smoothing_config import (
    SmoothingContext,
    build_smoothing_context,
    default_smoothing_params,
    resolve_smoothing_m_r,
)
from cache import TTLCache
from data_loader import load_bitcoin_data
from serializers import analog_to_dict, strategy_to_dict

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "pred_info.yaml"

_df_cache: pd.DataFrame | None = None
_config_cache: dict | None = None
_ma_cache: dict[int, np.ndarray] = {}
_contour_base_cache = TTLCache(maxsize=32, ttl_seconds=3600)


def get_config() -> dict:
    global _config_cache
    if _config_cache is None:
        _config_cache = load_config(CONFIG_PATH)
    return _config_cache


def get_dataframe(*, auto_update: bool = True) -> pd.DataFrame:
    global _df_cache
    if _df_cache is None:
        _df_cache = load_bitcoin_data(auto_update=auto_update)
    return _df_cache


def invalidate_data_cache() -> None:
    global _df_cache
    _df_cache = None
    _ma_cache.clear()
    _contour_base_cache.clear()


def _ma_array(prices: pd.Series, H: int) -> np.ndarray:
    cached = _ma_cache.get(H)
    if cached is not None:
        return cached
    cached = np.asarray(prices.rolling(window=H).mean(), dtype=np.float64)
    _ma_cache[H] = cached
    return cached


def warm_ma_cache(H_values: list[int]) -> None:
    """Precompute rolling MAs used by contour and config grid."""
    prices = get_dataframe(auto_update=False)["Price"]
    for H in H_values:
        _ma_array(prices, H)


def _smoothing_payload(
    defaults: dict[str, float], m: float, r: float
) -> dict[str, float]:
    return {
        **defaults,
        "m": m,
        "r": r,
    }


def _cp_for_all_t(
    price_arr: np.ndarray,
    valid_base: np.ndarray,
    T_values: list[int],
    side: str,
) -> tuple[list[float | None], list[int | None], list[int | None]]:
    """CP for every T at fixed H; vectorized across T for each analog index."""
    n = len(price_arr)
    analog_idx = np.flatnonzero(valid_base)
    T_arr = np.asarray(T_values, dtype=np.int64)
    n_t = len(T_arr)
    hits_arr = np.zeros(n_t, dtype=np.int64)
    occ_arr = np.zeros(n_t, dtype=np.int64)
    compare_gt = side == "long"

    for i in analog_idx:
        limit = n - int(i)
        valid_t = T_arr < limit
        if not np.any(valid_t):
            continue
        ts = T_arr[valid_t]
        future = price_arr[i + ts]
        current = price_arr[i]
        if compare_gt:
            hit = future > current
        else:
            hit = future < current
        hits_arr[valid_t] += hit.astype(np.int64)
        occ_arr[valid_t] += 1

    cp_row: list[float | None] = []
    n_row: list[int | None] = []
    hits_row: list[int | None] = []
    for j, t in enumerate(T_values):
        if t >= n:
            cp_row.append(None)
            n_row.append(None)
            hits_row.append(None)
            continue
        occurrences = int(occ_arr[j])
        if occurrences == 0:
            cp_row.append(0.0)
            n_row.append(0)
            hits_row.append(0)
            continue
        hits = int(hits_arr[j])
        cp_row.append(round(hits / occurrences, 4))
        n_row.append(occurrences)
        hits_row.append(hits)
    return cp_row, n_row, hits_row


def _contour_h_row(
    H: int,
    price_arr: np.ndarray,
    ma: np.ndarray,
    history_mask: np.ndarray,
    idx: int,
    k_wiggle: float,
    T_values: list[int],
) -> tuple[list[float | None], list[int | None], list[int | None], list[str | None]]:
    """One H slice of the contour grid (safe for parallel execution after MA precompute)."""
    n_t = len(T_values)
    empty = ([None] * n_t, [None] * n_t, [None] * n_t, [None] * n_t)
    if np.isnan(ma[idx]):
        return empty

    price_today = price_arr[idx]
    ma_today = ma[idx]
    if price_today < ma_today:
        side: str | None = "long"
    elif price_today > ma_today:
        side = "short"
    else:
        side = "neutral"

    if side is None or side == "neutral":
        return ([None] * n_t, [None] * n_t, [None] * n_t, [side] * n_t)

    k_series = price_arr / ma
    k_today = k_series[idx]
    valid_base = (
        history_mask & ~np.isnan(ma) & (np.abs(k_series - k_today) <= k_wiggle)
    )
    if side == "long":
        valid_base &= price_arr < ma
    else:
        valid_base &= price_arr > ma

    cp_row, n_row, hits_row = _cp_for_all_t(price_arr, valid_base, T_values, side)
    return cp_row, n_row, hits_row, [side] * n_t


def meta_payload() -> dict:
    config = get_config()
    df = get_dataframe()
    matching = config["matching"]
    return {
        "date_min": df.index.min().strftime("%Y-%m-%d"),
        "date_max": df.index.max().strftime("%Y-%m-%d"),
        "defaults": {
            "H": 200,
            "T": 90,
            "k_wiggle": float(matching["k_wiggle"]),
        },
        "grid": {
            "H_days": config["timeframes"]["H_days"],
            "T_days": config["timeframes"]["T_days"],
        },
        "k_wiggle_sweep": {
            "min": float(matching["k_wiggle_sweep_min"]),
            "max": float(matching["k_wiggle_sweep_max"]),
            "points": 80,
        },
    }


def _price_context(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_values: list[int],
) -> dict:
    """Columnar price series with precomputed MAs for every config H."""
    prices = df["Price"]
    dates = df.index.strftime("%Y-%m-%d").tolist()
    price = prices.round(2).tolist()
    ma: dict[str, list[float | None]] = {}
    for H in H_values:
        series = _ma_array(prices, H)
        ma[str(H)] = [
            round(float(value), 2) if not np.isnan(value) else None
            for value in series
        ]

    return {
        "dates": dates,
        "price": price,
        "ma": ma,
        "ma_windows": H_values,
        "analysis_date": analysis_date.strftime("%Y-%m-%d"),
    }


def _side_for_h(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
) -> str | None:
    prices = df["Price"]
    ma = prices.rolling(window=H).mean()
    if analysis_date not in ma.index or pd.isna(ma.loc[analysis_date]):
        return None
    price_today = float(prices.loc[analysis_date])
    ma_today = float(ma.loc[analysis_date])
    if price_today < ma_today:
        return "long"
    if price_today > ma_today:
        return "short"
    return "neutral"


def _find_boundary_h(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_min: int,
    H_max: int,
) -> list[float]:
    """H values where price crosses MA(H) on the analysis date."""
    prices = df["Price"]
    idx = df.index.get_loc(analysis_date)
    if isinstance(idx, slice):
        idx = idx.stop - 1
    price_today = float(prices.iloc[idx])

    arr = np.asarray(prices.iloc[: idx + 1], dtype=np.float64)
    cs = np.concatenate([[0.0], np.cumsum(arr)])
    end = idx + 1
    H = np.arange(H_min, H_max + 1, dtype=np.int64)
    start = end - H
    valid = start >= 0
    ma = np.full(len(H), np.nan, dtype=np.float64)
    ma[valid] = (cs[end] - cs[start[valid]]) / H[valid]

    diff = price_today - ma
    valid_diff = valid & ~np.isnan(diff)
    H_valid = H[valid_diff]
    diff_valid = diff[valid_diff]

    boundaries: list[float] = []
    for i in range(1, len(diff_valid)):
        d0, d1 = diff_valid[i - 1], diff_valid[i]
        if d0 * d1 < 0:
            h0, h1 = float(H_valid[i - 1]), float(H_valid[i])
            span = abs(d0) + abs(d1)
            if span > 0:
                boundaries.append(round(h0 + abs(d0) / span, 2))
    return boundaries


def _compute_contour_base(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_min: int,
    H_max: int,
    T_min: int,
    T_max: int,
    step: int,
    k_wiggle: float,
) -> dict:
    cache_key = (
        analysis_date.strftime("%Y-%m-%d"),
        k_wiggle,
        H_min,
        H_max,
        T_min,
        T_max,
        step,
    )
    cached = _contour_base_cache.get(cache_key)
    if cached is not None:
        return cached

    prices = df["Price"]
    price_arr = np.asarray(prices, dtype=np.float64)
    history_mask = np.asarray(df.index < analysis_date)
    idx = df.index.get_loc(analysis_date)
    if isinstance(idx, slice):
        idx = idx.stop - 1

    H_values = list(range(H_min, H_max + 1, step))
    T_values = list(range(T_min, T_max + 1, step))
    ma_by_h = {H: _ma_array(prices, H) for H in H_values}

    def _row(H: int) -> tuple[
        list[float | None], list[int | None], list[int | None], list[str | None]
    ]:
        return _contour_h_row(
            H,
            price_arr,
            ma_by_h[H],
            history_mask,
            idx,
            k_wiggle,
            T_values,
        )

    with ThreadPoolExecutor(max_workers=min(8, len(H_values))) as pool:
        rows = list(pool.map(_row, H_values))

    cp_matrix = [r[0] for r in rows]
    n_matrix = [r[1] for r in rows]
    hits_matrix = [r[2] for r in rows]
    side_rows = [r[3] for r in rows]

    flat_cp = [v for row in cp_matrix for v in row if v is not None]
    seen_h: set[int] = set()
    b_counts: list[int] = []
    for hi, H in enumerate(H_values):
        if H in seen_h:
            continue
        row_n = n_matrix[hi]
        sample = next((v for v in row_n if v is not None and v > 0), None)
        if sample is not None:
            seen_h.add(H)
            b_counts.append(int(sample))

    payload = {
        "H_values": H_values,
        "T_values": T_values,
        "cp": cp_matrix,
        "occurrences": n_matrix,
        "hits": hits_matrix,
        "sides": side_rows,
        "boundary_h": _find_boundary_h(df, analysis_date, H_min, H_max),
        "flat_cp": flat_cp,
        "b_counts": b_counts,
    }
    _contour_base_cache.set(cache_key, payload)
    return payload


def _contour_payload(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_min: int,
    H_max: int,
    T_min: int,
    T_max: int,
    step: int,
    k_wiggle: float,
    primary_h: int,
    primary_t: int,
    smoothing_m: float | None = None,
    smoothing_r: float | None = None,
    smoothing_defaults: dict[str, float] | None = None,
) -> dict:
    base = _compute_contour_base(
        df, analysis_date, H_min, H_max, T_min, T_max, step, k_wiggle
    )
    H_values = base["H_values"]
    T_values = base["T_values"]
    cp_matrix = base["cp"]
    n_matrix = base["occurrences"]
    hits_matrix = base["hits"]
    side_rows = base["sides"]
    flat_cp = base["flat_cp"]
    b_counts = base["b_counts"]

    if smoothing_defaults is None:
        defaults = default_smoothing_params(
            SmoothingContext(b_counts=b_counts, cp_values=flat_cp)
        )
    else:
        defaults = smoothing_defaults
    m_value, r_value = resolve_smoothing_m_r(smoothing_m, smoothing_r, defaults)

    smoothed_matrix: list[list[float | None]] = []
    for hi, cp_row in enumerate(cp_matrix):
        hits_row = hits_matrix[hi]
        n_row = n_matrix[hi]
        smoothed_row: list[float | None] = []
        for j, cp_val in enumerate(cp_row):
            if cp_val is None or hits_row[j] is None or n_row[j] is None:
                smoothed_row.append(None)
                continue
            smoothed_row.append(
                round(smoothed_cp(hits_row[j], n_row[j], m_value, r_value), 4)
            )
        smoothed_matrix.append(smoothed_row)

    highlight_stats: dict | None = None
    hi_side = _side_for_h(df, analysis_date, primary_h)
    if hi_side and hi_side != "neutral":
        hi_row = compute_cp_for_side(
            df, analysis_date, primary_h, primary_t, k_wiggle, hi_side
        )
        if hi_row is not None:
            highlight_stats = {
                "H": primary_h,
                "T": primary_t,
                "side": hi_side,
                "cp": round(hi_row.cp, 4),
                "smoothed_cp": round(
                    smoothed_cp(
                        hi_row.hits,
                        hi_row.occurrences,
                        m_value,
                        r_value,
                    ),
                    4,
                ),
                "hits": hi_row.hits,
                "occurrences": hi_row.occurrences,
                "k_today": round(hi_row.k_today, 4),
                "forward_resolved": hi_row.forward_resolved,
            }

    return {
        "H_values": H_values,
        "T_values": T_values,
        "cp": cp_matrix,
        "smoothed_cp": smoothed_matrix,
        "occurrences": n_matrix,
        "sides": side_rows,
        "boundary_h": base["boundary_h"],
        "highlight": {"H": primary_h, "T": primary_t},
        "highlight_stats": highlight_stats,
        "smoothing": _smoothing_payload(defaults, m_value, r_value),
    }


def _k_distribution_payload(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    k_wiggle: float,
) -> dict:
    prices = df["Price"]
    ma = prices.rolling(window=H).mean()
    k_series = prices / ma
    if analysis_date not in k_series.index or pd.isna(k_series.loc[analysis_date]):
        raise ValueError(f"k undefined for H={H} on analysis date.")

    history_mask = df.index < analysis_date
    valid = history_mask & ma.notna() & k_series.notna()
    k_hist = k_series[valid]
    k_today = float(k_series.loc[analysis_date])

    return {
        "H": H,
        "k_today": round(k_today, 4),
        "k_wiggle": k_wiggle,
        "k_values": [round(float(v), 4) for v in k_hist.values],
        "within_wiggle": int((np.abs(k_hist - k_today) <= k_wiggle).sum()),
        "total_history": int(valid.sum()),
    }


def analyze_payload(
    date_text: str | None,
    H: int,
    T: int,
    k_wiggle: float,
    min_occurrences: int,
    top_n: int,
    smoothing_m: float | None = None,
    smoothing_r: float | None = None,
) -> dict:
    config = get_config()
    df = get_dataframe()
    H_values = config["timeframes"]["H_days"]
    T_values = config["timeframes"]["T_days"]
    if date_text is None:
        date_text = df.index.max().strftime("%Y-%m-%d")

    requested_date = date_text
    analysis_date = resolve_analysis_date(df, date_text)
    resolved_date = analysis_date.strftime("%Y-%m-%d")

    primary_result, analog_events = compute_analog_events(
        df, analysis_date, H, T, k_wiggle
    )
    if primary_result is None:
        raise ValueError(
            "Neutral side (price equals MA) — pick another date or H."
        )

    all_results = compute_strategy_grid(
        df, analysis_date, H_values, T_values, k_wiggle
    )
    defaults = default_smoothing_params(build_smoothing_context(all_results))
    m_value, r_value = resolve_smoothing_m_r(smoothing_m, smoothing_r, defaults)

    long_rows = [r for r in all_results if r.side == "long"]
    short_rows = [r for r in all_results if r.side == "short"]
    top_long = rank_strategies(long_rows, min_occurrences, top_n)
    top_short = rank_strategies(short_rows, min_occurrences, top_n)

    top_strategies = sorted(
        [r for r in all_results if r.H == H and r.occurrences > 0],
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )
    H_min, H_max = min(H_values), max(H_values)
    T_min, T_max = min(T_values), max(T_values)
    contour_step = int(config.get("output", {}).get("contour_step", 3))

    return {
        "analysis_date": requested_date,
        "resolved_date": resolved_date,
        "side": primary_result.side,
        "k_today": round(primary_result.k_today, 4),
        "relation": primary_result.relation,
        "price_today": round(float(df.loc[analysis_date, "Price"]), 2),
        "primary": {
            "H": H,
            "T": T,
            "cp": round(primary_result.cp, 4),
            "smoothed_cp": round(
                smoothed_cp(
                    primary_result.hits,
                    primary_result.occurrences,
                    m_value,
                    r_value,
                ),
                4,
            ),
            "hits": primary_result.hits,
            "occurrences": primary_result.occurrences,
            "forward_resolved": primary_result.forward_resolved,
        },
        "smoothing": _smoothing_payload(defaults, m_value, r_value),
        "price_context": _price_context(df, analysis_date, H_values),
        "analog_events": [analog_to_dict(e) for e in analog_events],
        "contour": _contour_payload(
            df,
            analysis_date,
            H_min,
            H_max,
            T_min,
            T_max,
            contour_step,
            k_wiggle,
            H,
            T,
            smoothing_m=m_value,
            smoothing_r=r_value,
            smoothing_defaults=defaults,
        ),
        "k_distribution": _k_distribution_payload(
            df, analysis_date, H, k_wiggle
        ),
        "top_long": [
            strategy_to_dict(
                r,
                smoothed_cp=smoothed_cp(r.hits, r.occurrences, m_value, r_value),
            )
            for r in top_long
        ],
        "top_short": [
            strategy_to_dict(
                r,
                smoothed_cp=smoothed_cp(r.hits, r.occurrences, m_value, r_value),
            )
            for r in top_short
        ],
        "top_strategies": [
            strategy_to_dict(
                r,
                smoothed_cp=smoothed_cp(r.hits, r.occurrences, m_value, r_value),
            )
            for r in top_strategies
        ],
    }


def landing_payload(
    date_text: str | None = None,
    H: int | None = None,
    k_wiggle: float | None = None,
) -> dict:
    config = get_config()
    df = get_dataframe()
    H_values = config["timeframes"]["H_days"]
    T_values = config["timeframes"]["T_days"]
    if k_wiggle is None:
        k_wiggle = float(config["matching"]["k_wiggle"])

    if date_text is None:
        date_text = df.index.max().strftime("%Y-%m-%d")

    selected_h_values = [H] if H is not None else H_values
    if H is not None and H not in H_values:
        selected_h_values = [H]

    analysis_date = resolve_analysis_date(df, date_text)
    price_today = round(float(df.loc[analysis_date, "Price"]), 2)
    prices = df["Price"]

    grid_results = compute_strategy_grid(
        df, analysis_date, H_values, T_values, k_wiggle
    )
    defaults = default_smoothing_params(build_smoothing_context(grid_results))
    m_value, r_value = resolve_smoothing_m_r(None, None, defaults)

    by_h: list[dict] = []
    for H in selected_h_values:
        ma = prices.rolling(window=H).mean()
        if analysis_date not in ma.index or pd.isna(ma.loc[analysis_date]):
            continue

        k_today = round(float(prices.loc[analysis_date] / ma.loc[analysis_date]), 4)
        ma_today = round(float(ma.loc[analysis_date]), 2)
        relation = "below" if price_today < ma_today else "above" if price_today > ma_today else "at"

        by_t: list[dict] = []
        for T in T_values:
            long_row = compute_cp_for_side(df, analysis_date, H, T, k_wiggle, "long")
            short_row = compute_cp_for_side(df, analysis_date, H, T, k_wiggle, "short")
            long_hits = long_row.hits if long_row else 0
            long_occ = long_row.occurrences if long_row else 0
            short_hits = short_row.hits if short_row else 0
            short_occ = short_row.occurrences if short_row else 0
            by_t.append(
                {
                    "T": T,
                    "long": {
                        "cp": round(long_row.cp, 4) if long_row else 0.0,
                        "smoothed_cp": round(
                            smoothed_cp(long_hits, long_occ, m_value, r_value), 4
                        ),
                        "hits": long_hits,
                        "occurrences": long_occ,
                        "forward_resolved": long_row.forward_resolved if long_row else False,
                    },
                    "short": {
                        "cp": round(short_row.cp, 4) if short_row else 0.0,
                        "smoothed_cp": round(
                            smoothed_cp(short_hits, short_occ, m_value, r_value), 4
                        ),
                        "hits": short_hits,
                        "occurrences": short_occ,
                        "forward_resolved": short_row.forward_resolved if short_row else False,
                    },
                }
            )

        by_h.append(
            {
                "H": H,
                "k": k_today,
                "ma": ma_today,
                "relation": relation,
                "by_T": by_t,
            }
        )

    rank_h = H if H is not None else 200
    results_for_h: list[StrategyResult] = []
    for T in T_values:
        for side in ("long", "short"):
            row = compute_cp_for_side(
                df, analysis_date, rank_h, T, k_wiggle, side
            )
            if row is not None and row.occurrences > 0:
                results_for_h.append(row)
    top_strategies = sorted(
        results_for_h,
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )

    return {
        "analysis_date": date_text,
        "resolved_date": analysis_date.strftime("%Y-%m-%d"),
        "price_today": price_today,
        "k_wiggle": k_wiggle,
        "selected_H": H if H is not None else (by_h[0]["H"] if by_h else None),
        "H_values": H_values,
        "T_values": T_values,
        "by_H": by_h,
        "smoothing": _smoothing_payload(defaults, m_value, r_value),
        "top_strategies": [strategy_to_dict(r) for r in top_strategies],
    }


PREVIEW_H_VALUES = [65, 200, 365]
PREVIEW_T = 90
PREVIEW_CHART_H = 200
PREVIEW_DAYS = 92


def _contour_snippet(
    contour: dict,
    center_h: int,
    center_t: int,
    h_span: int = 5,
    t_span: int = 6,
) -> dict:
    h_vals = contour["H_values"]
    t_vals = contour["T_values"]
    hi = min(range(len(h_vals)), key=lambda i: abs(h_vals[i] - center_h))
    ti = min(range(len(t_vals)), key=lambda i: abs(t_vals[i] - center_t))
    h0 = max(0, hi - h_span)
    h1 = min(len(h_vals), hi + h_span + 1)
    t0 = max(0, ti - t_span)
    t1 = min(len(t_vals), ti + t_span + 1)
    cp_matrix = contour["cp"]
    smoothed_matrix = contour.get("smoothed_cp")
    snippet = {
        "H_values": h_vals[h0:h1],
        "T_values": t_vals[t0:t1],
        "cp": [row[t0:t1] for row in cp_matrix[h0:h1]],
        "highlight": {"H": center_h, "T": center_t},
    }
    if smoothed_matrix is not None:
        snippet["smoothed_cp"] = [row[t0:t1] for row in smoothed_matrix[h0:h1]]
    return snippet


def landing_preview_payload(
    date_text: str | None = None,
    k_wiggle: float | None = None,
) -> dict:
    config = get_config()
    df = get_dataframe()
    if k_wiggle is None:
        k_wiggle = float(config["matching"]["k_wiggle"])
    if date_text is None:
        date_text = df.index.max().strftime("%Y-%m-%d")

    analysis_date = resolve_analysis_date(df, date_text)
    prices = df["Price"]
    price_today = round(float(prices.loc[analysis_date]), 2)

    end_loc = df.index.get_loc(analysis_date)
    if isinstance(end_loc, slice):
        end_loc = end_loc.stop - 1
    start_loc = max(0, int(end_loc) - PREVIEW_DAYS + 1)
    slice_df = df.iloc[start_loc : int(end_loc) + 1]
    ma_series = prices.rolling(window=PREVIEW_CHART_H).mean()
    ma_slice = ma_series.iloc[start_loc : int(end_loc) + 1]

    chart_h = PREVIEW_CHART_H
    ma_today_val = ma_series.loc[analysis_date]
    relation = (
        "below"
        if price_today < float(ma_today_val)
        else "above"
        if price_today > float(ma_today_val)
        else "at"
    )

    ma_bars: list[dict] = []
    for h in PREVIEW_H_VALUES:
        side = _side_for_h(df, analysis_date, h)
        if side is None or side == "neutral":
            continue
        row = compute_cp_for_side(df, analysis_date, h, PREVIEW_T, k_wiggle, side)
        h_relation = "below" if side == "long" else "above"
        hits = row.hits if row else 0
        occ = row.occurrences if row else 0
        ma_bars.append(
            {
                "H": h,
                "T": PREVIEW_T,
                "side": side,
                "relation": h_relation,
                "cp": round(row.cp, 4) if row else 0.0,
                "hits": hits,
                "occurrences": occ,
            }
        )

    analyze = analyze_payload(
        date_text=date_text,
        H=PREVIEW_CHART_H,
        T=PREVIEW_T,
        k_wiggle=k_wiggle,
        min_occurrences=int(config["filtering"]["min_occurrences"]),
        top_n=int(config["filtering"]["top_n"]),
        smoothing_m=None,
        smoothing_r=None,
    )
    smooth_m = float(analyze["smoothing"]["m"])
    smooth_r = float(analyze["smoothing"]["r"])
    for bar in ma_bars:
        bar["smoothed_cp"] = round(
            smoothed_cp(bar["hits"], bar["occurrences"], smooth_m, smooth_r), 4
        )

    _, analog_events = compute_analog_events(
        df, analysis_date, PREVIEW_CHART_H, PREVIEW_T, k_wiggle
    )

    return {
        "analysis_date": date_text,
        "resolved_date": analysis_date.strftime("%Y-%m-%d"),
        "price_today": price_today,
        "k_wiggle": k_wiggle,
        "chart_H": chart_h,
        "default_H": 200,
        "default_T": PREVIEW_T,
        "relation": relation,
        "price_preview": {
            "dates": slice_df.index.strftime("%Y-%m-%d").tolist(),
            "price": slice_df["Price"].round(2).tolist(),
            "ma": [
                round(float(v), 2) if not pd.isna(v) else None
                for v in ma_slice.values
            ],
        },
        "ma_bars": ma_bars,
        "contour_snippet": _contour_snippet(
            analyze["contour"], PREVIEW_CHART_H, PREVIEW_T
        ),
        "primary": analyze["primary"],
        "smoothing": analyze["smoothing"],
        "analog_dates": [e.date for e in analog_events[:12]],
    }


def strategy_detail_payload(
    date_text: str,
    H: int,
    T: int,
    k_wiggle: float,
    side: str | None = None,
) -> dict:
    df = get_dataframe()
    analysis_date = resolve_analysis_date(df, date_text)
    result, events = compute_analog_events(df, analysis_date, H, T, k_wiggle)
    if result is None:
        raise ValueError("No analysis for neutral side on this date/H.")
    if side is not None and result.side != side:
        raise ValueError(f"Strategy side is {result.side}, not {side}.")

    hit_returns = [e.return_pct for e in events if e.hit]
    miss_returns = [e.return_pct for e in events if not e.hit]

    def _stats(values: list[float]) -> dict | None:
        if not values:
            return None
        return {
            "mean": round(sum(values) / len(values), 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
        }

    return {
        "analysis_date": date_text,
        "resolved_date": analysis_date.strftime("%Y-%m-%d"),
        "summary": strategy_to_dict(result),
        "analog_events": [analog_to_dict(e) for e in events],
        "forward_unresolved": not result.forward_resolved,
        "stats": {
            "hits": _stats(hit_returns),
            "misses": _stats(miss_returns),
        },
    }
