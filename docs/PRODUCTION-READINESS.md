# VASA-EOS(SE) — Production / Operationalise / Deployment Readiness

An **honest, unbiased** scorecard. It records what is genuinely built and tested in
this repository versus what a government-grade production deployment still requires.
No criterion is marked done unless it is real and exercised in code/tests/CI.

Legend: ✅ done · 🟡 partial / foundation laid · ❌ not started

---

## 1. Production-grade

| Criterion | Status | Evidence / gap |
|---|---|---|
| Durable persistence seam | ✅ | `lib/persistence.getDb()` — Supabase service-role or in-memory fallback |
| DB-backed CRUD pattern + audit | ✅ | `lib/*/store.ts` (grievance, smc, recognition, credentials, consent, **safety**) — full CRUD, every mutation appended to the tamper-evident audit ledger; tested against a fake DB |
| Modules converted to durable stores | ✅ | Safety, Lost & Found, Cook-cum-Helper, TC, CWSN/IEP, RTE quota, RTI, **OoSC**, **Water-quality**, **CCTV** — `lib/*/store.ts` + `app/*/actions.ts` + server-loaded pages + optimistic client boards |
| All interactive modules persisted | 🟡 | ~15 modules persist via stores; **~59 newer modules still hold state in the browser (`useState`)**. They follow the same converter — rolling out module-by-module |
| Input validation on writes | 🟡 | Zod on auth + several actions; not yet uniform across every action |
| Access enforcement on writes (`requireAccess`) | 🟡 | PDP exists (`lib/access`, 5 models) and is wired on high-stakes actions; not yet on every mutation |
| Automated tests + coverage gate | ✅ | Node test runner; **96 test files**, **>380 tests**, ~98% lines / ~91% branches, thresholds enforced in CI |

## 2. Operationalise-grade

| Criterion | Status | Evidence / gap |
|---|---|---|
| Structured logging | ✅ | `lib/logger` — one JSON line per event, secret-field redaction; tested |
| Liveness probe | ✅ | `GET /api/live` — 200 while the process serves; makes no downstream calls |
| Readiness probe | ✅ | `GET /api/ready` — `ready` / `degraded` (in-memory) / `unavailable` (missing config → 503); `lib/readiness`, tested |
| Guardrail self-test endpoint | ✅ | `GET /api/health` + `/health` — runs PDP/audit/credential invariants |
| Env validation / config report | ✅ | `lib/env` — required vs optional contract, presence-only report, `mode` (production/demo); tested |
| Integration posture introspection | ✅ | `lib/integrations/status` — per-port mock/live mode + which env vars are set |
| Version / build stamping | ✅ | `APP_VERSION` from `VERCEL_GIT_COMMIT_SHA`, surfaced in probes |
| Metrics (Prometheus/OTel) | ❌ | No metrics/traces export yet |
| Centralised log shipping / SIEM | ❌ | Logs are stdout JSON; no aggregator/SIEM wired |
| DR / backup runbook, on-call/SLA | ❌ | Not defined |

## 3. Deployment-grade

| Criterion | Status | Evidence / gap |
|---|---|---|
| Reproducible build | ✅ | `next build` green; Node 20/22 CI matrix |
| CI quality gates | ✅ | lint + typecheck + build + unit tests + coverage on `main` and `claude/**` |
| Fail-soft on dependency outage | ✅ | Login, root page, dashboards and Supabase-backed getters degrade gracefully when the DB is unreachable (no crash) |
| Health/readiness for the load balancer | ✅ | `/api/live`, `/api/ready` (this change) |
| Documented env contract | ✅ | `lib/env` + this doc + `docs/CREDENTIALS.md` |
| Seed/runbook for first deploy | ✅ | `pnpm db:seed:auth` (auth + profiles); SQL seeds for org/data |
| Container/IaC + sovereign hosting | ❌ | Runs on Vercel + Supabase (managed, **non-sovereign**); no Dockerfile/IaC; TN SDC/MeitY target not provisioned |
| Secrets management (Vault/HSM) | ❌ | Env-var secrets only |
| Independent security + a11y audit | ❌ | Not performed |

---

## Honest overall verdict

This repository is a **broad, well-tested MVP with a production-leaning architecture**
and now has **real operability primitives** (structured logging, liveness/readiness
probes, env validation) and a **proven durable-persistence pattern** with one reference
module (Safety) fully converted.

It is **not yet** end-to-end production/government-grade. The largest remaining work is
mechanical and well-scoped: **persist the remaining ~70 interactive modules** onto the
existing store pattern, **enforce access control on every write**, **turn the mocked
India-Stack integrations live**, and make the **hosting/security/observability**
decisions (sovereign cloud, SIEM, metrics, DR, audits).

The probes tell the truth at any moment: `/api/ready` returns **degraded** while
persistence is in-memory and **ready** only when a durable database is attached.
