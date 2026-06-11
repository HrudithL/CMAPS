"""Bitcoin CSV loader with stale-data refresh."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
BITCOIN_CSV = ROOT / "data" / "Bitcoin_2010.csv"
UPDATE_SCRIPT = ROOT / "api" / "scripts" / "update_bitcoin.py"
STALE_SECONDS = 86400 / 3  # 8 hours


def _maybe_update_bitcoin_data() -> None:
    if not BITCOIN_CSV.exists():
        needs_update = True
    else:
        last_modified = BITCOIN_CSV.stat().st_mtime
        needs_update = (time.time() - last_modified) >= STALE_SECONDS

    if not needs_update:
        return

    subprocess.run([sys.executable, str(UPDATE_SCRIPT)], check=True)


def refresh_bitcoin_data() -> int:
    """Run updater unconditionally; return rows added (approximate via line count delta)."""
    before_lines = 0
    if BITCOIN_CSV.exists():
        with BITCOIN_CSV.open(encoding="utf-8") as handle:
            before_lines = sum(1 for _ in handle)

    subprocess.run([sys.executable, str(UPDATE_SCRIPT)], check=True)

    with BITCOIN_CSV.open(encoding="utf-8") as handle:
        after_lines = sum(1 for _ in handle)
    return max(0, after_lines - before_lines)


def load_bitcoin_data(*, auto_update: bool = True) -> pd.DataFrame:
    if auto_update:
        _maybe_update_bitcoin_data()
    df = pd.read_csv(BITCOIN_CSV)
    df["Date"] = pd.to_datetime(df["Date"], format="%m/%d/%Y", errors="coerce")
    df["Price"] = (
        df["Price"]
        .astype(str)
        .str.replace('"', "", regex=False)
        .str.replace(",", "", regex=False)
        .astype(float)
    )
    df = df.sort_values("Date")
    df = df.dropna(subset=["Date", "Price"])
    return df.set_index("Date")
