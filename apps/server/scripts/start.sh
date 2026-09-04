#!/usr/bin/env bash

set -euo pipefail

backend_port="${BACKEND_PORT:-$(uv run python -c 'from src.config import settings; print(settings.BACKEND_PORT)')}"

exec uv run uvicorn src.main:app --host 0.0.0.0 --port "$backend_port" "$@"
