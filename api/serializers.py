"""Convert analysis dataclasses to JSON-serializable dicts."""

from __future__ import annotations

from analysis import AnalogEvent, StrategyResult


def strategy_to_dict(
    row: StrategyResult,
    *,
    smoothed_cp: float | None = None,
) -> dict:
    payload = {
        "H": row.H,
        "T": row.T,
        "side": row.side,
        "k_today": round(row.k_today, 4),
        "relation": row.relation,
        "hits": row.hits,
        "occurrences": row.occurrences,
        "cp": round(row.cp, 4),
        "forward_resolved": row.forward_resolved,
    }
    if smoothed_cp is not None:
        payload["smoothed_cp"] = round(smoothed_cp, 4)
    return payload


def analog_to_dict(event: AnalogEvent) -> dict:
    return {
        "date": event.date,
        "price": round(event.price, 2),
        "ma": round(event.ma, 2),
        "k": round(event.k, 4),
        "future_date": event.future_date,
        "future_price": round(event.future_price, 2),
        "hit": event.hit,
        "return_pct": event.return_pct,
    }
