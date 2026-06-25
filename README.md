# VASA-EOS-SE-

[![CI](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/ci.yml/badge.svg)](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/ci.yml)
[![platform](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/platform.yml/badge.svg)](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/platform.yml)
[![security](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/security.yml/badge.svg)](https://github.com/vasasenthil/VASA-EOS-SE-/actions/workflows/security.yml)

Education operating system for secondary education.

An AI-native, India-Stack-aligned education OS. Every external dependency runs
behind a typed port with a working mock and a real HTTP-backed adapter, so the
platform runs end-to-end with **no credentials** and flips to live providers via
environment variables — no code change.

## Two artifacts in this repo

1. **Reference app** (`app/`, `lib/`) — the Next.js TN platform (13 portals, demo login). `pnpm dev` below;
   demo creds in [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md).
2. **CC-SPEC-001 polyglot platform** (`platform/`, `policies/`) — the sovereign DPI built per CC-SPEC-001:
   **27 Go modules + a Rego policy plane**, gated by the `platform` CI above (`go vet`/`go test` ×27, `opa
   test` 28/28). Layers L1–L12 are wired into one runnable service by `platform/integration`, and
   **`platformd`** serves the end-to-end workflows live.

### Run the merged platform (`platformd`)
A container image is built and published by CI on every push to `main`:
```bash
docker pull ghcr.io/vasasenthil/vasa-platformd:latest
docker run -p 8080:8080 ghcr.io/vasasenthil/vasa-platformd:latest   # → http://localhost:8080/
# or from source:  cd platform/integration && go run ./cmd/platformd
```
Open `/` for a one-click console (admission · tutor · readiness · `/metrics`). See
[`platform/integration/cmd/platformd/README.md`](platform/integration/cmd/platformd/README.md). Build status
of the whole platform: [`public/platform-status.html`](public/platform-status.html).

> The GHCR package defaults to **private** — set the `vasa-platformd` package visibility to public (or
> `docker login ghcr.io`) to pull without auth. This is a demo image (in-process, no HSM/datastores); the
> sovereign production deployment runs in the commissioned TN cluster (BLOCKERS B-001/B-010).

## Getting started

```bash
pnpm install --no-frozen-lockfile
pnpm dev      # http://localhost:3000

pnpm run lint && pnpm run typecheck && pnpm run build
pnpm run test:coverage   # 95 unit tests + enforced coverage thresholds (Node >= 22.6)
```

## Documentation

Start at the **[docs/](docs/README.md)** landing page (index + repo diagram), or jump in:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — layers, the `lib/` module map,
  routing model, the integration seam, and the testing architecture.
- **[docs/MODULES.md](docs/MODULES.md)** — per-module reference: purpose, key exports,
  route, and persistence for each `lib/` module.
- **[docs/SECURITY.md](docs/SECURITY.md)** — security & privacy deep-dive: the 5-model
  access PDP, the tamper-evident audit chain, the DPDP consent ledger, tenant
  isolation, and the zero-trust posture.
- **[docs/OPERATIONS.md](docs/OPERATIONS.md)** — go-live runbook: the integration
  env-var matrix, Supabase setup, the feature-flag posture, and security/privacy notes.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — setup, the gate, and the conventions that
  keep the build green (server-action rules, client/server split, the live-adapter
  and test patterns).
- **[docs/TRACEABILITY.md](docs/TRACEABILITY.md)** — dossier sections / flagships →
  implementing modules, routes, and tests.
- **[docs/ADR.md](docs/ADR.md)** — architecture decision log (mock adapters, the
  client/server split, the persistence seam, hash-chained audit, the 5-model PDP, the
  test runner, and CI/coverage).
- **[docs/STATUS.md](docs/STATUS.md)** — completion & pending register: the full
  delivery timeline and what's done vs pending against the master document.

In-app operational surfaces:

- **`/integrations`** — each port's live/mock mode and configuration readiness.
- **`/health`** — live self-tests of the core guardrails (access PDP, audit chain,
  assessment / knowledge-graph / credential logic) plus persistence posture.
