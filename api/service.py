"""Build full dashboard payloads from analysis primitives."""

from __future__ import annotations

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
)
from data_loader import load_bitcoin_data
from serializers import analog_to_dict, strategy_to_dict

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "pred_info.yaml"

_df_cache: pd.DataFrame | None = None
_config_cache: dict | None = None


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
    """Full CSV price series with precomputed MAs for every config H."""
    series = []
    ma_by_h = {H: df["Price"].rolling(window=H).mean() for H in H_values}
    for date in df.index:
        point: dict = {
            "date": date.strftime("%Y-%m-%d"),
            "price": round(float(df.loc[date, "Price"]), 2),
        }
        for H in H_values:
            val = ma_by_h[H].loc[date]
            if pd.notna(val):
                point[f"ma_{H}"] = round(float(val), 2)
        series.append(point)

    return {
        "series": series,
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
    price_today = float(prices.loc[analysis_date])
    boundaries: list[float] = []
    prev_diff: float | None = None
    prev_h: int | None = None

    for H in range(H_min, H_max + 1):
        ma = prices.rolling(window=H).mean()
        if analysis_date not in ma.index:
            continue
        ma_val = ma.loc[analysis_date]
        if pd.isna(ma_val):
            continue
        diff = price_today - float(ma_val)
        if prev_diff is not None and prev_h is not None and prev_diff * diff < 0:
            span = abs(prev_diff) + abs(diff)
            if span > 0:
                boundaries.append(prev_h + abs(prev_diff) / span)
        prev_diff = diff
        prev_h = H

    return [round(value, 2) for value in boundaries]


def _cp_for_side_cached(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    T: int,
    k_wiggle: float,
    side: str,
    *,
    prices: pd.Series,
    ma: pd.Series,
    k_series: pd.Series,
    k_today: float,
    relation: str,
) -> StrategyResult | None:
    """Like compute_cp_for_side but reuses precomputed MA/k for one H."""
    last_date = df.index.max()
    history_mask = df.index < analysis_date
    k_delta = np.abs(k_series - k_today)
    k_match = k_delta <= k_wiggle
    valid_base = history_mask & ma.notna() & k_match
    analog_mask = valid_base & _side_mask_cached(prices, ma, side)
    forward_resolved = (analysis_date + pd.Timedelta(days=T)) <= last_date
    future_price = prices.shift(-T)
    valid = analog_mask & future_price.notna()
    occurrences = int(valid.sum())
    if occurrences == 0:
        return StrategyResult(
            H=H,
            T=T,
            side=side,
            k_today=k_today,
            relation=relation,
            hits=0,
            occurrences=0,
            cp=0.0,
            forward_resolved=forward_resolved,
        )
    if side == "long":
        hits = int((valid & (future_price > prices)).sum())
    else:
        hits = int((valid & (future_price < prices)).sum())
    return StrategyResult(
        H=H,
        T=T,
        side=side,
        k_today=k_today,
        relation=relation,
        hits=hits,
        occurrences=occurrences,
        cp=hits / occurrences,
        forward_resolved=forward_resolved,
    )


def _side_mask_cached(prices: pd.Series, ma: pd.Series, side: str) -> pd.Series:
    if side == "long":
        return prices < ma
    if side == "short":
        return prices > ma
    raise ValueError(f"Unknown side: {side}")


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
) -> dict:
    prices = df["Price"]
    H_values = list(range(H_min, H_max + 1, step))
    T_values = list(range(T_min, T_max + 1, step))
    cp_matrix: list[list[float | None]] = []
    n_matrix: list[list[int | None]] = []
    side_rows: list[list[str | None]] = []

    for H in H_values:
        ma = prices.rolling(window=H).mean()
        if analysis_date not in ma.index or pd.isna(ma.loc[analysis_date]):
            cp_matrix.append([None] * len(T_values))
            n_matrix.append([None] * len(T_values))
            side_rows.append([None] * len(T_values))
            continue

        price_today = float(prices.loc[analysis_date])
        ma_today = float(ma.loc[analysis_date])
        if price_today < ma_today:
            side: str | None = "long"
            relation = "below"
        elif price_today > ma_today:
            side = "short"
            relation = "above"
        else:
            side = "neutral"
            relation = "at"

        k_series = prices / ma
        k_today = float(k_series.loc[analysis_date])

        cp_row: list[float | None] = []
        n_row: list[int | None] = []
        side_row: list[str | None] = []
        for T in T_values:
            if side is None or side == "neutral":
                cp_row.append(None)
                n_row.append(None)
                side_row.append(side)
                continue
            row = _cp_for_side_cached(
                df,
                analysis_date,
                H,
                T,
                k_wiggle,
                side,
                prices=prices,
                ma=ma,
                k_series=k_series,
                k_today=k_today,
                relation=relation,
            )
            if row is None:
                cp_row.append(None)
                n_row.append(0)
            else:
                cp_row.append(round(row.cp, 4))
                n_row.append(row.occurrences)
            side_row.append(side)
        cp_matrix.append(cp_row)
        n_matrix.append(n_row)
        side_rows.append(side_row)

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
                "hits": hi_row.hits,
                "occurrences": hi_row.occurrences,
                "k_today": round(hi_row.k_today, 4),
                "forward_resolved": hi_row.forward_resolved,
            }

    return {
        "H_values": H_values,
        "T_values": T_values,
        "cp": cp_matrix,
        "occurrences": n_matrix,
        "sides": side_rows,
        "boundary_h": _find_boundary_h(df, analysis_date, H_min, H_max),
        "highlight": {"H": primary_h, "T": primary_t},
        "highlight_stats": highlight_stats,
    }


def _k_distribution_payload(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    k_wiggle: float,
    bins: int = 50,
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

    counts, edges = np.histogram(k_hist.values, bins=bins)
    histogram = [
        {
            "start": round(float(edges[i]), 4),
            "end": round(float(edges[i + 1]), 4),
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]

    return {
        "H": H,
        "k_today": round(k_today, 4),
        "k_wiggle": k_wiggle,
        "histogram": histogram,
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
    long_rows = [r for r in all_results if r.side == "long"]
    short_rows = [r for r in all_results if r.side == "short"]
    top_long = rank_strategies(long_rows, min_occurrences, top_n)
    top_short = rank_strategies(short_rows, min_occurrences, top_n)

    results_for_h: list[StrategyResult] = []
    for T in T_values:
        for side in ("long", "short"):
            row = compute_cp_for_side(df, analysis_date, H, T, k_wiggle, side)
            if row is not None and row.occurrences > 0:
                results_for_h.append(row)
    top_strategies = sorted(
        results_for_h,
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )
    H_min, H_max = min(H_values), max(H_values)
    T_min, T_max = min(T_values), max(T_values)
    contour_step = 5

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
            "hits": primary_result.hits,
            "occurrences": primary_result.occurrences,
            "forward_resolved": primary_result.forward_resolved,
        },
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
        ),
        "k_distribution": _k_distribution_payload(
            df, analysis_date, H, k_wiggle
        ),
        "top_long": [strategy_to_dict(r) for r in top_long],
        "top_short": [strategy_to_dict(r) for r in top_short],
        "top_strategies": [strategy_to_dict(r) for r in top_strategies],
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
            by_t.append(
                {
                    "T": T,
                    "long": {
                        "cp": round(long_row.cp, 4) if long_row else 0.0,
                        "hits": long_row.hits if long_row else 0,
                        "occurrences": long_row.occurrences if long_row else 0,
                        "forward_resolved": long_row.forward_resolved if long_row else False,
                    },
                    "short": {
                        "cp": round(short_row.cp, 4) if short_row else 0.0,
                        "hits": short_row.hits if short_row else 0,
                        "occurrences": short_row.occurrences if short_row else 0,
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
        "top_strategies": [strategy_to_dict(r) for r in top_strategies],
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
