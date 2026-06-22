# Deploying VASA-EOS(SE)-TN — getting a live login URL

The platform is two stacks. This guide gets the **web app** live on a public URL in **demo
mode** (no database required), which is what you log into to review the platform.

| Stack | What it is | This guide |
|---|---|---|
| **Next.js reference app** | The web UI (governance, IAM, admission, leave, grievance boards, `/governance/brochure-coverage`, `/platform-status.html`) | ✅ deploys to Vercel below |
| **Go `platformd` backbone** | The durable engine behind the 20 verticals (Postgres-backed HTTP) | runs locally / in CI; optional hosted setup at the bottom |

---

## 1. Web app → Vercel (recommended, ~3 minutes)

The repo is already Vercel-ready: [`vercel.json`](./vercel.json) sets the Next.js build and
bakes `NEXT_PUBLIC_DEMO_MODE=true`, so the public demo login works **without any database**.

### Option A — Vercel native Git integration (simplest, no secrets)
1. Go to <https://vercel.com/new> and **Import** this Git repository.
2. Framework preset: **Next.js** (auto-detected). Leave the build settings as-is — `vercel.json`
   already provides the install/build commands and the demo-mode env.
3. Click **Deploy**. Vercel builds and gives you a production URL like
   `https://<your-project>.vercel.app`, and re-deploys automatically on every push to the
   default branch.

### Option B — CI-driven deploy (this repo's `deploy.yml` workflow)
Use this only if you want GitHub Actions to drive the deploys.
1. Run `vercel link` locally once to create `.vercel/project.json` (gives you the ORG/PROJECT ids),
   or copy them from the Vercel project settings.
2. Add three **repo secrets** (Settings → Secrets and variables → Actions):
   `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
3. Push to `main` / `claude/platform-foundation`. The [`deploy`](./.github/workflows/deploy.yml)
   workflow builds and deploys, and prints the production URL in the job summary.
   *(Until those secrets exist, the workflow safely no-ops — merging it changes nothing.)*

### Log in
Demo mode honours a public demo sign-in (gates nothing sensitive). Use any of these identities
with the password **`Vasa@Edu#2026`**:

| Email | Role it lands on |
|---|---|
| `minister@vasa-eos.tn.gov.in` | Minister |
| `secretary@vasa-eos.tn.gov.in` | Secretary |
| `admin@vasa-eos.tn.gov.in` | Admin (super-admin console) |
| `deo-chennai@vasa-eos.tn.gov.in` | District Education Officer |
| `principal-egmore@vasa-eos.tn.gov.in` | Principal |
| `teacher-egmore@vasa-eos.tn.gov.in` | Teacher |
| `parent-aarthi@vasa-eos.tn.gov.in` | Parent |

(Full list in [`lib/demo-auth/index.ts`](./lib/demo-auth/index.ts) / `docs/CREDENTIALS.md`.)

> **What demo mode shows:** representative seed data for the governance / IAM / admission /
> leave / grievance boards, plus `/platform-status.html` (the index of all 70 modules) and
> `/governance/brochure-coverage` (the self-verifying register). It does **not** connect to the
> Go backbone — for the live durable verticals run the full stack (below).

### Connecting a real database (optional, leaves demo mode)
Set these in the Vercel project's Environment Variables and the app switches from demo to live:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
set `NEXT_PUBLIC_DEMO_MODE=false`. Apply `scripts/bootstrap.sql` to the database first.

---

## 2. Full stack locally (web app + the 20 durable Go verticals)

```bash
# Terminal 1 — the web app
pnpm install
pnpm dev                       # http://localhost:3000  (login with the demo creds above)

# Terminal 2 — the durable backbone (needs a Postgres; apply scripts/bootstrap.sql once)
cd platform/integration
DATABASE_URL='postgres://USER@HOST:5432/DBNAME?sslmode=disable' go run ./cmd/platformd
#   → http://localhost:8080 — try the scoped dashboards:
#     curl 'http://localhost:8080/establishment?scope=TN-DIST-Chennai'
#     curl 'http://localhost:8080/fees?scope=TN-DIST-Chennai'
#     curl 'http://localhost:8080/ptm?scope=TN-DIST-Chennai'   # …and /mdm /transport /immunisation /entitlement /infra /timetable /library
```

`Dockerfile.platformd` builds the backbone as a container if you'd rather host it
(Fly/Render/Railway + a managed Postgres), then point the web app's platform-client at it.
