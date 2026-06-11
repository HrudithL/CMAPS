FROM python:3.12-slim

WORKDIR /app

COPY api/pyproject.toml api/
COPY api/*.py api/
COPY api/scripts api/scripts/
COPY config config/
COPY data data/

RUN pip install --no-cache-dir -e ./api

WORKDIR /app/api
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    