FROM python:3.14-slim

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

WORKDIR /app
COPY pyproject.toml uv.lock .python-version ./
COPY apps/server/pyproject.toml apps/server/alembic.ini ./apps/server/
COPY apps/server/app ./apps/server/app
COPY apps/server/scripts ./apps/server/scripts

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --package app

WORKDIR /app/apps/server
CMD ["sh", "-c", "bash scripts/prestart.sh && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
