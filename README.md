# VASA-EOS-SE-

Education operating system for secondary education.

An AI-native, India-Stack-aligned education OS. Every external dependency runs
behind a typed port with a working mock and a real HTTP-backed adapter, so the
platform runs end-to-end with **no credentials** and flips to live providers via
environment variables — no code change.

## Getting started

```bash
pnpm install --no-frozen-lockfile
pnpm dev      # http://localhost:3000

pnpm run lint && pnpm run typecheck && pnpm run build
pnpm run test:coverage   # 95 unit tests + enforced coverage thresholds (Node >= 22.6)
```

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — layers, the `lib/` module map,
  routing model, the integration seam, and the testing architecture.
- **[docs/OPERATIONS.md](docs/OPERATIONS.md)** — go-live runbook: the integration
  env-var matrix, Supabase setup, the feature-flag posture, and security/privacy notes.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — setup, the gate, and the conventions that
  keep the build green (server-action rules, client/server split, the live-adapter
  and test patterns).

In-app operational surfaces:

- **`/integrations`** — each port's live/mock mode and configuration readiness.
- **`/health`** — live self-tests of the core guardrails (access PDP, audit chain,
  assessment / knowledge-graph / credential logic) plus persistence posture.
