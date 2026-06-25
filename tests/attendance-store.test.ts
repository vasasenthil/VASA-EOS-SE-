import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { recordClassAttendance, listClassAttendance, DEMO_UDISE } from "@/lib/attendance/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("recording and listing class attendance (DB path), latest-per-class wins", async () => {
  await recordClassAttendance({ cls: "Class VI", enrolled: 180, present: 168, date: "2026-06-15" })
  await recordClassAttendance({ cls: "Class VII", enrolled: 195, present: 178, date: "2026-06-15" })
  // A newer record for Class VI supersedes the older figure.
  await recordClassAttendance({ cls: "Class VI", enrolled: 180, present: 175, date: "2026-06-16" })

  const rows = await listClassAttendance()
  assert.equal(rows.length, 2) // one per class
  const six = rows.find((r) => r.cls === "Class VI")
  assert.equal(six?.present, 175) // the latest day
  assert.deepEqual(rows.map((r) => r.cls), ["Class VI", "Class VII"]) // CLASS_ORDER
})

test("listing is scoped to the requested school (UDISE)", async () => {
  await recordClassAttendance({ udiseCode: DEMO_UDISE, cls: "Class IX", enrolled: 100, present: 95, date: "2026-06-16" })
  await recordClassAttendance({ udiseCode: "99999999999", cls: "Class IX", enrolled: 50, present: 10, date: "2026-06-16" })
  const ours = await listClassAttendance(DEMO_UDISE)
  assert.equal(ours.length, 1)
  assert.equal(ours[0].present, 95)
  const other = await listClassAttendance("99999999999")
  assert.equal(other[0].present, 10)
})

test("in-memory fallback is pre-seeded with the demo school's day", async () => {
  __setTestDb(null)
  const rows = await listClassAttendance()
  const enrolled = rows.reduce((n, r) => n + r.enrolled, 0)
  const present = rows.reduce((n, r) => n + r.present, 0)
  assert.equal(enrolled, 1248)
  assert.equal(present, 1143)
})

test("in-memory recording supersedes the seed for that class", async () => {
  __setTestDb(null)
  await recordClassAttendance({ cls: "Class XII", enrolled: 85, present: 85, date: "2030-01-01" })
  const rows = await listClassAttendance()
  assert.equal(rows.find((r) => r.cls === "Class XII")?.present, 85)
})
