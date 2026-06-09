# VASA-EOS(SE) — Security & Privacy Model

This deep-dive covers the platform's enforced guardrails: the unified access-control
PDP, the tamper-evident audit ledger, the DPDP consent ledger, tenant isolation, and
the zero-trust posture. The first three are exercised live on `/health`
([selftest](MODULES.md#platform--ux)) and unit-tested in CI.

---

## 1. Access control — a unified 5-model PDP (`lib/access`)

`authorize(config, request)` is the single **Policy Decision Point**. It combines the
five models from the design dossier and returns `{ permitted, reason }`.

```ts
authorize(config: EngineConfig, req: AccessRequest): Decision
```

### The five models

| Model | Question it answers | Helper |
| --- | --- | --- |
| **RBAC** | Does any of the subject's roles grant this action? | `rbacAllows` |
| **ReBAC** | Is the subject *related* to this resource (parent-of, teaches)? | `rebacAllows` |
| **ABAC** | Do subject/resource/context **attributes** satisfy a rule? | `abacAllows` |
| **PBAC** | Do declarative **policies** permit or **deny**? | `pbacDecision` |
| **CABAC** | Is this a **context** elevation (emergency/exam-day, threat-aware)? | `cabacAllows` |

### Decision semantics — deny-wins, fail-closed

The order in `authorize` encodes two non-negotiable rules:

1. **Deny-wins.** PBAC is evaluated first; an explicit `deny` policy short-circuits and
   returns `permitted: false` **regardless of any role/relation/attribute grant**.
2. **Fail-closed.** If no model affirmatively permits, the default is **deny**
   (`"No model granted access (fail-closed)"`).

```text
pbacDecision == "deny"      → DENY  (deny-wins)
rbacAllows                  → permit (role)
rebacAllows (any relation)  → permit (relation)
abacAllows                  → permit (attributes)
pbacDecision == "permit"    → permit (policy)
cabacAllows                 → permit (context elevation)
otherwise                   → DENY  (fail-closed)
```

CABAC elevation is deliberately the **last** resort and is itself guarded: it grants
only when `context.emergency === true`, the action is in the elevated set, **and**
`threatLevel !== "high"` — so a high-threat window cannot be used to elevate.

### Tested invariants (`tests/access.test.ts`, `/health`)

- RBAC grants a permitted role/action.
- A `deny` policy overrides a role grant (deny-wins).
- No matching model → denied (fail-closed).
- CABAC permits in an emergency window but **not** otherwise, and **not** under high
  threat.

---

## 2. Audit — tamper-evident hash chain (`lib/audit/trail`)

Every state-changing action appends to an **append-only, hash-chained** ledger. Each
entry binds to the previous one, so any retroactive edit breaks the chain.

```ts
entry.hash = FNV1a( JSON({ seq, ts, actor, action, resource, details, prevHash }) )
entry.prevHash = previousEntry.hash        // GENESIS for the first
```

- **`appendAudit(...)`** — computes `seq` and `prevHash` from the last entry (read from
  Supabase when configured, else the in-memory tail), hashes the canonical body, and
  appends.
- **`getTrail()`** — the ordered chain.
- **`verifyTrail()`** — recomputes every entry's hash against the recomputed `prevHash`;
  returns `false` if any link or hash mismatches.

Persistence: when `SUPABASE_SERVICE_ROLE_KEY` is set the chain lives in `audit_trail`
(RLS on, **no public policy** — service-role writes only); otherwise an in-memory
fallback with identical semantics. The hash is a dependency-free FNV-1a (32-bit hex),
safe in any runtime — an in-app analogue of the dossier's blockchain-anchored audit,
not a cryptographic signature.

Consumers: grievance, SMC, recognition, credentials, consent, exam-result anchoring,
and PM POSHAN reconciliation all write here; verifiable credentials anchor their
`anchorSeq` to a mint entry. Verified live on `/health` and in `tests/audit.test.ts`.

---

## 3. DPDP consent ledger (`lib/consent`)

Personal-data processing is **purpose-bound** and gated by explicit, withdrawable
consent (InDEA-2.0 style). Under-18 consent is given by a guardian (the `actor`).

- **Purposes** (`CONSENT_PURPOSES`): Aadhaar linkage (verify-only), health federation
  (ABHA/RBSK), scheme eligibility & DBT, anonymised analytics, communications.
- **`grantConsent` / `withdrawConsent`** — each writes a `ConsentRecord` **and** an
  audit entry (`consent.granted` / `consent.withdrawn`).
- **`hasConsent(subject, purpose)`** — effective state, **most-recent record wins**, so
  a withdrawal supersedes an earlier grant.

Persists to `consent_records` when configured (RLS on, service-role only), else
in-memory. **Route:** `/consent`.

---

## 4. Tenant isolation (`lib/tenancy`)

A 7-tier hierarchy — national → state (sovereign) → directorate → district → block →
cluster → school. `canAccessTenant(tenants, subjectId, targetId)` grants access only
when the subject **is the target or an ancestor of it** (a tenant governs its
descendants, never its siblings or parents). `ancestorsOf` walks the parent chain.
`TENANCY_GUARANTEES` document data isolation, parent-constrained policy configuration,
and consent-gated cross-tenant federation (sovereignty preserved). **Route:**
`/tenancy`.

---

## 5. Zero-trust posture (`lib/security`)

*Never trust, always verify; least privilege; assume breach.* Defence-in-depth across
7 layers (`ZERO_TRUST_LAYERS`, L1 Physical → L7 Data) with `ZERO_TRUST_PRINCIPLES` and
`INCIDENT_RESPONSE` (6-hour CERT-In reporting, 72-hour DPDP breach notification).

`SECURITY_HEADERS` are applied to **every** response by `middleware.ts`:
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`,
`Strict-Transport-Security` (2y, preload), `X-DNS-Prefetch-Control: off`. A strict CSP
is documented as the target but not enforced in code to avoid breaking framework inline
assets. **Route:** `/security`.

---

## 6. Secret & PII handling

- **Aadhaar is verify-only** — the full number is never sent or stored; only a `txnId`
  and a boolean verification result cross the seam (`lib/integrations/live/aadhaar`).
- **Integration status** (`/integrations`) reports only whether a config variable is
  *set* (`Boolean(process.env[name])`) — never its value.
- **Persisted tables** created by `scripts/015-persist-interactive-modules.sql` enable
  RLS with **no public policy**; they are reachable only via the service-role client.
- Secrets are read server-side via `process.env`; client components never import the
  server stores (see the client/server split in [CONTRIBUTING.md](../CONTRIBUTING.md)).
