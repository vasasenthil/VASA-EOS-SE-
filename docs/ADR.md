# Architecture Decision Record (ADR) Log

A log of the significant architectural decisions on this platform — the context, the
decision, and its consequences. Newest decisions extend, not contradict, earlier ones.

| # | Decision | Status |
| --- | --- | --- |
| [0001](#adr-0001--mock-backed-adapters-with-real-seams) | Mock-backed integration adapters with real seams | Accepted |
| [0002](#adr-0002--client-safe-index--server-only-store-split) | Client-safe `index.ts` / server-only `store.ts` split | Accepted |
| [0003](#adr-0003--persistence-seam-with-in-memory-fallback) | Persistence seam (`getDb`) with in-memory fallback | Accepted |
| [0004](#adr-0004--tamper-evident-hash-chained-audit-not-a-signature) | Hash-chained audit ledger (FNV-1a, not a signature) | Accepted |
| [0005](#adr-0005--unified-5-model-pdp-deny-wins--fail-closed) | Unified 5-model PDP, deny-wins / fail-closed | Accepted |
| [0006](#adr-0006--node-built-in-test-runner--type-stripping-no-jestvitest) | Node built-in test runner + type-stripping | Accepted |
| [0007](#adr-0007--ci-on-claude-branches-enforced-coverage--pr-comment) | CI on `claude/**`, enforced coverage + PR comment | Accepted |

---

## ADR-0001 — Mock-backed adapters with real seams

**Status:** Accepted.

**Context.** Every government dependency (APAAR, Aadhaar, DigiLocker, DBT/APBS, UDISE+,
DIKSHA, Bhashini, LLM agents) needs credentials, MoUs, or sandbox access we don't have
during development. We still need the whole platform to run, demo, and be testable.

**Decision.** Express each dependency as a typed **port** (`lib/integrations/types.ts`)
with (a) a working **mock**, (b) a real HTTP-backed **live** adapter, and (c) a registry
that selects between them per `INTEGRATION_*` flag (default **mock**). All live adapters
share one fail-soft transport (`lib/integrations/http.ts`) and tag responses with
`mode` + `traceId`.

**Consequences.** The platform runs with zero credentials; going live is a config change
(`INTEGRATION_X=live` + env), not a code change. Adds a thin indirection layer and the
discipline of keeping mock and live behind one interface. Surfaced at `/integrations`;
documented in [OPERATIONS.md](OPERATIONS.md).

## ADR-0002 — Client-safe `index.ts` / server-only `store.ts` split

**Status:** Accepted (forced by a real build failure).

**Context.** Making the interactive stores persist meant importing the Supabase server
client, which transitively imports `next/headers`. Client components that imported a
module's constants/types then pulled `next/headers` into the browser bundle and broke
`next build`.

**Decision.** Each persisted feature module splits into a **client-safe `index.ts`**
(constants, types, pure helpers) and a **server-only `store.ts`** (async DB + audit
functions). `"use client"` components import only `index.ts`; server actions/pages import
`store.ts`.

**Consequences.** Clear, enforceable boundary; no server-only code reaches the client.
Two files per persisted module instead of one. Codified in
[CONTRIBUTING.md](../CONTRIBUTING.md).

## ADR-0003 — Persistence seam with in-memory fallback

**Status:** Accepted.

**Context.** CI/demo have no database; production needs durable, cross-request state for
grievance, SMC, recognition, credentials, consent, and the audit ledger.

**Decision.** A single seam, `lib/persistence` `getDb()`, returns the Supabase
service-role client when `SUPABASE_SERVICE_ROLE_KEY` is set, else `null`. Every store
branches: DB when present, in-memory otherwise — identical semantics either way. A
test-only `__setTestDb` override injects a fake client.

**Consequences.** One switch governs durability; the demo always works; tests can drive
the DB path without a database. Each store carries both code paths. See
[SECURITY.md](SECURITY.md) for the RLS posture of the persisted tables.

## ADR-0004 — Tamper-evident hash-chained audit (not a signature)

**Status:** Accepted.

**Context.** The dossier calls for a blockchain-anchored audit trail. We need integrity
evidence that runs in any runtime, in CI, and without external infra or key management.

**Decision.** An append-only ledger (`lib/audit/trail`) where each entry binds to the
previous via an **FNV-1a hash** of its canonical body + `prevHash`. `verifyTrail()`
recomputes the chain; any edit breaks it. Persisted to `audit_trail` (service-role only)
or in-memory.

**Consequences.** Dependency-free, fast, verifiable in-app (`/health`) and in tests.
It is an **integrity** primitive, **not** a cryptographic signature or real blockchain —
explicitly documented as the in-app analogue, to be swapped for HSM signing / a ledger
service in production.

## ADR-0005 — Unified 5-model PDP, deny-wins / fail-closed

**Status:** Accepted.

**Context.** The design spans role-, relationship-, attribute-, policy-, and
context-based access needs (Div IV). Scattering these checks would be inconsistent and
unauditable.

**Decision.** One Policy Decision Point, `authorize()` (`lib/access`), composes RBAC ·
ReBAC · ABAC · PBAC · CABAC. **Deny policies short-circuit (deny-wins)**; absent an
affirmative grant the result is **deny (fail-closed)**; CABAC elevation is last and
self-guards on emergency + non-high threat.

**Consequences.** A single, testable authorization choke point with explicit reasons.
Invariants are unit-tested and verified live on `/health`. Detailed in
[SECURITY.md](SECURITY.md).

## ADR-0006 — Node built-in test runner + type-stripping (no jest/vitest)

**Status:** Accepted.

**Context.** We wanted unit tests but network installs were unreliable, and `tsx` was
referenced yet absent. Adding jest/vitest + ts transforms was heavy and fragile here.

**Decision.** Use **Node 22's built-in test runner** with `--experimental-strip-types`
(no test-framework dependency). A small ESM loader (`scripts/test-loader.mjs`) resolves
the `@/` alias and `.ts`/`index.ts` extensions and stubs `next/headers` for the audit
import chain; the persisted-store path is tested via an in-memory Supabase-like client
(`tests/helpers/fake-db.ts`) injected through `__setTestDb`.

**Consequences.** Zero test dependencies; fast. Costs: requires **Node ≥ 22.6**, and
code imported by tests must avoid TS features type-stripping can't handle (enums,
namespaces, parameter properties). Recipes in [CONTRIBUTING.md](../CONTRIBUTING.md).

## ADR-0007 — CI on `claude/**`, enforced coverage + PR comment

**Status:** Accepted.

**Context.** The work is stacked on `claude/*` feature branches, but the workflow only
triggered for `base=main`, so PRs between feature branches ran no CI. We also wanted
coverage to be visible and non-regressing.

**Decision.** Broaden the workflow triggers to `main` **and** `claude/**`. Run a
lint/typecheck/build matrix (Node 20.x + 22.x) plus a Node-22 unit-test job that enforces
coverage thresholds (lines 95% / branches 80% / functions 88%) and upserts a sticky PR
comment with a coverage badge + table.

**Consequences.** Stacked PRs are gated; a coverage regression fails the build; every PR
shows its coverage. The unit-test job is Node-22-only (type-stripping requirement), so it
runs separately from the build matrix.
