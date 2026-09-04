# Agent Guidelines

## Essentials

- Stack: TypeScript + React (TanStack Start) in a pnpm + Nx monorepo, with Drizzle ORM, shadcn/ui, and Better Auth.
- Prefer shared `@repo/ui` components; add primitives via shadcn CLI (`pnpm nx run ui:ui -- add <component>`).
- Use `lucide-react` for UI icons (use `Icon` suffix, e.g. `import { Loader2Icon } from "lucide-react"`); for brand icons use `@icons-pack/react-simple-icons` (e.g. `SiGithub`).
- Keep UI copy user-centered: describe outcomes and next actions concisely without exposing providers, internal states, or implementation details.
- Don't run a standalone build after every little change. Use the relevant Nx lint/typecheck target as the baseline and run the narrowest relevant tests described in the testing guidelines; `web:e2e` performs its own production build.
- For running scripts, use `pnpm` and Nx targets.

## Code style

- Do not introduce abstractions, generic utilities, or extensibility without a concrete need.
- Avoid unnecessary indirection and wrapper layers that only rename or forward calls.
- Prefer cohesive, readable functions over excessive fragmentation; extract helpers when they meaningfully improve readability, reuse, or testability.
- Keep types simple and close to where they are used. Prefer inference and avoid type gymnastics unless necessary.
- Follow existing abstractions; do not add new architectural layers without a concrete need.
- Minimize indirection: keep the main control flow easy to follow without unnecessary jumps across too many files/functions.
- Be robust at system boundaries such as user input, auth, external APIs, and persistence; avoid redundant defensive code where internal invariants are already enforced.
- Do not sacrifice security, correctness, or meaningful edge-case handling for brevity.
- Add concise comments only for non-obvious intent, unusual edge cases, and important constraints. Briefly explain why, not what.

## Topic-specific Guidelines

- [TanStack patterns](.agents/tanstack-patterns.md) - Routing, data fetching/mutations, loaders, server functions, environment shaking. For TanStack Query, Router, and Start
- [Auth patterns](.agents/auth.md) - Route guards, middleware, auth utilities
- [Database conventions](.agents/database.md) - Drizzle column types and generated Better Auth schema ownership
- [Testing](.agents/testing.md) - What to test, Vitest/Playwright boundaries, commands
- [TypeScript conventions](.agents/typescript.md) - Casting rules, prefer type inference
- [Workflow](.agents/workflow.md) - Workflow commands, validation approach
- [FastAPI backend](apps/server/AGENTS.md) - Read when changing `apps/server/**`, including routes, auth, configuration, database, migrations, or Python tests.

<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

## Nx and frontend tooling

# Nx and the frontend toolchain

Nx orchestrates upstream Vite, TanStack Start, Vitest, Oxlint, Oxfmt, pnpm, and uv. Use `pnpm nx show project <name> --json` to inspect targets.

Use `pnpm exec <tool> --help` for direct tool usage.

## Built-in Commands vs Scripts

Run application commands through explicit Nx targets such as `pnpm nx run web:dev` and `pnpm nx run web:build`.

## Tool Versions

Use `pnpm why <package>` to inspect the dependency graph.

Standalone tool configuration lives in `.oxlintrc.json` and `.oxfmtrc.json`.

## Review Checklist

- [ ] Run `pnpm install --frozen-lockfile` after pulling remote changes.
- [ ] Run `pnpm check` to format-check, lint, type check, and test JavaScript changes.
- [ ] Inspect unfamiliar project targets with `pnpm nx show project <name> --json`.

The standalone Oxlint config keeps built-in and type-aware rules.

## Vendored repositories

The project keeps local, gitignored source checkouts under `repos/` for agent reference.

- Read `repos/assistant-ui/` for assistant-ui implementation patterns, examples, tests, and docs before using web search.
- Treat `repos/assistant-ui/` as read-only reference material; application code must import the normal package dependency.
- Update the checkout with `git -C repos/assistant-ui pull --ff-only` when fresh source is needed.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
