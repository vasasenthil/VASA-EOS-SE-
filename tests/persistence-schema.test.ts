import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  summarizeSchema,
  probeTable,
  verifySchema,
  WORKFLOW_FLOW_TABLES,
  type TableProbe,
} from "@/lib/persistence/schema"

// A Supabase-shaped fake whose select() resolves to an error for the named
// "missing" tables, throws for "boom" tables, and succeeds otherwise.
function fakeDb(opts: { missing?: string[]; boom?: string[] } = {}): SupabaseClient {
  const missing = new Set(opts.missing ?? [])
  const boom = new Set(opts.boom ?? [])
  return {
    from(table: string) {
      return {
        select(_cols: string, _opts?: unknown) {
          if (boom.has(table)) throw new Error(`connection refused for ${table}`)
          const error = missing.has(table) ? { message: `relation "${table}" does not exist` } : null
          return Promise.resolve({ error })
        },
      }
    },
  } as unknown as SupabaseClient
}

test("summarizeSchema reports ok only when nothing is missing", () => {
  const allOk: TableProbe[] = [{ table: "a", ok: true }, { table: "b", ok: true }]
  const v1 = summarizeSchema(allOk)
  assert.equal(v1.ok, true)
  assert.equal(v1.present, 2)
  assert.deepEqual(v1.missing, [])

  const some: TableProbe[] = [{ table: "a", ok: true }, { table: "b", ok: false, error: "x" }]
  const v2 = summarizeSchema(some)
  assert.equal(v2.ok, false)
  assert.equal(v2.present, 1)
  assert.deepEqual(v2.missing, ["b"])
})

test("probeTable maps a present table to ok, a missing one to an error", async () => {
  assert.deepEqual(await probeTable(fakeDb(), "smc_flows"), { table: "smc_flows", ok: true })
  const miss = await probeTable(fakeDb({ missing: ["smc_flows"] }), "smc_flows")
  assert.equal(miss.ok, false)
  assert.match(miss.error ?? "", /does not exist/)
})

test("probeTable catches a thrown client error instead of crashing", async () => {
  const r = await probeTable(fakeDb({ boom: ["leave_flows"] }), "leave_flows")
  assert.equal(r.ok, false)
  assert.match(r.error ?? "", /connection refused/)
})

test("verifySchema passes when every workflow table is present", async () => {
  const v = await verifySchema(fakeDb())
  assert.equal(v.ok, true)
  assert.equal(v.checked, WORKFLOW_FLOW_TABLES.length)
  assert.equal(v.present, WORKFLOW_FLOW_TABLES.length)
})

test("verifySchema fails and names the missing tables", async () => {
  const v = await verifySchema(fakeDb({ missing: ["maintenance_flows", "grievance_flows"] }))
  assert.equal(v.ok, false)
  assert.deepEqual([...v.missing].sort(), ["grievance_flows", "maintenance_flows"])
})
