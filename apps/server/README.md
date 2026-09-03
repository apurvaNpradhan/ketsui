# Ketsui Backend

## Local development

From the repository root, start PostgreSQL and initialize its databases:

```console
docker compose --env-file .env up -d db
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

Set `BACKEND_PORT`, `DATABASE_URL`, `BETTER_AUTH_JWKS_URL`, and
`BETTER_AUTH_URL` in the root `.env`. The backend validates Better Auth JWT
claims and does not access the auth database. In production, use HTTPS for the
Better Auth URLs.

API documentation is enabled in development and staging, and disabled in
production.

## Project structure

The application is organized by domain under `src/`:

- `src/auth/` owns authentication routes, schemas, dependencies, and settings.
- `src/utils/` owns operational utility routes such as health checks.
- `src/db/` owns the SQLAlchemy base, naming conventions, and async sessions.
- `src/models.py` registers feature models for Alembic autogeneration.
- `src/main.py` creates the FastAPI application and its lifespan.

Feature models belong to their feature package, for example
`src/tasks/models.py` or `src/chat/models.py`. Add each feature model import to
`src/models.py` so Alembic can discover it.

## Migrations

Run Alembic commands from `apps/server/` with `uv run`:

```console
uv run alembic revision --autogenerate -m "Describe the change"
uv run alembic upgrade head
```

Alembic applies only to `backend_db` and reads `DATABASE_URL` from the root
environment. The migration CLI uses a synchronous SQLAlchemy connection; the
FastAPI application uses asynchronous sessions.
