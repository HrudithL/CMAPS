# CPMAB — Conditional Probability with Moving Averages on Bitcoin

Interactive web UI for Bitcoin conditional-probability analysis (analog matching on k = price / MA(H)).

**Full product spec:** [SPEC.md](./SPEC.md)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18+, Vite 6, TypeScript, Plotly, Tailwind |
| Backend | FastAPI, pandas, numpy |
| Data | `data/Bitcoin_2010.csv` (CoinGecko updater) |

## Local development

**One command (API + web)**

```bash
pip install -e "api/[dev]"
npm install
cp .env.example .env   # optional; set API_PORT if 8000 is busy
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the API port (`API_PORT` in `.env`, default `8000`).

**Separate terminals (optional)**

```bash
# API
cd api && pip install -e ".[dev]" && uvicorn main:app --reload --port 8000

# Web
cd web && npm install && npm run dev
```

### Defaults

- Date: today (or latest CSV row)
- H=200, T=90, k wiggle ±0.01
- Auto-update on param change (400 ms debounce)
- URL sync: `?date=2024-01-15&H=200&T=90&k_wiggle=0.01`

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/meta` | Dataset bounds, grid config, defaults |
| GET | `/api/analyze` | Full dashboard payload |
| GET | `/api/strategy/detail` | Analog drill-down |
| POST | `/api/data/refresh` | Manual CSV update |

## Tests

```bash
cd api && pytest -q
cd web && npm run build
```

## Docker (optional)

```bash
docker compose up --build
```

## Deployment (Phase 4)

- **Web:** Vercel (`VITE_API_URL` → production API)
- **API:** Railway or Render; mount `data/` volume or commit refreshed CSV

## Disclaimer

Historical analog analysis only. Not financial advice.
