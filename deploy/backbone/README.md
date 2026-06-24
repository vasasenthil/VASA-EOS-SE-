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
3. Copy the auto-generated **`PLATFORM_API_TOKEN`** from the Render `vasa-eos-platformd` service
   (Environment tab) — the auth gateway requires it on every write.
4. In **Vercel → Project → Settings → Environment Variables** (Production) add:
   | Key | Value |
   |-----|-------|
   | `PLATFORM_URL` | `https://vasa-eos-platformd.onrender.com` |
   | `PLATFORM_DEFAULT_ORG` | `TN-DIST-Chennai` |
   | `PLATFORM_API_TOKEN` | *(the SAME value as Render's — so the console can write)* |
5. **Redeploy** the Vercel project (Deployments → Redeploy). The 20 durable modules are now live and persistent.

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

## Auth gateway (built in)

`platformd` has a built-in authentication gateway. When **`PLATFORM_API_TOKEN`** is set, every state-changing
request (POST/PUT/PATCH/DELETE) must carry `Authorization: Bearer <token>`; safe reads (GET/HEAD) and `/healthz`
stay open so dashboards and health checks keep working. Set the **same** token on both `platformd` and the Vercel
project (`PLATFORM_API_TOKEN`) — the console's server actions send it automatically (server-side only; it is never
exposed to the browser). When the var is unset the gate is a no-op (fully-open local demo). Verify:

```bash
curl -X POST https://vasa-eos-platformd.onrender.com/attendance -d '{}'           # -> 401 unauthorized
curl -X POST -H "Authorization: Bearer $TOKEN" https://…/attendance -d '{...}'      # -> 200
curl https://…/attendance?scope=TN&date=2026-06-10                                  # -> 200 (reads open)
```

## Security note (read before exposing publicly)

The auth gateway protects the mutating surface, but `platformd` is still a **demo/reference** backbone over
**synthetic** data (`SYN-…`, never real PII). The bearer token is a single shared secret, not per-user identity;
a real deployment would add per-user auth, rate limiting and the sovereign-cluster topology (HSM, data-residency,
real DPI credentials — deliberately out of scope; see `deploy/pilot/PILOT.md`). Never load real student PII into a
publicly-exposed demo backbone.
