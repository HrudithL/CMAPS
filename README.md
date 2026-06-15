# CMAPS

**C**onditional **M**oving-**A**verage **P**robabilistic **S**imilarity on Bitcoin — interactive dashboard for historical analog conditional-probability analysis.

Given today's price-to-moving-average ratio \(k = P / \mathrm{MA}(H)\), CMAPS finds past days with a similar setup (within tolerance ε), then counts how often Bitcoin rose or fell over forward horizon \(T\). No model forecast — just auditable history.

**Full product spec:** [SPEC.md](./SPEC.md)

The LaTeX method paper lives in `paper/` locally (gitignored — not in the public repo).

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

## Deployment (GitHub Pages + Render)

| Piece | Host | Config |
|-------|------|--------|
| Frontend | GitHub Pages | `.github/workflows/deploy-pages.yml` |
| API | Render (Docker) | `render.yaml` + `api/Dockerfile` |

### 1. API on Render

1. Push this repo to GitHub.
2. [Render](https://render.com) → **New** → **Blueprint** → connect repo → approve `render.yaml`.
3. When prompted for `CORS_ORIGINS`, set your Pages origin (project Pages use host only):

   ```
   https://hrudithl.github.io
   ```

4. After deploy, note the service URL (e.g. `https://cmaps-api.onrender.com`). Free tier sleeps when idle — first request may take ~30s.

Health check: `GET /health`. Data ships in the Docker image via `data/Bitcoin_2010.csv`; refresh with `POST /api/data/refresh` or rebuild after updating the CSV locally.

### 2. Frontend on GitHub Pages

1. Repo **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**.
2. **Settings** → **Secrets and variables** → **Actions** → **Variables**:

   | Variable | Example |
   |----------|---------|
   | `VITE_API_URL` | `https://cmaps-api.onrender.com` |
   | `VITE_BASE_PATH` | `/Cond_Prob_Analaysis/` |

   `VITE_BASE_PATH` must match the repo name for project Pages (`https://<user>.github.io/<repo>/`). Use `/` only for a `username.github.io` user site.

3. Push to `main` — workflow `deploy-pages` builds `web/` and publishes `web/dist`.

### 3. Verify

- Pages: `https://hrudithl.github.io/Cond_Prob_Analaysis/`
- API: `https://<your-render-host>/health` and `/api/meta`
- Browser devtools: API calls go to Render (not `/api` on Pages — static host has no proxy).

### Local production build smoke test

```bash
cd web
VITE_API_URL=https://cmaps-api.onrender.com VITE_BASE_PATH=/Cond_Prob_Analaysis/ npm run build
npm run preview
```

## Disclaimer

Historical analog analysis only. Not financial advice.
