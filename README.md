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
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
# Set local secrets in each file
pnpm install
uv sync
docker compose up -d db
```

Start the backend from `apps/server` and the web app from the repository root:

```sh
uv run --directory apps/server alembic upgrade head
uv run --directory apps/server uvicorn app.main:app --reload
pnpm --filter @repo/web dev
```

Generate the typed OpenAPI client after backend route changes:

```sh
pnpm --filter @repo/web api:generate
```

The schema source is `http://localhost:8000/openapi.json`; it is generated to `apps/web/src/lib/api/schema.d.ts`. The client uses `/api` and the TanStack Start wildcard route proxies to `FASTAPI_ORIGIN`.

## Compose

```sh
docker compose up --build
```

Compose runs one PostgreSQL 18 service. Its first-run init script creates `backend_db`/`backend_app` and `auth_db`/`auth_app`. Alembic runs only against the backend database, and Drizzle runs only against the auth database. Init scripts run only on an empty Postgres volume; legacy `app` and `tanstarter` data requires a separate dump/restore migration decision.

## Auth

Better Auth issues EdDSA JWTs from `/api/auth/jwks`. FastAPI validates the bearer token's signature, issuer, audience, and required identity claims in `app/auth.py`; it does not connect to the Better Auth database.
