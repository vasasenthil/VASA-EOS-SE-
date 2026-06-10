# VASA-EOS(SE) TN — Deployment & Go-Live Runbook

This platform is **deployment-ready**: it builds a standalone container, runs durably
against a sovereign Postgres, and exposes health/readiness probes. What it does **not**
ship is anything that only the Government can provide — credentials, MoUs, sovereign
hosting, and security sign-off. This runbook makes go-live a wiring exercise.

## What's in the repo (buildable, here now)
- **`Dockerfile`** — multi-stage, non-root, Next.js **standalone** output (`next.config.mjs` `output: "standalone"`).
- **`docker-compose.yml`** — app + Postgres for local/on-prem durable runs.
- **`deploy/k8s/`** — Deployment (3 replicas, probes, hardened securityContext) + Service/Ingress (TLS).
- **`deploy/terraform/main.tf`** — provider-agnostic IaC skeleton (Postgres, compute, secrets, immutable backups).
- **Migrations** `scripts/001`–`018`, seed runbook (`pnpm db:seed:auth`), probes `/api/live|ready|health|metrics|traces`.
- **Posture as code** — SLO/DR (`lib/ops-posture`), OTLP tracing (`lib/tracing`), go-live tracker (`/governance/go-live`).
- **Real-data ingestion** — schema-driven, idempotent CSV adapters (`lib/ingestion`): UDISE+ schools, EMIS teachers, SIS students. Validation + dedup by natural key; live demo at `/governance/data-ingestion`. Swap the sample CSV for a real export — the adapter is unchanged.
- **Secrets seam** — `lib/secrets`: provider-abstracted retrieval, redaction, presence-only report, fail-closed required check (env today; Vault/KMS is the documented seam).
- **SIEM exporter** — `lib/observability/siem`: ECS-schema NDJSON, severity, endpoint-gated by `SIEM_ENDPOINT`.
- **Honest readiness scorecard** — `/governance/launch-readiness`: a self-verifying, quantified go/no-go register (currently ~39%, the gaps named below).

## Go-live checklist (requires Government action)
1. **Provision the sovereign data store** — managed Postgres on TN SDC / MeghRaj; set
   `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; run migrations `001`–`018`; enable RLS per tenant.
2. **Stand up Auth** — Supabase-compatible Auth / state SSO + MFA; seed roles (`pnpm db:seed:auth`).
3. **Load real data** — obtain the real exports and run them through `lib/ingestion`:
   UDISE+ school registry → `SCHOOL_SCHEMA`, EMIS teacher roster → `TEACHER_SCHEMA`, SIS enrolment →
   `STUDENT_SCHEMA`. The load is idempotent (re-running a refreshed export updates, never duplicates);
   invalid rows are reported and skipped. This is the step that moves "Real data" off 0% in the scorecard.
4. **Flip integrations port-by-port** — see `/governance/go-live`: obtain MoU/sandbox/keys, set
   `*_BASE_URL` + `*_API_KEY`, then `INTEGRATION_<PORT>=live`. (DIKSHA needs no MoU.)
5. **Build & push the image** — `docker build -t registry.tn.gov.in/vasa-eos-se:1.0.0 .` to the sovereign registry.
6. **Apply IaC** — fill `deploy/terraform` provider blocks, set the Secret, `terraform apply`; or `kubectl apply -f deploy/k8s`.
7. **Wire observability** — point `OTEL_EXPORTER_OTLP_ENDPOINT` at the collector; set `SIEM_ENDPOINT` so
   `lib/observability/siem` ships ECS/NDJSON events to the SIEM (Splunk/Elastic/Wazuh).
8. **Security hardening (infra)** — WAF, mTLS at the mesh, Vault/HSM behind the `lib/secrets` seam, network policies.
9. **Assurance** — independent SAST/DAST + pen-test, DPDP audit (children's data), WCAG 2.2 audit, DR drill
   against `lib/ops-posture` targets. Track the whole list live at `/governance/launch-readiness`.

## Honest scope line
**Application + architecture = production-grade and in this repo.**
**Credentials, sovereign hosting, and assurance = Government-provided, tracked in `/governance/go-live` and this runbook.**
