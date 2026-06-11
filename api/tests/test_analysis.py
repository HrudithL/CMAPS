"""Golden-value tests against known pred_info output."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from analysis import compute_analog_events, compute_cp_at, resolve_analysis_date
from data_loader import load_bitcoin_data

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "data" / "Bitcoin_2010.csv"


@pytest.fixture(scope="module")
def df() -> pd.DataFrame:
    return load_bitcoin_data(auto_update=False)


def test_resolve_analysis_date_2024_01_15(df: pd.DataFrame) -> None:
    resolved = resolve_analysis_date(df, "2024-01-15")
    assert resolved.strftime("%Y-%m-%d") == "2024-01-15"


def test_golden_cp_2024_01_15_h200_t90(df: pd.DataFrame) -> None:
    analysis_date = resolve_analysis_date(df, "2024-01-15")
    result = compute_cp_at(df, analysis_date, 200, 90, 0.01)
    assert result is not None
    assert result.side == "short"
    assert result.relation == "above"
    assert result.hits == 16
    assert result.occurrences == 88
    assert result.cp == pytest.approx(16 / 88, rel=1e-6)
    assert result.forward_resolved is True


def test_analog_events_match_aggregate(df: pd.DataFrame) -> None:
    analysis_date = resolve_analysis_date(df, "2024-01-15")
    result, events = compute_analog_events(df, analysis_date, 200, 90, 0.01)
    assert result is not None
    assert len(events) == result.occurrences
    assert sum(1 for e in events if e.hit) == result.hits


def test_csv_exists() -> None:
    assert CSV_PATH.exists()
