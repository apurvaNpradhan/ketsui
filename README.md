# Ketsui

This repository contains the Ketsui applications and shared packages:

```text
apps/server   FastAPI, Pydantic, SQLModel, and Alembic
apps/web      TanStack Start frontend
packages/auth Better Auth
packages/db   Drizzle schema and migrations
packages/ui   Shared UI components
```

## Setup

Requirements: Node 24, pnpm 12.2.0, Python 3.14, uv, and Docker.

```sh
cp .env.example .env
# Set local secrets in these files
pnpm install
uv sync
docker compose --env-file .env.docker up -d db
```

Start the backend from `apps/server` and the web app from the repository root:

```sh
uv run --directory apps/server alembic upgrade head
uv run --directory apps/server bash scripts/start.sh --reload
pnpm --filter @repo/web dev
```

Generate the typed OpenAPI client after backend route changes:

```sh
pnpm --filter @repo/web api:generate
```

The schema source is `http://localhost:$BACKEND_PORT/openapi.json`; it is generated to `apps/web/src/lib/api/schema.d.ts`. The client uses `/api` and the TanStack Start wildcard route proxies to `FASTAPI_ORIGIN`. Set `FRONTEND_PORT` and `BACKEND_PORT` in `.env` to choose the app ports.

## Compose

```sh
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

Compose runs one PostgreSQL 18 service. Its first-run init script creates `backend_db`/`backend_app` and `auth_db`/`auth_app`. Alembic runs only against the backend database, and Drizzle runs only against the auth database. Init scripts run only on an empty Postgres volume; legacy `app` and `tanstarter` data requires a separate dump/restore migration decision.

## Auth

Better Auth issues EdDSA JWTs from `/api/auth/jwks`. FastAPI validates the bearer token's signature, issuer, audience, and required identity claims in `app/auth.py`; it does not connect to the Better Auth database.

To test authenticated endpoints in Scalar:

1. Log in at `http://localhost:$FRONTEND_PORT/login`.
2. Open the browser DevTools Console on the frontend and run:

   ```js
   const { token } = await fetch("/api/auth/token").then((r) => r.json());
   copy(token);
   ```

3. Open `http://localhost:$BACKEND_PORT/docs`, click **Authorize**, and paste the token without the `Bearer ` prefix.

Scalar will send the token as `Authorization: Bearer <token>`. For example, test the authenticated `/v1/users/me` endpoint.
