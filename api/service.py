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
    top_unique_from_ranked,
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


def _curves_for_attr(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    fixed_attr: str,
    sweep_attr: str,
    fixed_values: list[int],
    sweep_range: range,
    k_wiggle: float,
    min_occurrences: int,
    primary_fixed: int,
) -> dict:
    curves = []
    for value in fixed_values:
        points = []
        for sweep_val in sweep_range:
            if fixed_attr == "H":
                H, T = value, sweep_val
            else:
                H, T = sweep_val, value
            row = compute_cp_at(df, analysis_date, H, T, k_wiggle)
            if row is None or row.occurrences < min_occurrences:
                continue
            point = {
                sweep_attr: sweep_val,
                "cp": round(row.cp, 4),
                "n": row.occurrences,
            }
            points.append(point)
        if not points:
            continue
        is_primary = value == primary_fixed
        label = (
            f"{fixed_attr}={value} (primary)"
            if is_primary
            else f"{fixed_attr}={value}"
        )
        curves.append(
            {
                fixed_attr: value,
                "label": label,
                "primary": is_primary,
                "points": points,
            }
        )
    return curves


def _ensure_primary_in_list(values: list[int], primary: int, max_extra: int = 4) -> list[int]:
    result = [primary]
    for value in values:
        if value == primary:
            continue
        result.append(value)
        if len(result) >= max_extra + 1:
            break
    return result


def _k_wiggle_side_payload(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    strategies: list[StrategyResult],
    k_values: np.ndarray,
    min_occurrences: int,
    primary_h: int,
    primary_t: int,
) -> list[dict]:
    lines = []
    for strat in strategies:
        points = []
        for k in k_values:
            row = compute_cp_at(df, analysis_date, strat.H, strat.T, float(k))
            if row is None or row.occurrences < min_occurrences:
                continue
            points.append(
                {
                    "k": float(k),
                    "cp": round(row.cp, 4),
                    "n": row.occurrences,
                }
            )
        if not points:
            continue
        lines.append(
            {
                "H": strat.H,
                "T": strat.T,
                "primary": strat.H == primary_h and strat.T == primary_t,
                "points": points,
            }
        )
    return lines


def _heatmap_payload(
    all_results: list[StrategyResult],
    side: str,
    H_values: list[int],
    T_values: list[int],
    min_occurrences: int,
) -> dict:
    lookup = {(row.H, row.T): row for row in all_results if row.side == side}
    long_matrix: list[list[float | None]] = []
    occ_matrix: list[list[int | None]] = []

    for H in H_values:
        cp_row: list[float | None] = []
        occ_row: list[int | None] = []
        for T in T_values:
            row = lookup.get((H, T))
            if row is None:
                cp_row.append(None)
                occ_row.append(None)
            else:
                cp_row.append(round(row.cp, 4) if row.occurrences >= min_occurrences else None)
                occ_row.append(row.occurrences)
        long_matrix.append(cp_row)
        occ_matrix.append(occ_row)

    return {"values": long_matrix, "occurrences": occ_matrix}


def _price_context(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_values: list[int],
    primary_h: int,
) -> dict:
    window_start = analysis_date - pd.Timedelta(days=max(H_values) * 3)
    subset = df[df.index >= window_start]
    series = []
    for date in subset.index:
        point: dict = {
            "date": date.strftime("%Y-%m-%d"),
            "price": round(float(subset.loc[date, "Price"]), 2),
        }
        for H in H_values:
            ma = subset["Price"].rolling(window=H).mean()
            val = ma.loc[date]
            if pd.notna(val):
                point[f"ma_{H}"] = round(float(val), 2)
        series.append(point)

    return {
        "series": series,
        "ma_windows": H_values,
        "primary_h": primary_h,
        "analysis_date": analysis_date.strftime("%Y-%m-%d"),
    }


def _strategies_for_k_sweep(
    ranked: list[StrategyResult],
    slice_top_n: int,
    primary_h: int,
    primary_t: int,
) -> list[StrategyResult]:
    selected = ranked[:slice_top_n]
    keys = {(s.H, s.T) for s in selected}
    if (primary_h, primary_t) not in keys:
        primary = next((r for r in ranked if r.H == primary_h and r.T == primary_t), None)
        if primary:
            selected = [primary] + selected[: slice_top_n - 1]
    return selected


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
    slice_top_n = int(config["filtering"].get("slice_top_n", 5))

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

    ranked_all = sorted(
        [r for r in all_results if r.occurrences >= min_occurrences],
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )
    top_strategies = ranked_all[:top_n]
    top_H_unique = top_unique_from_ranked(ranked_all, "H", slice_top_n)
    top_T_unique = top_unique_from_ranked(ranked_all, "T", slice_top_n)
    cp_vs_t_H = _ensure_primary_in_list(top_H_unique, H)
    cp_vs_h_T = _ensure_primary_in_list(top_T_unique, T)

    H_min, H_max = min(H_values), max(H_values)
    T_min, T_max = min(T_values), max(T_values)
    T_range = range(max(1, T_min), T_max + 1)
    H_range = range(H_min, H_max + 1)

    k_min = float(config["matching"]["k_wiggle_sweep_min"])
    k_max = float(config["matching"]["k_wiggle_sweep_max"])
    k_values = np.logspace(np.log10(k_min), np.log10(k_max), 80)

    ranked_long = sorted(
        long_rows,
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )
    ranked_short = sorted(
        short_rows,
        key=lambda row: (row.cp, row.occurrences),
        reverse=True,
    )

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
        "price_context": _price_context(df, analysis_date, H_values, H),
        "analog_events": [analog_to_dict(e) for e in analog_events],
        "cp_vs_T": {
            "curves": _curves_for_attr(
                df,
                analysis_date,
                "H",
                "T",
                cp_vs_t_H,
                T_range,
                k_wiggle,
                min_occurrences,
                H,
            ),
            "T_range": [T_min, T_max],
        },
        "cp_vs_H": {
            "curves": _curves_for_attr(
                df,
                analysis_date,
                "T",
                "H",
                cp_vs_h_T,
                H_range,
                k_wiggle,
                min_occurrences,
                T,
            ),
            "H_range": [H_min, H_max],
        },
        "k_wiggle_sweep": {
            "long": _k_wiggle_side_payload(
                df,
                analysis_date,
                _strategies_for_k_sweep(ranked_long, slice_top_n, H, T),
                k_values,
                min_occurrences,
                H,
                T,
            ),
            "short": _k_wiggle_side_payload(
                df,
                analysis_date,
                _strategies_for_k_sweep(ranked_short, slice_top_n, H, T),
                k_values,
                min_occurrences,
                H,
                T,
            ),
        },
        "heatmap": {
            "H_values": H_values,
            "T_values": T_values,
            "long": _heatmap_payload(all_results, "long", H_values, T_values, min_occurrences)[
                "values"
            ],
            "short": _heatmap_payload(
                all_results, "short", H_values, T_values, min_occurrences
            )["values"],
            "occurrences": _heatmap_payload(
                all_results, "long", H_values, T_values, min_occurrences
            )["occurrences"],
            "highlight": {"H": H, "T": T},
        },
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

    return {
        "analysis_date": date_text,
        "resolved_date": analysis_date.strftime("%Y-%m-%d"),
        "price_today": price_today,
        "k_wiggle": k_wiggle,
        "selected_H": H if H is not None else (by_h[0]["H"] if by_h else None),
        "H_values": H_values,
        "T_values": T_values,
        "by_H": by_h,
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
