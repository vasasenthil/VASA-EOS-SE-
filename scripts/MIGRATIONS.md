# Migration replay report & supported bootstrap

> Evidence-backed manifest for standing up a **fresh** durable database. The
> running app does **not** execute migrations at runtime — it connects to an
> already-migrated Supabase project — so this matters only when bootstrapping a
> new environment from empty.

Verified by applying each script to a live **PostgreSQL 16** instance with
`psql -v ON_ERROR_STOP=1` (the same engine Supabase runs).

## Supported bootstrap (verified clean, in order)

Run these on a fresh database to get the full durable runtime schema:

```
001-create-policies-table.sql
002-create-tracking-tables.sql
003-create-milestones-table.sql
004-create-challenges-table.sql
005-create-stakeholders-table.sql
006-update-policies-file-storage.sql
007-add-policy-version-history.sql
013-mvp-initial-schema.sql
014-enable-rls-and-policies.sql
015-persist-interactive-modules.sql
019-tenant-rls.sql
020-agent-tool-requests.sql
021-create-workflow-flow-tables.sql
022-create-forum-flow-table.sql
023-create-operational-module-tables.sql
024-create-remaining-store-tables.sql
```

This produces the durable runtime schema, including the seven workflow-backed
flow tables (`recognition_flows`, `grievance_flows`, `admission_flows`,
`leave_flows`, `smc_flows`, `maintenance_flows`, `forum_flows`) and 43
operational-module tables (Safety, CWSN, Discipline, visitors, water tests,
drills, library, MDM, notices, …). `023` must run after `019` — its
tenant_isolation policies use `public.in_tenant_subtree` from `019`. Confirm the
workflow tables afterwards with `pnpm db:verify`.

> **Supabase prerequisites:** these scripts assume the `auth` schema,
> `auth.users`, `auth.uid()`, `auth.role()` and the `anon` / `authenticated` /
> `service_role` roles already exist — **Supabase provides all of these by
> default**, so no extra step is needed there. (For the vanilla-Postgres
> verification above, a small shim reproduced that Supabase baseline.)

## Not in the bootstrap (and why)

These were found to fail a clean fresh replay. They are **legacy or optional**
and are intentionally excluded from the supported path; they remain in the tree
as the historical record of how the production database evolved. Do **not**
rewrite them without reconciling against the live database's actual state.

| Script | Status | Reason |
| --- | --- | --- |
| `008-create-governance-rbac-tables.sql` | legacy | Superseded by `013-mvp-initial-schema`. Has a PL/pgSQL bug (loop variable on line ~33 not declared as a record). |
| `009-dynamic-stakeholder-attributes.sql` | legacy | Calls `trigger_set_updated_at()`, which no migration defines (the helper `008` defines is `trigger_set_timestamp()`). |
| `010-define-education-governance-tiers.sql` | legacy seed | Re-seeds `governance_tiers` (duplicate `level_order`); not idempotent. |
| `011-create-scheme-management-tables.sql` | legacy | FK depends on tables from the failed `008`/`010`. |
| `012-seed-scheme-data.sql` | legacy seed | Depends on `011`'s tables. |
| `016-seed-org-and-users.sql` | broken demo seed | Inserts `users.status`, a column the `013` schema does not define. |
| `018-add-tenant-scoping.sql` | superseded | Tried to add `tenant_id` to operational tables that did not yet exist; `023` now creates those tables with `tenant_id` and the tenant policy directly. |
| `012`, `017` | optional seeds | Demo/sample data, not required for a durable schema. |

### Coverage

`023` covers 43 operational stores; `024` covers the remaining five tenant-scoped
operational stores (`distribution`, `promotion_runs`, `question_papers`,
`seating_plans`, `stock_movements`) plus the two user-context system tables
(`audit_logs`, `notifications`, governed by an own-row `auth.uid()` policy).
**Every store that performs writes now has a durable table.** A few names that
appear only in read paths (`challenges`, `reports`, `stakeholders`) resolve to
tables owned by other migrations and need no new table.

## Security posture (verified)

After bootstrap, the six flow tables have row-level security **enabled with no
public policy**: a `service_role` insert round-trips durably, while an `anon`
`SELECT` returns **zero rows** — deny-by-default protection for the applicant /
grievance / staff PII. The service-role (trusted server identity) bypasses RLS
and performs the app's own ReBAC scoping.
