# Contributing to VASA-EOS(SE)

## Setup

```bash
pnpm install --no-frozen-lockfile
pnpm dev
```

Node **>= 22.6** is required to run the unit tests (they use the built-in test
runner + TypeScript type-stripping). The app itself builds on Node 20+.

## The gate (run before pushing)

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test:coverage
```

CI runs all of these on `main` and on `claude/**` branches: a lint/typecheck/build
matrix (Node 20.x + 22.x) and a Node-22 unit-test job with enforced coverage
thresholds (lines 95% / branches 80% / functions 88%).

> **Local pnpm tip:** on pnpm 11 the `pnpm run <script>` wrapper can fail an
> ignored-builds preflight (sharp). Run the underlying binaries directly if needed:
> `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/next build`, and the
> `node --experimental-strip-types ...` command from the `test` script.

## Branches & commits

- Develop on a feature branch; do not push to `main` without review.
- Clear, imperative commit messages. Don't put model identifiers or internal
  session details in commits, PR text, or code.
- Open a PR only when asked.

## Conventions that keep the build green

These are real constraints in this codebase — violating them breaks CI:

1. **Server-action files (`"use server"`) may export only `async` functions.** Move
   constants, types, and pure helpers to a plain module (e.g. a feature's
   `index.ts`), and import them into the action.

2. **Client/server split for persisted modules.** A module whose `store.ts` imports
   `lib/persistence` (→ `lib/supabase/server` → `next/headers`) is **server-only**.
   Never import `store.ts` from a `"use client"` component. Keep client-imported
   constants/types/pure functions in the module's `index.ts`.

3. **Next.js 15 async APIs.** `cookies()`, `params`, and `searchParams` are Promises —
   `await` them. React 19 `useActionState((prevState, formData) => newState)`.

4. **Integrations default to mock.** Add a real adapter behind the existing port and
   gate it by its `INTEGRATION_*` flag in the registry; never make a port live by
   default. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and
   [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Adding a feature module

1. `lib/<feature>/index.ts` — constants, types, pure functions (client-safe).
2. If it persists, `lib/<feature>/store.ts` — async functions using `getDb()` with an
   **in-memory fallback** when `getDb()` is null, and `appendAudit(...)` for mutations.
3. `app/<feature>/page.tsx` (Server Component) + `actions.ts` (server actions) +
   a `"use client"` panel if interactive.
4. Wire navigation in `config/dashboard-nav.ts`.
5. Add unit tests (below).

## Adding a live integration adapter

1. Implement the port (`lib/integrations/types.ts`) in
   `lib/integrations/live/<name>.ts` using `httpJson` (timeout + fail-soft + traceId);
   return `mode: "live"` and map upstream errors to typed results — never throw.
2. Add env accessors to `lib/integrations/config.ts`.
3. Export from `lib/integrations/live/index.ts`; select in
   `lib/integrations/index.ts` via `integrationModes.<key> === "live"`.
4. Add a row to `lib/integrations/status.ts`.
5. Add success + failure-branch tests in `tests/live-adapters*.test.ts`.

## Writing tests

- Use `node:test` + `node:assert/strict`. Import app modules via the `@/` alias; the
  test loader resolves it and `.ts`/`index.ts` extensions.
- **Pure logic** — import and assert directly.
- **Live adapters** — mock `globalThis.fetch`, set the adapter's env vars in the test,
  and restore both in `afterEach`. Each test file runs in its own process, so env does
  not leak across files. Cover both the success mapping and the failure/unconfigured
  branches.
- **Persisted stores** — inject the in-memory client:
  `__setTestDb(makeFakeDb() as unknown as SupabaseClient)` in `beforeEach`,
  `__setTestDb(undefined)` in `afterEach`.
- **No TypeScript features that type-stripping can't handle** in code imported by
  tests: no `enum`, `namespace`, parameter properties, or `import =`.

Run a single file while iterating:

```bash
node --experimental-strip-types --import ./scripts/test-register.mjs --test tests/<file>.test.ts
```
