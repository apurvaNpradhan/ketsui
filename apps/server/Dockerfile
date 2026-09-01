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
COPY apps/web/public ./apps/web/public

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --package app \
    && useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app

USER appuser
WORKDIR /app/apps/server
CMD ["bash", "scripts/start.sh"]
