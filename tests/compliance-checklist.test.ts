import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { summarise, COMPLIANCE_STATUSES, type ComplianceItem } from "@/lib/compliance/checklist"
import { addComplianceItem, setComplianceStatus, listCompliance, DEMO_UDISE } from "@/lib/compliance/checklist-store"

test("summarise counts done/overdue and the compliance percentage", () => {
  const items: ComplianceItem[] = [
    { item: "A", status: "Done" },
    { item: "B", status: "Done" },
    { item: "C", status: "Overdue" },
    { item: "D", status: "Pending" },
  ]
  const s = summarise(items)
  assert.equal(s.total, 4)
  assert.equal(s.done, 2)
  assert.equal(s.overdue, 1)
  assert.equal(s.pct, 50)
})

test("an empty checklist summarises to zeroes, not NaN", () => {
  assert.deepEqual(summarise([]), { total: 0, done: 0, overdue: 0, pct: 0 })
})

test("the status vocabulary is stable", () => {
  assert.deepEqual([...COMPLIANCE_STATUSES], ["Done", "In Progress", "Pending", "Overdue"])
})

test("listing orders attention items first (overdue, then pending) — DB path", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  await addComplianceItem({ item: "Done item", status: "Done" })
  await addComplianceItem({ item: "Overdue item", status: "Overdue" })
  await addComplianceItem({ item: "Pending item", status: "Pending" })
  const rows = await listCompliance()
  assert.deepEqual(rows.map((r) => r.status), ["Overdue", "Pending", "Done"])
  __setTestDb(undefined)
})

test("a status can be updated (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const rec = await addComplianceItem({ item: "Fire drill", status: "Overdue" })
  assert.equal(await setComplianceStatus(rec.id, "Done"), true)
  const rows = await listCompliance()
  assert.equal(rows.find((r) => r.id === rec.id)?.status, "Done")
  __setTestDb(undefined)
})

test("in-memory fallback is seeded and scoped; updating a missing id is a no-op false", async () => {
  __setTestDb(null)
  const rows = await listCompliance(DEMO_UDISE)
  assert.equal(rows.length, 6)
  assert.equal(rows[0].status, "Overdue") // attention-first ordering
  assert.equal(await setComplianceStatus("CMP-NONEXIST", "Done"), false)
  assert.equal((await listCompliance("00000000000")).length, 0)
})
