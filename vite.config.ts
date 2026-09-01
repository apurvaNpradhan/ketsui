import { defineConfig } from "vite-plus";

// https://viteplus.dev/config/
export default defineConfig({
  // Vite Task
  // https://viteplus.dev/config/run
  // https://viteplus.dev/guide/run
  run: {
    cache: {
      tasks: true,
    },
  },

  // Vitest (via Vite+) - https://viteplus.dev/guide/test
  test: {
    include: ["{apps,packages,tools}/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },

  // Oxfmt - https://oxc.rs/docs/guide/usage/formatter/config.html
  fmt: {
    tabWidth: 2,
    semi: true,
    printWidth: 100,
    singleQuote: false,
    endOfLine: "lf",
    trailingComma: "all",
    sortImports: {},
    sortTailwindcss: {
      stylesheet: "./packages/ui/styles/base.css",
      attributes: ["class", "className"],
      functions: ["clsx", "cn", "cva", "tw"],
    },
    sortPackageJson: true,
    ignorePatterns: [
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      "routeTree.gen.ts",
      "schema.d.ts",
      "auth.schema.ts",
      ".tanstack-start/",
      ".tanstack/",
      "drizzle/",
      "migrations/",
      ".drizzle/",
      ".cache",
      ".serena/",
      "worker-configuration.d.ts",
      ".vercel",
      ".output",
      ".wrangler",
      ".netlify",
      "dist",
    ],
  },

  // Oxlint - https://oxc.rs/docs/guide/usage/linter/config
  lint: {
    plugins: ["typescript", "react", "react-perf", "jsx-a11y"],
    env: {
      builtin: true,
      node: true,
      browser: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      // Plugins with "/" in name have to be aliased for now
      // Issue: https://github.com/oxc-project/oxc/issues/14557
      {
        name: "eslint-tanstack-router",
        specifier: "@tanstack/eslint-plugin-router",
      },
      {
        name: "eslint-tanstack-query",
        specifier: "@tanstack/eslint-plugin-query",
      },
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
    ],
    categories: {
      correctness: "warn",
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "warn",

      "no-deprecated": "warn",
      "typescript/no-floating-promises": "off",
      "typescript/no-misused-spread": "off",

      "jsx-a11y/prefer-tag-over-role": "off",

      "eslint-tanstack-router/create-route-property-order": "warn",

      "eslint-tanstack-query/exhaustive-deps": "warn",
      "eslint-tanstack-query/stable-query-client": "warn",
      "eslint-tanstack-query/no-rest-destructuring": "warn",
      "eslint-tanstack-query/no-unstable-deps": "warn",
      "eslint-tanstack-query/infinite-query-property-order": "warn",
      "eslint-tanstack-query/no-void-query-fn": "warn",
      "eslint-tanstack-query/mutation-property-order": "warn",
    },
    ignorePatterns: [
      "dist",
      ".wrangler",
      ".vercel",
      ".netlify",
      ".output",
      "build/",
      "worker-configuration.d.ts",
      ".serena/",
      "scripts/",
    ],
  },
});
