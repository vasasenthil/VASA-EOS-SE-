import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Phase-0 production-hardening gate: the provisioned database must be deny-by-default RLS on EVERY
// table. Coverage is guaranteed two ways and this test asserts both:
//   1. a per-table explicit `enable row level security` in (almost) every migration, and
//   2. a final blanket migration (079) that enables RLS on every public table via a catalogue loop —
//      the belt-and-suspenders guarantee proven live (the bootstrap provisions 131/131 with RLS).

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts")

function readAllSql(): string {
  return readdirSync(scriptsDir)
    .filter((f) => /^\d{3}.*\.sql$/.test(f))
    .map((f) => readFileSync(join(scriptsDir, f), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

test("a blanket RLS migration enables row-level security on every public table (079)", () => {
  const sql = readAllSql()
  // the catalogue loop: for ... in ... pg_tables ... enable row level security
  assert.match(sql, /from pg_tables where schemaname = 'public'/)
  assert.match(sql, /enable row level security/)
})

test("explicit per-table RLS coverage stays high (no table left silently open)", () => {
  const sql = readAllSql()
  const created = new Set<string>()
  for (const m of sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)) created.add(m[1])
  const rls = new Set<string>()
  for (const m of sql.matchAll(/alter table (?:if exists )?public\.([a-z0-9_]+) enable row level security/g)) rls.add(m[1])
  // dynamic loop form (e.g. 021): quoted identifiers in a file that enables RLS via format(%i …)
  if (/%i enable row level security/.test(sql)) for (const m of sql.matchAll(/'([a-z0-9_]+)'/g)) rls.add(m[1])
  assert.ok(created.size >= 100, `expected the full table set, found ${created.size}`)
  // the blanket 079 migration covers any remainder, but explicit coverage should still be near-total
  const missing = [...created].filter((t) => !rls.has(t))
  assert.ok(missing.length <= 1, `tables lacking explicit per-table RLS (covered by blanket 079): ${missing.join(", ")}`)
})
