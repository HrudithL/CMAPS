"""Tests for default smoothing parameters."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from analysis import compute_strategy_grid, load_config, resolve_analysis_date
from data_loader import load_bitcoin_data
from smoothing_config import (
    build_smoothing_context,
    default_smoothing_params,
    resolve_smoothing_m_r,
)

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def defaults(df: pd.DataFrame) -> dict[str, float]:
    config = load_config(ROOT / "config" / "pred_info.yaml")
    analysis_date = resolve_analysis_date(df, "2024-01-15")
    results = compute_strategy_grid(
        df,
        analysis_date,
        config["timeframes"]["H_days"],
        config["timeframes"]["T_days"],
        0.01,
    )
    ctx = build_smoothing_context(results)
    return default_smoothing_params(ctx)


@pytest.fixture(scope="module")
def df() -> pd.DataFrame:
    return load_bitcoin_data(auto_update=False)


def test_default_m_is_ten_percent_median_b(defaults: dict[str, float]) -> None:
    assert defaults["m_default"] == pytest.approx(0.1 * defaults["median_b"], rel=1e-6)


def test_resolve_uses_defaults_when_unset(defaults: dict[str, float]) -> None:
    m, r = resolve_smoothing_m_r(None, None, defaults)
    assert m == defaults["m_default"]
    assert r == defaults["r_default"]


def test_resolve_custom_m_r(defaults: dict[str, float]) -> None:
    m, r = resolve_smoothing_m_r(3.5, 0.42, defaults)
    assert m == 3.5
    assert r == 0.42
