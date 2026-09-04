# Workflow

## Commands

- `pnpm nx run web:build`: Verify the production frontend output when needed
- `pnpm nx run-many -t lint typecheck`: Run JavaScript linting and type checking
- `pnpm nx run web:dev` runs indefinitely in watch mode
- `pnpm nx run db:db -- generate`: Run Drizzle Kit commands when needed

Don't invoke a standalone build after every change. Use lint as the baseline and run the narrowest relevant tests described below; the E2E command builds when browser validation is relevant.

## Testing

- `pnpm nx run web:test`: Run all Vitest unit and local integration tests once
- `pnpm exec vitest --watch`: Run Vitest in watch mode
- `pnpm nx run web:e2e`: Build and run the local Chromium end-to-end tests against the built server
- `pnpm exec playwright install chromium`: Install the E2E browser once per machine

Run the narrowest tests relevant to the changed behavior. Playwright remains separate from the default lint/check loop; use it whenever a change affects a covered browser journey. Its configuration owns the production build and built-server lifecycle, so do not start a development server or run a separate build first. See [Testing](./testing.md) for test selection and design guidance.

## Formatting

Oxfmt is configured in `.oxfmtrc.json` and runs through Nx or the pre-commit hook.
