# Ketsui Development

All application workspaces live in this repository.

## Local development

Copy the environment examples and initialize PostgreSQL:

```bash
cp .env.example .env
# Set real local values in .env before starting services.
docker compose --env-file .env up -d db
```

The root `.env` is used by both host development and Docker Compose. Compose derives container-only database and service URLs in `compose.yml`; the host-only URLs in `.env` are ignored there. `FRONTEND_PORT` controls the web app and `BACKEND_PORT` controls FastAPI. Use `DATABASE_URL` for FastAPI and `AUTH_DATABASE_URL` for Better Auth. Set `BETTER_AUTH_URL=http://localhost:$FRONTEND_PORT` for the public Better Auth URL. The backend uses `BETTER_AUTH_JWKS_URL=http://localhost:$FRONTEND_PORT/api/auth/jwks` locally and an internal frontend URL in Compose; it never queries Better Auth tables.

Start the backend:

```bash
cd apps/server
uv sync
uv run alembic upgrade head
bash scripts/start.sh --reload
```

Start the web app separately:

```bash
pnpm install
pnpm --filter @repo/web dev
```

The frontend calls `/api/*`; TanStack Start proxies those requests using the server-only `FASTAPI_ORIGIN` origin. In local development, use `http://localhost:$BACKEND_PORT`; in Compose, use `http://backend:$BACKEND_PORT`.

## Compose

```bash
docker compose --env-file .env up --build
```

Compose runs `db`, one-shot `backend-migrate` and `auth-migrate` jobs, then `backend` and `frontend`. Their ports come from `BACKEND_PORT` and `FRONTEND_PORT` in `.env`. The init script is only run when PostgreSQL creates a fresh data directory. Do not use it as a data migration for an existing `app` or `tanstarter` database.

## Checks

```bash
pnpm check
uv run ruff check apps/server/src apps/server/tests
uv run ruff format --check apps/server/src apps/server/tests
uv run --directory apps/server pytest
```
