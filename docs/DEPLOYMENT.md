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

## Go-live checklist (requires Government action)
1. **Provision the sovereign data store** — managed Postgres on TN SDC / MeghRaj; set
   `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; run migrations `001`–`018`; enable RLS per tenant.
2. **Stand up Auth** — Supabase-compatible Auth / state SSO + MFA; seed roles (`pnpm db:seed:auth`).
3. **Flip integrations port-by-port** — see `/governance/go-live`: obtain MoU/sandbox/keys, set
   `*_BASE_URL` + `*_API_KEY`, then `INTEGRATION_<PORT>=live`. (DIKSHA needs no MoU.)
4. **Build & push the image** — `docker build -t registry.tn.gov.in/vasa-eos-se:1.0.0 .` to the sovereign registry.
5. **Apply IaC** — fill `deploy/terraform` provider blocks, set the Secret, `terraform apply`; or `kubectl apply -f deploy/k8s`.
6. **Wire observability** — point `OTEL_EXPORTER_OTLP_ENDPOINT` at the collector; ship logs to the SIEM.
7. **Security hardening (infra)** — WAF, mTLS at the mesh, Vault/HSM for secrets, network policies.
8. **Assurance** — independent SAST/DAST + pen-test, WCAG 2.2 audit, DR drill against `lib/ops-posture` targets.

## Honest scope line
**Application + architecture = production-grade and in this repo.**
**Credentials, sovereign hosting, and assurance = Government-provided, tracked in `/governance/go-live` and this runbook.**
