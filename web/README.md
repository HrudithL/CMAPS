# CMAPS web client

React + Vite frontend for the [CMAPS](../README.md) Bitcoin conditional-probability dashboard.

## Development

From the repo root:

```bash
npm run dev:web
```

Or from this directory:

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173 and proxies `/api` to the FastAPI backend (default port 8000).

## Build

```bash
npm run build
```

Production builds expect `VITE_API_URL` when the API is hosted separately from static assets.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — live preview of analog matching and CP |
| `/overview` | Plain-language snapshot for the selected date |
| `/methodology` | Formal definitions (analog sets, CP, smoothing) |
| `/plots` | Interactive explorer — charts, contours, strategy drill-down |
