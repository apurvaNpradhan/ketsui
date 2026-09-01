#!/usr/bin/env bash

set -euo pipefail

backend_port="${BACKEND_PORT:-$(uv run python -c 'from app.config import settings; print(settings.BACKEND_PORT)')}"

exec uv run uvicorn app.main:app --host 0.0.0.0 --port "$backend_port" "$@"
