# CMAPS method paper (LaTeX)

**CMAPS: Conditional Probability via Moving-Average Probabilistic Similarity on Bitcoin**

Short method note for Conditional Moving-Average Probabilistic Similarity — the analysis behind the [CMAPS dashboard](../README.md).

## Build

Requires a LaTeX distribution (`pdflatex`, `bibtex`), Python 3.11+, and project API deps.

```bash
cd paper
pip install -e "../api/[dev]"
pip install matplotlib
make pdf
```

Output: `paper/main.pdf`

Figures only:

```bash
make figures
```

## Layout

| Path | Role |
|------|------|
| `main.tex` | Document root |
| `preamble.tex` | Packages and macros |
| `sections/` | Section bodies |
| `references.bib` | Minimal bibliography |
| `scripts/generate_figures.py` | Figure from live CSV + `api/analysis.py` |
| `figures/` | Generated PDF figures |
