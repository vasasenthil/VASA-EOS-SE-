# VASA-EOS(SE) — Go-Live Operations Runbook

This is the operator's guide to running the platform and switching it from the
demo posture to production. **Every external dependency defaults to a mock**, so
the platform runs end-to-end with **zero credentials**. Each integration flips to
its real provider by setting environment variables — no code change.

Two in-app screens mirror this document at runtime:

- **`/integrations`** — each port's live/mock mode and which config variables are set.
- **`/health`** — live self-tests of the core guardrails (access PDP, audit chain,
  assessment/knowledge-graph/credential logic) plus persistence/integration posture.

---

## 1. Local development

```bash
pnpm install --no-frozen-lockfile
pnpm dev            # http://localhost:3000  (all integrations mock, in-memory stores)
```

Gate commands (what CI runs):

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test            # 95 unit tests (Node >= 22.6; uses built-in type-stripping)
pnpm run test:coverage   # tests + enforced coverage thresholds + report
```

> The unit tests use Node 22's built-in test runner and TypeScript type-stripping
> (no jest/vitest). They require **Node >= 22.6**; the CI test job pins Node 22.x.

---

## 2. Persistence (Supabase)

Without a service-role key the interactive modules (grievance, SMC, recognition,
verifiable credentials, DPDP consent, and the audit ledger) use an **in-memory
fallback** — state resets per server instance. For durable, cross-request state:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser/auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privileged** key — enables durable persistence |

Apply the SQL migrations in `scripts/` in order (`001` … `021`). Two are
load-bearing for the transactional modules:

- **`scripts/015-persist-interactive-modules.sql`** — creates `audit_trail`,
  `grievances`, `smc_proposals`, `recognition_applications`,
  `verifiable_credentials`, `consent_records`.
- **`scripts/021-create-workflow-flow-tables.sql`** — creates the six
  workflow-backed flow tables (`recognition_flows`, `grievance_flows`,
  `admission_flows`, `leave_flows`, `smc_flows`, `maintenance_flows`) that the
  deep verticals write to.

RLS is enabled with **no public policies** on these tables; they are written only
via the service-role client (which bypasses RLS and performs the app's own ReBAC
scoping). When `SUPABASE_SERVICE_ROLE_KEY` is present, `getDb()` returns the
privileged client and the stores persist automatically; `/health` reports
`Persistence mode: durable`.

> **Fresh bootstrap:** the numbered scripts are an evolving history, not all of
> which replay cleanly onto an empty database. For standing up a **new** durable
> database, follow the verified, ordered subset in
> [`scripts/MIGRATIONS.md`](../scripts/MIGRATIONS.md) (which also explains why
> the legacy `008`–`012` / `016` / `018` scripts are excluded). On an existing
> Supabase project the schema is already in place — this concerns new
> environments only.

### Verify the schema after provisioning

A configured key does **not** guarantee the tables exist — if migrations have not
run, the stores silently fall back to in-memory and writes never persist. Prove
durability before go-live:

```bash
NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm db:verify
```

It probes every workflow flow table and exits non-zero (naming the missing ones)
if any migration has not been applied. The same check is exposed at
**`/api/ready/schema`** — `200` when all tables are reachable, `503` (with the
missing list) otherwise — so an uptime monitor can gate go-live on it.

> **Verified:** `scripts/021` has been applied to a live **PostgreSQL 16**
> instance — all six flow tables are created with row-level security enabled, a
> service-role insert round-trips durably, and an `anon` SELECT returns **zero
> rows** (RLS deny-by-default protects the applicant/grievance/staff PII). This
> is the identical schema + security path a provisioned Supabase project runs.

---

## 3. Integration go-live matrix

Each port defaults to **mock**. Set its `INTEGRATION_*` flag to `live` **and**
provide the required variables. The `/integrations` page shows, per port, whether
it is live-ready (all required variables present).

| Integration | Port | Flag (`=live`) | Required | Optional |
| --- | --- | --- | --- | --- |
| APAAR identity | `IdentityProvider` | `INTEGRATION_APAAR` | `APAAR_BASE_URL`, `APAAR_API_KEY` | — |
| Aadhaar auth (UIDAI) | `AadhaarAuthProvider` | `INTEGRATION_AADHAAR` | `AADHAAR_BASE_URL`, `AADHAAR_API_KEY` | — |
| DigiLocker | `CredentialVault` | `INTEGRATION_DIGILOCKER` | `DIGILOCKER_BASE_URL`, `DIGILOCKER_API_KEY` | — |
| DBT / APBS | `PaymentBridge` | `INTEGRATION_DBT` | `DBT_BASE_URL`, `DBT_API_KEY` | — |
| UDISE+ registry | `SchoolRegistry` | `INTEGRATION_UDISE` | `UDISE_BASE_URL` | `UDISE_API_KEY` |
| DIKSHA content | `ContentBackbone` | `INTEGRATION_DIKSHA` | — (public API) | `DIKSHA_BASE_URL` |
| Bhashini language | `LanguageService` | `INTEGRATION_BHASHINI` | `BHASHINI_INFERENCE_URL`, `BHASHINI_API_KEY` | `BHASHINI_TRANSLATION_SERVICE_ID`, `BHASHINI_TTS_SERVICE_ID` |
| AI agents (LLM) | `AgentProvider` | `INTEGRATION_AGENTS` | `AGENTS_API_KEY` | `AGENTS_API_URL` (default OpenAI), `AGENTS_MODEL` (default `gpt-4o-mini`) |

Notes:

- **DIKSHA** is the only port that goes live with no credentials (public Composite
  Search API); `DIKSHA_BASE_URL` defaults to `https://diksha.gov.in`.
- **UDISE+** federates a state-hosted REST gateway (UDISE+ has no national open API).
- **Bhashini** runs translation and TTS live; **ASR is not wired live** (the port
  carries an opaque `audioRef`, not raw audio bytes) and returns a typed
  not-supported result.
- **Aadhaar is verify-only** — the full Aadhaar number is never sent or stored;
  only a transaction id and a boolean verification result cross the seam.
- Every live response is tagged `mode: "live"` and carries a `traceId` for audit;
  all adapters share one fail-soft HTTP transport (`lib/integrations/http.ts`) that
  captures timeouts and non-2xx responses as typed errors rather than throwing.

### Example: go live on DIKSHA + AI agents

```bash
INTEGRATION_DIKSHA=live
INTEGRATION_AGENTS=live
AGENTS_API_KEY=sk-...
# optional: AGENTS_MODEL=gpt-4o-mini
```

Exercise them at `/content` (DIKSHA) and `/ai-agents` (agents); each shows a
mock/live mode badge.

---

## 4. How the seam works (adding the next live adapter)

1. Implement the port interface (`lib/integrations/types.ts`) in
   `lib/integrations/live/<name>.ts`, using `httpJson` for resilience.
2. Read config from `lib/integrations/config.ts` (add env accessors there).
3. Export it from `lib/integrations/live/index.ts`.
4. Select it in `lib/integrations/index.ts`:
   `key: integrationModes.<key> === "live" ? live<Name> : mock<Name>`.
5. Add its row to `lib/integrations/status.ts` and a branch test in
   `tests/live-adapters*.test.ts`.

---

## 5. Testing & CI

- **`pnpm run test`** — 95 unit tests over the pure logic, the access-control PDP,
  the HTTP transport, all 8 live adapters (mocked `fetch`), the audit hash-chain,
  and the persisted store path (via an in-memory DB stub).
- **`pnpm run test:coverage`** — the same suite with **enforced thresholds**
  (lines 95% / branches 80% / functions 88%); the build fails below them. Current:
  ~96.9% lines / ~81.7% branches / ~90.8% functions.
- **CI** (`.github/workflows/ci.yml`) runs on `main` and the `claude/**` branches:
  a lint/typecheck/build matrix (Node 20.x + 22.x) and a Node-22 Unit Tests job
  that runs coverage and posts a coverage badge + table as a sticky PR comment.

---

## 6. Security & privacy posture

- **Access control** — a unified 5-model PDP (RBAC · ReBAC · ABAC · PBAC · CABAC)
  with **deny-wins / fail-closed** semantics (`lib/access`).
- **Audit** — a tamper-evident, hash-chained ledger (`lib/audit/trail`); `/health`
  verifies the chain and the persisted tables carry no public RLS policy.
- **DPDP consent** — explicit, withdrawable, purpose-bound consent
  (`lib/consent`), guardian-given for under-18s.
- **Aadhaar** — verify-only, never stored.
- **Secrets** — `/integrations` reports only whether a variable is *set*, never its
  value.
