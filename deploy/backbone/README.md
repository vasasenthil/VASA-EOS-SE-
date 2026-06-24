# Make the deployed Vercel site fully live (hosted backbone)

The Vercel deployment renders all routes, but the **durable modules show "Backbone not connected"** because no
`PLATFORM_URL` is set there — Vercel only runs the Next.js console, not the Go backbone. To make every durable
module click-to-persist on the deployed URL you need a **publicly reachable `platformd` + PostgreSQL**, then point
Vercel at it. This folder is everything needed.

```
┌────────────────────┐         PLATFORM_URL (https)         ┌──────────────────────────┐
│  Vercel (Next.js)  │ ───────────────────────────────────▶│  platformd (Go backbone) │
│  the console/UI    │   server actions fetch the backbone  │  + PostgreSQL (durable)  │
└────────────────────┘                                      └──────────────────────────┘
```

The wiring already exists in code: `lib/platform-client.ts` reads `process.env.PLATFORM_URL`; when it is set,
every wired server action drives the backbone instead of the in-memory/demo path. So this is purely a hosting +
one-env-var step.

## Option 1 — Render blueprint (fastest path to a public HTTPS URL)

1. Render dashboard → **New → Blueprint** → connect this repo. It reads [`render.yaml`](./render.yaml) and
   provisions a free PostgreSQL + a Docker web service running `Dockerfile.platformd` with a `/healthz` check.
2. When it goes green, copy the service URL, e.g. `https://vasa-eos-platformd.onrender.com`.
   Verify: `curl https://vasa-eos-platformd.onrender.com/healthz` and
   `curl https://vasa-eos-platformd.onrender.com/audit?limit=1` (chain `intact: true`).
3. In **Vercel → Project → Settings → Environment Variables** (Production) add:
   | Key | Value |
   |-----|-------|
   | `PLATFORM_URL` | `https://vasa-eos-platformd.onrender.com` |
   | `PLATFORM_DEFAULT_ORG` | `TN-DIST-Chennai` |
4. **Redeploy** the Vercel project (Deployments → Redeploy). The 20 durable modules are now live and persistent.

## Option 2 — any Docker host / VM (full control)

```bash
cd deploy/backbone
cp .env.example .env          # set a real POSTGRES_PASSWORD
docker compose up --build -d  # db + platformd
```
Put a TLS reverse proxy (Caddy/nginx/Cloudflare) in front of `:8080`, then set `PLATFORM_URL` to that HTTPS URL
in Vercel exactly as in Option 1, step 3–4.

## Managed Postgres (recommended for a real pilot)

Instead of the bundled `db` container, point `DATABASE_URL` at a managed Postgres (Neon / Supabase / RDS). The
backbone **self-migrates** — every adapter runs `CREATE TABLE IF NOT EXISTS` on boot — so no manual schema step.
The schema is created and seeded on first start (seeds run only when a table is empty).

```
DATABASE_URL=postgres://USER:PASS@HOST:5432/DB?sslmode=require
```

## Health & verification endpoints

- `GET /healthz` — liveness (used by Render's health check).
- `GET /audit?limit=1` — the hash-chained audit trail with a live integrity check (`intact: true`).
- `GET /attendance?scope=TN&date=2026-06-10` — should report `schools: 4` once seeded (multi-school roll-up).

## Security note (read before exposing publicly)

`platformd` is a **demo/reference** backbone: its mutating endpoints are **unauthenticated** and its data is
**synthetic** (`SYN-…`, never real PII). Exposing it publicly is fine for a live demo, but a real deployment must
put an auth gateway in front (and the sovereign-cluster topology — HSM, data-residency, real DPI credentials — is
deliberately out of scope; see `deploy/pilot/PILOT.md`). Never load real student PII into a publicly-exposed demo
backbone.
