# VASA-EOS(SE) — User Categories, Hierarchy & Demo Credentials

The categories and types of users across the Tamil Nadu school-education governance
hierarchy, each bound to an organisational unit ([Government Structure](../app/governance/org)
· `/governance/org`) and to the five access models. Browse live at
**`/governance/directory`**; verify any decision at **`/governance/access`**.

> ⚠️ **Security.** The password below is a **single shared DEMO password** for the
> non-production seed only. Production uses **SSO / Supabase Auth + MFA**, per-user
> credentials, and **never** ships passwords. Rotate immediately for any real deployment.

**Demo password (all demo users):** `Vasa@Edu#2026`
**Sign-in id:** the `username` shown (or its `@vasa-eos.tn.gov.in` email).

## How the five IAM models bind to a user

- **RBAC** — the user's portal **role** maps to action grants (`config/portals` →
  `DEFAULT_GRANTS`). Shown per user below.
- **ABAC** — **attributes** (district, block, cluster, school, cadre, subject) scope
  decisions.
- **ReBAC** — **relations** (e.g. `teaches: 33010100101:9A`, `parentOf: APAAR-…`)
  grant relationship-based access.
- **PBAC** — deny policies (suspended account; PUBLIC ≠ sensitive; RESEARCHER ≠ PII)
  win over any grant (deny-wins, fail-closed).
- **CABAC** — context (emergency window, threat level) gates elevated actions.

`resolveSubject()` maps the signed-in user (role + `school_id` from the `users` table,
seeded by `scripts/016-seed-org-and-users.sql`) into the PDP `Subject`; high-stakes
server actions call `requireAccess()`.

## Credential register (by hierarchy level)

### Executive / State

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| Hon'ble Minister (School Education) | `minister` / minister@vasa-eos.tn.gov.in | MINISTER | School Education Department, Govt of Tamil Nadu | read:executive, read:constituency |
| Secretary, School Education | `secretary` / secretary@vasa-eos.tn.gov.in | SECRETARY | School Education Secretariat (Fort St. George) | read:state, read:compliance, read:scheme |
| Platform Administrator | `admin` / admin@vasa-eos.tn.gov.in | ADMIN | VASA-EOS Programme Management Unit | * (all) |

### National / Ecosystem

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| EdTech Vendor (NEAT) | `vendor-neat` / vendor-neat@vasa-eos.tn.gov.in | VENDOR | VASA-EOS Programme Management Unit | read:sandbox, report:outcome |
| Education Researcher | `researcher` / researcher@vasa-eos.tn.gov.in | RESEARCHER | TN State Council of Educational Research & Training | read:anonymised |

### Directorate

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| Director of School Education | `dir-dse` / dir-dse@vasa-eos.tn.gov.in | DIRECTOR | Directorate of School Education | read:directorate, read:statutory |
| Director of Elementary Education | `dir-dee` / dir-dee@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Elementary Education | read:directorate, read:statutory |
| Director of Government Examinations | `dir-dge` / dir-dge@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Government Examinations | read:directorate, read:statutory |
| Director of Matriculation Schools | `dir-dms` / dir-dms@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Matriculation Schools | read:directorate, read:statutory |
| Director of Teacher Education (SCERT) | `dir-dtert` / dir-dtert@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Teacher Education, Research & Training (SCERT) | read:directorate, read:statutory |
| Director of Non-Formal Education | `dir-dnfe` / dir-dnfe@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Non-Formal & Adult Education | read:directorate, read:statutory |
| Director of Private Schools | `dir-dpse` / dir-dpse@vasa-eos.tn.gov.in | DIRECTOR | Directorate of Private Schools & Pre-Primary Education | read:directorate, read:statutory |

### District

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| District Education Officer — Chennai | `deo-chennai` / deo-chennai@vasa-eos.tn.gov.in | DEO | District Education Office — Chennai | read:district, allocate:resource, read:scheme, approve:recognition, resolve:grievance |

### Block

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| Block Education Officer — Egmore | `beo-egmore` / beo-egmore@vasa-eos.tn.gov.in | BEO | Block Education Office — Egmore | read:block, schedule:inspection, read:scheme, resolve:grievance |

### Cluster

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| CRC Coordinator — Egmore | `crcc-egmore` / crcc-egmore@vasa-eos.tn.gov.in | CRCC | Cluster Resource Centre — Egmore | read:cluster, write:visit, read:nipun |

### School

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| Principal — GHSS Egmore | `principal-egmore` / principal-egmore@vasa-eos.tn.gov.in | PRINCIPAL | GHSS Egmore | manage:school, read:class, manage:staff, read:compliance, create:proposal, vote:smc, resolve:grievance, manage:meals |
| Academic Head — GHSS Egmore | `acadhead-egmore` / acadhead-egmore@vasa-eos.tn.gov.in | ACADEMIC_HEAD | GHSS Egmore | manage:curriculum, read:assessment |
| Subject In-charge (Maths) | `subinch-maths` / subinch-maths@vasa-eos.tn.gov.in | SUBJECT_INCHARGE | GHSS Egmore | read:class, manage:curriculum |
| Institution Head — GHSS Egmore | `insthead-egmore` / insthead-egmore@vasa-eos.tn.gov.in | INSTITUTION_HEAD | GHSS Egmore | read:strategy, manage:policy |
| Teacher — Class 9-A | `teacher-egmore` / teacher-egmore@vasa-eos.tn.gov.in | TEACHER | GHSS Egmore | read:class, write:attendance, write:assessment, read:cpd · ReBAC: teaches 9-A |
| Aarthi M (Class 9-A) | `student-aarthi` / student-aarthi@vasa-eos.tn.gov.in | STUDENT | GHSS Egmore | read:self, read:learning, read:credentials, manage:consent |
| Guardian of Aarthi M | `parent-aarthi` / parent-aarthi@vasa-eos.tn.gov.in | PARENT | GHSS Egmore | read:child, pay:fees, read:scheme, file:grievance, create:proposal, vote:smc, manage:consent · ReBAC: parentOf Aarthi |

### Citizen

| Name | Username / email | Role | Org unit | RBAC grants |
| --- | --- | --- | --- | --- |
| Citizen / Public | `public` / public@vasa-eos.tn.gov.in | PUBLIC | School Education Department, Govt of Tamil Nadu | read:public, file:rti, file:grievance |

## Seeding — make these logins actually work

The login form authenticates against **Supabase Auth** and then reads
`public.users WHERE id = <auth uuid>`. Two things must therefore exist for a sign-in
to succeed: (1) a **Supabase Auth account** for the email, and (2) a **profile row**
in `public.users` whose `id` equals that account's UUID. The raw SQL seed only does
half — it writes profile rows with string ids that never match an auth uuid — so the
one-step script below is the reliable path.

> **Important:** you must type the **full email** (e.g. `admin@vasa-eos.tn.gov.in`)
> in the Email box — a bare username is rejected because the field is `type="email"`.

### One-step seed (recommended)

`scripts/seed-auth-users.ts` creates/repairs all 23 demo accounts end to end —
Auth user + confirmed email + the shared password + the matching `public.users`
profile row keyed by the real UUID. It is **idempotent** (safe to re-run; it also
refreshes the password so the documented one always works).

```bash
# Server-side secrets — never commit these. Use your project's values.
export NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"   # admin key; bypasses RLS
export DEMO_PASSWORD="Vasa@Edu#2026"                    # optional; this is the default

pnpm db:seed:auth        # or: npx tsx scripts/seed-auth-users.ts
```

Prerequisite: a `public.users` table with columns `id (uuid, PK)`, `email`,
`full_name`, `role`, `school_id`, `status` (see `scripts/016-seed-org-and-users.sql`
for the shape). The script upserts on `id`.

After it prints `Done. 23 ready, 0 failed.`, sign in at `/login` with any email above
+ the demo password, choosing the matching role. `resolveSubject()` then binds the
sign-in to the access policy and `requireAccess()` enforces it on high-stakes actions.

### Manual alternative

Run `scripts/016-seed-org-and-users.sql` for the profile rows, then create matching
Auth users in the Supabase dashboard (Authentication → Users → Add user, "Auto
confirm"), and update each profile row's `id` to the new Auth UUID. The script above
does all of this for you.

### Security note

These are **demo-only** accounts sharing one password for a walkthrough. For any real
deployment: per-user credentials, SSO + MFA, no shared/default passwords, and rotate
the service-role key if it was ever exported to a shell.
