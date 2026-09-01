# Ketsui Backend

## Local development

From the repository root, start PostgreSQL and initialize its databases:

```console
docker compose up -d db
```

Then run the backend from `apps/server/`:

```console
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`.

- OpenAPI schema: `http://localhost:8000/openapi.json`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/v1/utils/health-check/`
- Authenticated user: `http://localhost:8000/v1/users/me`

Set `BETTER_AUTH_JWKS_URL` and `BETTER_AUTH_URL` in `apps/server/.env`. The backend validates Better Auth JWT claims and does not access the auth database.

## Migrations

Run Alembic commands from `apps/server/` with `uv run`:

```console
uv run alembic revision --autogenerate -m "Describe the change"
uv run alembic upgrade head
```

Alembic applies only to `backend_db` and reads `DATABASE_URL` from the environment.
