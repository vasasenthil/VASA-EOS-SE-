import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Phase-0 production-hardening gate: EVERY table created in a migration must have row-level security
// enabled somewhere in the migration set. Government-grade posture is deny-by-default RLS on every
// table; this test makes that claim verifiable and prevents a new table from silently shipping
// without RLS. It understands both forms used in the repo:
//   (a) direct:   alter table [if exists] public.<t> ... enable row level security;
//   (b) dynamic:  a do-$$ loop that runs `... %I enable row level security` over an array of names.

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts")

function readAllSql(): string {
  return readdirSync(scriptsDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(scriptsDir, f), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ") // normalise newlines so multi-line statements match
}

function createdTables(sql: string): Set<string> {
  const set = new Set<string>()
  for (const m of sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)) set.add(m[1])
  return set
}

function rlsEnabledTables(sql: string): Set<string> {
  const set = new Set<string>()
  // (a) direct alter-table … enable row level security
  for (const m of sql.matchAll(/alter table (?:if exists )?public\.([a-z0-9_]+) enable row level security/g)) set.add(m[1])
  // (b) dynamic do-loop: collect quoted identifiers when the file enables RLS via format(%I …)
  if (/%i enable row level security/i.test(sql)) {
    for (const m of sql.matchAll(/'([a-z0-9_]+)'/g)) set.add(m[1])
  }
  return set
}

test("every migration-created table has row-level security enabled (100% RLS coverage)", () => {
  const sql = readAllSql()
  const created = createdTables(sql)
  const rls = rlsEnabledTables(sql)
  assert.ok(created.size >= 100, `expected the full table set, found ${created.size}`)
  const missing = [...created].filter((t) => !rls.has(t)).sort()
  assert.deepEqual(missing, [], `tables missing RLS deny-by-default: ${missing.join(", ")}`)
})

test("the previously-missing agent_tool_requests table is now RLS-gated", () => {
  const sql = readAllSql()
  assert.ok(rlsEnabledTables(sql).has("agent_tool_requests"), "agent_tool_requests must have RLS enabled (scripts/077)")
})
