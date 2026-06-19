#!/usr/bin/env python3
"""Generate paper figures from CMAPS analysis module."""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "api"
sys.path.insert(0, str(API_DIR))

from analysis import compute_cp_for_side, resolve_analysis_date  # noqa: E402
from data_loader import load_bitcoin_data  # noqa: E402

FIG_DIR = Path(__file__).resolve().parents[1] / "figures"
ANALYSIS_DATE = "2024-01-15"
H = 200
EPS = 0.01
T_VALUES = list(range(50, 1100, 10))
MIN_N = 5


def cp_vs_t() -> None:
    df = load_bitcoin_data(auto_update=False)
    tau = resolve_analysis_date(df, ANALYSIS_DATE)
    result0 = compute_cp_for_side(df, tau, H, 90, EPS, "short")
    assert result0 is not None
    side = result0.side

    t_pts: list[int] = []
    cp_pts: list[float] = []
    n_pts: list[int] = []

    for T in T_VALUES:
        row = compute_cp_for_side(df, tau, H, T, EPS, side)
        if row is None or row.occurrences < MIN_N:
            continue
        t_pts.append(T)
        cp_pts.append(row.cp * 100)
        n_pts.append(row.occurrences)

    fig, ax = plt.subplots(figsize=(5.2, 3.2))
    ax.plot(t_pts, cp_pts, color="#d62728", linewidth=1.8, marker="o", markersize=3)
    ax.axhline(50, color="#888888", linewidth=0.8, linestyle="--", alpha=0.7)
    ax.set_xlabel("Forward horizon $T$ (trading days)")
    ax.set_ylabel(r"$\widehat{\mathrm{CP}}$ (\%)")
    ax.set_title(
        rf"Short side, $H={H}$, $\varepsilon={EPS}$, $\tau={ANALYSIS_DATE}$",
        fontsize=10,
    )
    ax.set_ylim(0, 100)
    ax.grid(True, alpha=0.25)
    fig.tight_layout()

    FIG_DIR.mkdir(parents=True, exist_ok=True)
    out = FIG_DIR / "cp_vs_T_20240115_H200.pdf"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote {out}")


if __name__ == "__main__":
    cp_vs_t()
