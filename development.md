# Ketsui Development

All application workspaces live in this repository.

## Local development

Copy the environment examples and initialize PostgreSQL:

```bash
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d db
```

Use `DATABASE_URL=postgresql://backend_app:...@localhost:5432/backend_db` for FastAPI and `DATABASE_URL=postgresql://auth_app:...@localhost:5432/auth_db` for Better Auth. Set `BETTER_AUTH_URL=http://localhost:5173` for the public Better Auth URL. The backend uses `BETTER_AUTH_JWKS_URL=http://localhost:5173/api/auth/jwks`; it never queries Better Auth tables.

Start the backend:

```bash
cd apps/server
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Start the web app separately:

```bash
pnpm install
pnpm --filter @repo/web dev
```

The frontend calls `/api/*`; TanStack Start proxies those requests using the server-only `FASTAPI_ORIGIN=http://localhost:8000`. In Compose, that value is `http://backend:8000`.

## Compose

```bash
docker compose up --build
```

The Compose services are `db`, `backend`, and `frontend`. The web app is served on host port 5173 (container port 3000), and FastAPI on port 8000. The init script is only run when PostgreSQL creates a fresh data directory. Do not use it as a data migration for an existing `app` or `tanstarter` database.

## Checks

```bash
pnpm check
uv run ruff check apps/server/app apps/server/tests
uv run ruff format --check apps/server/app apps/server/tests
cd apps/server && python -m unittest discover -s tests
```
