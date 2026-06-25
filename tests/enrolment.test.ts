import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { viewFor, type Enrolment } from "@/lib/enrolment"
import { saveEnrolment, latestEnrolment, DEMO_UDISE } from "@/lib/enrolment/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

function roll(): Enrolment {
  return { total: 1248, boys: 636, girls: 612 }
}

test("viewFor derives girls share and a 2-dp gender parity index", () => {
  const v = viewFor(roll())
  assert.equal(v.girlsPct, 49) // 612/1248 = 49.03…
  assert.equal(v.gpi, 0.96) // 612/636 = 0.962…
})

test("viewFor is divide-by-zero safe for an empty roll", () => {
  const v = viewFor({ total: 0, boys: 0, girls: 0 })
  assert.equal(v.girlsPct, 0)
  assert.equal(v.gpi, 0)
})

test("saving and reading the latest enrolment (DB path), newest snapshot wins", async () => {
  await saveEnrolment({ asOf: "2026-04-01", total: 1248, boys: 636, girls: 612 })
  await saveEnrolment({ asOf: "2026-06-01", total: 1262, boys: 640, girls: 622 })
  const latest = await latestEnrolment()
  assert.equal(latest?.asOf, "2026-06-01")
  assert.equal(latest?.total, 1262)
})

test("latest is scoped to the requested school (UDISE)", async () => {
  await saveEnrolment({ udiseCode: DEMO_UDISE, asOf: "2026-06-01", total: 1262, boys: 640, girls: 622 })
  await saveEnrolment({ udiseCode: "99999999999", asOf: "2026-06-01", total: 300, boys: 150, girls: 150 })
  assert.equal((await latestEnrolment(DEMO_UDISE))?.total, 1262)
  assert.equal((await latestEnrolment("99999999999"))?.total, 300)
})

test("in-memory fallback is pre-seeded with the demo school's roll (1,248)", async () => {
  __setTestDb(null)
  const latest = await latestEnrolment()
  assert.equal(latest?.total, 1248)
  assert.equal(latest?.boys, 636)
  assert.equal(latest?.girls, 612)
})

test("latest is undefined for a school with no snapshots", async () => {
  assert.equal(await latestEnrolment("00000000000"), undefined)
})
