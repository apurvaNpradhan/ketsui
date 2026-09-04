# Ketsui

This repository contains the Ketsui applications and shared packages:

```text
apps/server   FastAPI, Pydantic, SQLAlchemy, and Alembic
apps/web      TanStack Start frontend
packages/auth Better Auth
packages/db   Drizzle schema and migrations
packages/ui   Shared UI components
```

## Setup

Requirements: Node 24, pnpm 12.2.0, Python 3.14, uv, and Docker.

```sh
cp .env.example .env
# Set local secrets in .env
pnpm install
uv sync
docker compose --env-file .env up -d db
```

Start the backend and web app through Nx:

```sh
pnpm nx run server:migrate
pnpm nx run server:dev
pnpm nx run web:dev
```

Generate the typed OpenAPI client after backend route changes:

```sh
pnpm nx run web:api:generate
```

The schema source is `http://localhost:$BACKEND_PORT/openapi.json`; it is generated to `apps/web/src/lib/api/schema.d.ts`. The client uses `/api` and the TanStack Start wildcard route proxies to `FASTAPI_ORIGIN`. Set `FRONTEND_PORT` and `BACKEND_PORT` in `.env` to choose the app ports.

FastAPI-specific backend conventions live in [`apps/server/AGENTS.md`](apps/server/AGENTS.md).

## Compose

```sh
docker compose --env-file .env up --build
```

Compose runs one PostgreSQL 18 service plus one-shot `backend-migrate` and `auth-migrate` jobs before the application services. Its first-run init script creates separate runtime and migration roles for `backend_db` and `auth_db`; runtime roles get data access while migration roles own the schemas. Alembic runs only against the backend database, and Drizzle runs only against the auth database. Init scripts run only on an empty Postgres volume; existing volumes need a one-time role/grant migration before adopting this setup. In production, set `BETTER_AUTH_URL` to the public HTTPS origin; Compose keeps JWKS access on the internal frontend URL.

## Auth

Better Auth issues EdDSA JWTs from `/api/auth/jwks`. FastAPI validates the bearer token's signature, issuer, audience, and required identity claims in `apps/server/src/auth/dependencies.py`; it does not connect to the Better Auth database.

To test authenticated endpoints in Scalar:

1. Log in at `http://localhost:$FRONTEND_PORT/login`.
2. Open the browser DevTools Console on the frontend and run:

   ```js
   const { token } = await fetch("/api/auth/token").then((r) => r.json());
   copy(token);
   ```

3. Open `http://localhost:$BACKEND_PORT/docs`, click **Authorize**, and paste the token without the `Bearer ` prefix.

Scalar will send the token as `Authorization: Bearer <token>`. For example, test the authenticated `/v1/users/me` endpoint.
