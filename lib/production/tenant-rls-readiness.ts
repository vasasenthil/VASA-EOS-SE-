import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

export interface TenantRlsReadinessReport {
  ok: boolean
  blanketRlsMigration: boolean
  tenantContextFunction: boolean
  blanketTenantPolicyMigration: boolean
  createdTables: number
  rlsEnabledTables: number
  tenantScopedTables: string[]
  tenantPolicyTables: string[]
  missingRlsTables: string[]
  missingTenantPolicyTables: string[]
}

function readSqlCorpus(rootDir: string): string {
  const scriptsDir = path.join(rootDir, "scripts")
  if (!existsSync(scriptsDir)) return ""
  return readdirSync(scriptsDir)
    .filter((file) => /^\d{3}.*\.sql$/.test(file))
    .sort()
    .map((file) => readFileSync(path.join(scriptsDir, file), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function sorted(values: Set<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function verifyTenantRlsReadiness(rootDir = process.cwd()): TenantRlsReadinessReport {
  const sql = readSqlCorpus(rootDir)
  const created = new Set<string>()
  for (const match of sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)) created.add(match[1])

  const rls = new Set<string>()
  for (const match of sql.matchAll(/alter table (?:if exists )?public\.([a-z0-9_]+) enable row level security/g)) rls.add(match[1])
  if (/%i enable row level security/.test(sql)) for (const match of sql.matchAll(/'([a-z0-9_]+)'/g)) rls.add(match[1])

  const tenantScoped = new Set<string>()
  for (const match of sql.matchAll(/create table if not exists public\.([a-z0-9_]+)\s*\((?:(?!create table if not exists).)*?tenant_id\s+text/g)) tenantScoped.add(match[1])

  const tenantPolicies = new Set<string>()
  for (const match of sql.matchAll(/create policy [a-z0-9_]+ on public\.([a-z0-9_]+)[^;]+public\.in_tenant_subtree\(tenant_id\)/g)) tenantPolicies.add(match[1])

  const blanketRlsMigration = /from pg_tables where schemaname = 'public'/.test(sql) && /enable row level security/.test(sql)
  const tenantContextFunction = /create or replace function public\.in_tenant_subtree/.test(sql) && /current_setting\('app\.tenant_ids'/.test(sql)
  const blanketTenantPolicyMigration = /information_schema\.columns/.test(sql) && /column_name = 'tenant_id'/.test(sql) && /create policy tenant_isolation on public\.%i for all using \(public\.in_tenant_subtree\(tenant_id\)\) with check \(public\.in_tenant_subtree\(tenant_id\)\)/.test(sql)
  const missingRlsTables = sorted(new Set([...created].filter((table) => !rls.has(table) && !blanketRlsMigration)))
  const missingTenantPolicyTables = blanketTenantPolicyMigration ? [] : sorted(new Set([...tenantScoped].filter((table) => !tenantPolicies.has(table))))

  return {
    ok: created.size > 0 && blanketRlsMigration && tenantContextFunction && blanketTenantPolicyMigration && missingRlsTables.length === 0 && missingTenantPolicyTables.length === 0,
    blanketRlsMigration,
    tenantContextFunction,
    blanketTenantPolicyMigration,
    createdTables: created.size,
    rlsEnabledTables: rls.size,
    tenantScopedTables: sorted(tenantScoped),
    tenantPolicyTables: sorted(tenantPolicies),
    missingRlsTables,
    missingTenantPolicyTables,
  }
}
