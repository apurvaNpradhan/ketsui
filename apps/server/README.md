# Ketsui Backend

## Local development

From the repository root, start PostgreSQL and initialize its databases:

```console
docker compose --env-file .env.docker up -d db
```

Then run the backend from `apps/server/`:

```console
uv sync
uv run alembic upgrade head
bash scripts/start.sh --reload
```

The API is available at `http://localhost:$BACKEND_PORT`.

- OpenAPI schema: `http://localhost:$BACKEND_PORT/openapi.json`
- Scalar API reference: `http://localhost:$BACKEND_PORT/docs`
- Health check: `http://localhost:$BACKEND_PORT/v1/utils/health-check/`
- Authenticated user: `http://localhost:$BACKEND_PORT/v1/users/me`

Set `BACKEND_PORT`, `BACKEND_DATABASE_URL`, `BETTER_AUTH_JWKS_URL`, and `BETTER_AUTH_URL` in the root `.env`. The backend validates Better Auth JWT claims and does not access the auth database. In production, use HTTPS for the Better Auth URLs.

## Migrations

Run Alembic commands from `apps/server/` with `uv run`:

```console
uv run alembic revision --autogenerate -m "Describe the change"
uv run alembic upgrade head
```

Alembic applies only to `backend_db` and reads `BACKEND_DATABASE_URL` from the root environment.
