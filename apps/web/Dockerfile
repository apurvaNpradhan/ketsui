FROM node:26.8.1-bookworm-slim AS build

RUN apt-get update \
  && apt-get install --no-install-recommends -y git \
  && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@12.2.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY tools/tsconfig/package.json tools/tsconfig/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts \
  && pnpm rebuild esbuild

COPY . .
RUN pnpm exec vp run build

FROM node:26.8.1-bookworm-slim AS runtime

RUN npm install --global pnpm@12.2.0 \
  && useradd --create-home --uid 10001 appuser
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/packages/auth ./packages/auth
COPY --from=build /app/packages/ui/package.json ./packages/ui/package.json
COPY --from=build /app/tools/tsconfig/package.json ./tools/tsconfig/package.json
COPY --from=build /app/tools/tsconfig/base.json ./tools/tsconfig/base.json
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/.output ./apps/web/.output

RUN chown -R appuser:appuser /app
USER appuser
WORKDIR /app
CMD ["sh", "-c", "NITRO_PORT=\"${PORT:-${FRONTEND_PORT:?FRONTEND_PORT must be set}}\" node apps/web/.output/server/index.mjs"]
