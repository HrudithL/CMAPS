"""Conditional-probability analysis for a single Bitcoin analysis date."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

try:
    import yaml
except ImportError as exc:
    raise ImportError("Install PyYAML: pip install pyyaml") from exc


@dataclass(frozen=True)
class StrategyResult:
    H: int
    T: int
    side: str
    k_today: float
    relation: str
    hits: int
    occurrences: int
    cp: float
    forward_resolved: bool

    @property
    def eligible(self) -> bool:
        return self.occurrences > 0


@dataclass(frozen=True)
class AnalogEvent:
    date: str
    price: float
    ma: float
    k: float
    future_date: str
    future_price: float
    hit: bool
    return_pct: float


def load_config(config_path: Path) -> dict:
    with open(config_path, encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def resolve_analysis_date(df: pd.DataFrame, date_text: str) -> pd.Timestamp:
    target = pd.Timestamp(date_text).normalize()
    if target < df.index.min() or target > df.index.max():
        raise ValueError(
            f"Date {target.date()} outside available range "
            f"{df.index.min().date()} to {df.index.max().date()}."
        )
    if target not in df.index:
        prior = df.index[df.index <= target]
        if prior.empty:
            raise ValueError(f"No trading data on or before {target.date()}.")
        return prior[-1]
    return target


def _relation_and_side(price: float, ma: float) -> tuple[str, str]:
    if ma <= 0 or np.isnan(ma):
        raise ValueError("Invalid moving average for analysis date.")
    if price < ma:
        return "below", "long"
    if price > ma:
        return "above", "short"
    return "at", "neutral"


def _side_mask(prices: pd.Series, ma: pd.Series, side: str) -> pd.Series:
    # Strict inequality: days where price equals the MA are excluded from both sides.
    if side == "long":
        return prices < ma
    if side == "short":
        return prices > ma
    raise ValueError(f"Unknown side: {side}")


def compute_cp_for_side(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    T: int,
    k_wiggle: float,
    side: str,
) -> StrategyResult | None:
    """Conditional probability for one (H, T, side); None if k is undefined on analysis date."""
    prices = df["Price"]
    last_date = df.index.max()
    history_mask = df.index < analysis_date

    ma = prices.rolling(window=H).mean()
    k_series = prices / ma
    if analysis_date not in k_series.index:
        return None

    k_today = float(k_series.loc[analysis_date])
    ma_today = float(ma.loc[analysis_date])
    price_today = float(prices.loc[analysis_date])
    relation, analysis_side = _relation_and_side(price_today, ma_today)

    k_delta = np.abs(k_series - k_today)
    k_match = k_delta <= k_wiggle
    valid_base = history_mask & ma.notna() & k_match
    analog_mask = valid_base & _side_mask(prices, ma, side)
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


def compute_cp_at(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    T: int,
    k_wiggle: float,
) -> StrategyResult | None:
    """Conditional probability for one (H, T) pair; None if H is neutral on analysis date."""
    prices = df["Price"]
    ma = prices.rolling(window=H).mean()
    if analysis_date not in ma.index:
        return None

    ma_today = float(ma.loc[analysis_date])
    price_today = float(prices.loc[analysis_date])
    _, analysis_side = _relation_and_side(price_today, ma_today)
    if analysis_side == "neutral":
        return None

    return compute_cp_for_side(df, analysis_date, H, T, k_wiggle, analysis_side)


def compute_analog_events(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H: int,
    T: int,
    k_wiggle: float,
) -> tuple[StrategyResult | None, list[AnalogEvent]]:
    """Return aggregate result plus every analog row for charts / inspector."""
    result = compute_cp_at(df, analysis_date, H, T, k_wiggle)
    if result is None:
        return None, []

    prices = df["Price"]
    ma = prices.rolling(window=H).mean()
    k_series = prices / ma
    k_today = float(k_series.loc[analysis_date])
    price_today = float(prices.loc[analysis_date])
    ma_today = float(ma.loc[analysis_date])
    _, analysis_side = _relation_and_side(price_today, ma_today)

    history_mask = df.index < analysis_date
    k_delta = np.abs(k_series - k_today)
    k_match = k_delta <= k_wiggle
    valid_base = history_mask & ma.notna() & k_match

    if analysis_side == "long":
        side_mask = prices < ma
    else:
        side_mask = prices > ma

    analog_mask = valid_base & side_mask
    events: list[AnalogEvent] = []

    for date in df.index[analog_mask]:
        pos = df.index.get_loc(date)
        if isinstance(pos, slice):
            continue
        future_pos = int(pos) + T
        if future_pos >= len(df):
            continue

        future_date = df.index[future_pos]
        entry_price = float(prices.loc[date])
        exit_price = float(prices.loc[future_date])
        ma_val = float(ma.loc[date])
        k_val = float(k_series.loc[date])

        if analysis_side == "long":
            hit = exit_price > entry_price
        else:
            hit = exit_price < entry_price

        return_pct = (exit_price - entry_price) / entry_price * 100
        events.append(
            AnalogEvent(
                date=date.strftime("%Y-%m-%d"),
                price=entry_price,
                ma=ma_val,
                k=k_val,
                future_date=future_date.strftime("%Y-%m-%d"),
                future_price=exit_price,
                hit=hit,
                return_pct=round(return_pct, 2),
            )
        )

    return result, events


def compute_strategy_grid(
    df: pd.DataFrame,
    analysis_date: pd.Timestamp,
    H_values: list[int],
    T_values: list[int],
    k_wiggle: float,
) -> list[StrategyResult]:
    results: list[StrategyResult] = []

    for H in H_values:
        for T in T_values:
            row = compute_cp_at(df, analysis_date, H, T, k_wiggle)
            if row is not None:
                results.append(row)

    return results


def rank_strategies(
    rows: list[StrategyResult],
    min_occurrences: int,
    top_n: int,
) -> list[StrategyResult]:
    eligible = [row for row in rows if row.occurrences >= min_occurrences]
    eligible.sort(key=lambda row: (row.cp, row.occurrences), reverse=True)
    return eligible[:top_n]


def top_unique_from_ranked(
    ranked_rows: list[StrategyResult],
    attr: str,
    n: int,
) -> list[int]:
    seen: set[int] = set()
    values: list[int] = []
    for row in ranked_rows:
        value = int(getattr(row, attr))
        if value in seen:
            continue
        seen.add(value)
        values.append(value)
        if len(values) >= n:
            break
    return values


def results_to_dataframe(rows: list[StrategyResult]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "H": row.H,
                "T": row.T,
                "side": row.side,
                "k_today": round(row.k_today, 4),
                "relation": row.relation,
                "hits": row.hits,
                "occurrences": row.occurrences,
                "cp": round(row.cp, 4),
                "cp_pct": f"{row.cp * 100:.2f}%",
                "forward_resolved": row.forward_resolved,
            }
            for row in rows
        ]
    )
