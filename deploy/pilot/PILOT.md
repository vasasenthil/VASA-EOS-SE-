# Single-District Pilot — go-live runbook

This is the package that takes VASA-EOS(SE)-TN from "reference implementation" to **one real
district running it as its durable system of record.** It removes every *technical* barrier to a
pilot; the non-technical steps (the district MOU, loading real rolls, live DPI credentials) are
called out honestly at the end.

## What you get

One command brings up a durable, district-scoped deployment:

```
cd deploy/pilot
cp .env.example .env          # set PILOT_DISTRICT (e.g. TN-DIST-Madurai) + a real Postgres password
docker compose up --build     # db + platformd + web console
```

| Service | URL | What it is |
|---|---|---|
| **web** | http://localhost:3000 | Console — login + governance/IAM/admission/leave/grievance boards |
| **platformd** | http://localhost:8080 | The Go backbone — all 20 constraint-checked verticals, **durable** |
| **db** | (internal) | PostgreSQL 16 — the system of record, persisted in a named volume |

`platformd` **self-migrates** on boot (every adapter runs `CREATE TABLE IF NOT EXISTS`) and seeds
the chosen district, so there is no manual schema step. The web console routes its wired server
actions (leave approval, grievance) to `platformd` via `PLATFORM_URL`, so the frontend genuinely
drives the durable backend — not an in-memory path.

## Point it at YOUR district

`PILOT_DISTRICT` selects the district the deployment goes live for — no code change. The
materialised tenancy tree carries all 38 TN districts; set e.g. `PILOT_DISTRICT=TN-DIST-Madurai`
and every vertical seeds and scopes against Madurai. (Default: `TN-DIST-Chennai`.)

## Log in

Demo mode honours a public demo sign-in (gates nothing sensitive). Any identity below + password
**`Vasa@Edu#2026`** — e.g. `deo-chennai@vasa-eos.tn.gov.in` (District Education Officer, the right
seat for a district pilot), `principal-egmore@…`, `teacher-egmore@…`. Full list in
`lib/demo-auth/index.ts`.

## Verify it's live + durable

```
./smoke.sh        # 20 vertical dashboards return 200 with district-scoped data,
                  # then proves a written value survives a platformd restart
```

Or by hand:
```
curl 'http://localhost:8080/establishment?scope=TN-DIST-Madurai'   # sanctioned vs filled, vacancy roster
curl 'http://localhost:8080/fees?scope=TN-DIST-Madurai'            # collection %, defaulters
curl 'http://localhost:8080/transport?scope=TN-DIST-Madurai'       # capacity + unserviceable-route safety roster
#   …and /mdm /ptm /immunisation /entitlement /infra /timetable /library /rbsk /grievance
```

## What is REAL in this pilot vs what still needs you

| Real now (turnkey) | Needs a non-technical step you provide |
|---|---|
| Durable Postgres system of record for the district | The district MOU / authorisation to operate |
| All 20 verticals enforcing their invariants, audited | Loading the district's **real** rolls (replace synthetic `SYN-` seeds) |
| Tamper-evident audit hash-chain | Real SSO/MFA (swap demo-auth for the district IdP / Supabase Auth) |
| Jurisdiction-scoped (ReBAC) dashboards | **Live** DPI federation — DIKSHA/UDISE+/APAAR/PFMS default to `mock`; flip to `live` with real credentials (`lib/integrations/config.ts`) |
| Statutory policy-as-code (RTE/DPDP/POCSO/RPwD/PFMS-GFR/RTI) | Sovereign-cluster topology — HSM/key custody, data residency (disclosed-pending) |

## Going fully live (real auth + real data)

1. **Auth + app DB:** create a Supabase project, set `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` on `web`, and
   `NEXT_PUBLIC_DEMO_MODE=false`. Apply `scripts/bootstrap.sql` to it once.
   Point `platformd`'s `DATABASE_URL` at the **same** Supabase Postgres connection string so the
   web app and the backbone share one durable database.
2. **Real rolls:** replace the synthetic seed with the district's actual school/student/staff
   register (the seeds are the only place `SYN-` ids appear).
3. **DPI:** set each integration to `live` and supply the sandbox/production endpoints + credentials.

---

**Why this is the highest-leverage artifact in the repo:** the moat (proprietary data + switching
cost) is latent until a real district runs this. This package is what makes that first run a
one-command operation instead of a project. The day real students are in it, the moat is real.
