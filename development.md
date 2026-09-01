# Ketsui Development

All application workspaces live in this repository.

## Local development

Copy the environment examples and initialize PostgreSQL:

```bash
cp .env.example .env
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d db
```

All local variables live in the root `.env`. `FRONTEND_PORT` controls the web app and `BACKEND_PORT` controls FastAPI. Use `BACKEND_DATABASE_URL` for FastAPI and `AUTH_DATABASE_URL` for Better Auth. Set `BETTER_AUTH_URL=http://localhost:$FRONTEND_PORT` for the public Better Auth URL. The backend uses `BETTER_AUTH_JWKS_URL=http://localhost:$FRONTEND_PORT/api/auth/jwks`; it never queries Better Auth tables.

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
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

The Compose services are `db`, `backend`, and `frontend`. Their ports come from `BACKEND_PORT` and `FRONTEND_PORT` in `.env`. The init script is only run when PostgreSQL creates a fresh data directory. Do not use it as a data migration for an existing `app` or `tanstarter` database.

## Checks

```bash
pnpm check
uv run ruff check apps/server/app apps/server/tests
uv run ruff format --check apps/server/app apps/server/tests
cd apps/server && python -m unittest discover -s tests
```
