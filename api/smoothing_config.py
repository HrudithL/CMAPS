"""Default Bayesian smoothing parameters (m, r) from strategy grid."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from analysis import StrategyResult


@dataclass(frozen=True)
class SmoothingContext:
    b_counts: list[int]
    cp_values: list[float]

    @property
    def median_b(self) -> float:
        return float(np.median(self.b_counts)) if self.b_counts else 0.0

    @property
    def median_cp(self) -> float:
        return float(np.median(self.cp_values)) if self.cp_values else 0.5


def build_smoothing_context(results: list[StrategyResult]) -> SmoothingContext:
    eligible = [row for row in results if row.occurrences > 0]
    cp_values = [row.cp for row in eligible]

    seen: set[tuple[int, str]] = set()
    b_counts: list[int] = []
    for row in eligible:
        key = (row.H, row.side)
        if key in seen:
            continue
        seen.add(key)
        b_counts.append(row.occurrences)

    return SmoothingContext(b_counts=b_counts, cp_values=cp_values)


def default_smoothing_params(ctx: SmoothingContext) -> dict[str, float]:
    """Defaults: m = 10% of median |B|, r = median CP."""
    median_b = ctx.median_b
    m_default = 0.1 * median_b
    r_default = ctx.median_cp
    return {
        "median_b": round(median_b, 2),
        "m_default": round(m_default, 2),
        "r_default": round(r_default, 4),
    }


def resolve_smoothing_m_r(
    m: float | None,
    r: float | None,
    defaults: dict[str, float],
) -> tuple[float, float]:
    m_val = float(defaults["m_default"]) if m is None else max(0.0, float(m))
    r_val = float(defaults["r_default"]) if r is None else float(r)
    return round(m_val, 2), round(r_val, 4)
