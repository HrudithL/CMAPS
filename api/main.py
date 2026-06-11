"""FastAPI application for CPMAB dashboard."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from cache import TTLCache
from data_loader import refresh_bitcoin_data
from service import (
    analyze_payload,
    get_config,
    get_dataframe,
    invalidate_data_cache,
    landing_payload,
    meta_payload,
    strategy_detail_payload,
)

analyze_cache = TTLCache(maxsize=64, ttl_seconds=3600)
detail_cache = TTLCache(maxsize=128, ttl_seconds=3600)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_dataframe(auto_update=True)
    yield
    analyze_cache.clear()
    detail_cache.clear()


app = FastAPI(title="CPMAB API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/meta")
def get_meta():
    return meta_payload()


@app.get("/api/landing")
def landing(
    date: str | None = Query(default=None),
    H: int | None = Query(default=None, ge=1, le=2000),
    k_wiggle: float | None = Query(default=None, gt=0, le=1),
):
    config = get_config()
    if k_wiggle is None:
        k_wiggle = float(config["matching"]["k_wiggle"])

    try:
        return landing_payload(date_text=date, H=H, k_wiggle=k_wiggle)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/analyze")
def analyze(
    date: str | None = Query(default=None),
    H: int = Query(default=200, ge=1, le=2000),
    T: int = Query(default=90, ge=1, le=2000),
    k_wiggle: float = Query(default=0.01, gt=0, le=1),
    min_occurrences: int = Query(default=0, ge=0),
    top_n: int = Query(default=10, ge=1, le=100),
):
    cache_key = (date, H, T, k_wiggle, min_occurrences, top_n)
    cached = analyze_cache.get(cache_key)
    if cached is not None:
        return cached

    config = get_config()
    if min_occurrences == 0:
        min_occurrences = int(config["filtering"]["min_occurrences"])

    try:
        payload = analyze_payload(
            date_text=date,
            H=H,
            T=T,
            k_wiggle=k_wiggle,
            min_occurrences=min_occurrences,
            top_n=top_n,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    analyze_cache.set(cache_key, payload)
    return payload


@app.get("/api/strategy/detail")
def strategy_detail(
    date: str = Query(...),
    H: int = Query(..., ge=1, le=2000),
    T: int = Query(..., ge=1, le=2000),
    k_wiggle: float = Query(default=0.01, gt=0, le=1),
    side: str | None = Query(default=None),
):
    cache_key = (date, H, T, k_wiggle, side)
    cached = detail_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        payload = strategy_detail_payload(
            date_text=date,
            H=H,
            T=T,
            k_wiggle=k_wiggle,
            side=side,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    detail_cache.set(cache_key, payload)
    return payload


@app.post("/api/data/refresh")
def data_refresh():
    try:
        rows_added = refresh_bitcoin_data()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    invalidate_data_cache()
    analyze_cache.clear()
    detail_cache.clear()
    df = get_dataframe(auto_update=False)
    return {
        "rows_added": rows_added,
        "date_max": df.index.max().strftime("%Y-%m-%d"),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
