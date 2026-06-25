import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { saveCollection, latestCollection, DEMO_UDISE } from "@/lib/fees/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("saving and reading the latest fee snapshot (DB path), newest period wins", async () => {
  await saveCollection({ month: "March 2025", period: "2025-03", billed: 1200000, collected: 700000, defaulters: 120, rteStudents: 213 })
  await saveCollection({ month: "April 2025", period: "2025-04", billed: 1240000, collected: 840000, defaulters: 87, rteStudents: 213 })
  const latest = await latestCollection()
  assert.equal(latest?.period, "2025-04")
  assert.equal(latest?.collected, 840000)
})

test("latest is scoped to the requested school (UDISE)", async () => {
  await saveCollection({ udiseCode: DEMO_UDISE, month: "April 2025", period: "2025-04", billed: 1240000, collected: 840000, defaulters: 87, rteStudents: 213 })
  await saveCollection({ udiseCode: "99999999999", month: "April 2025", period: "2025-04", billed: 500000, collected: 100000, defaulters: 200, rteStudents: 5 })
  assert.equal((await latestCollection(DEMO_UDISE))?.collected, 840000)
  assert.equal((await latestCollection("99999999999"))?.collected, 100000)
})

test("in-memory fallback is pre-seeded with the demo school's latest month", async () => {
  __setTestDb(null)
  const latest = await latestCollection()
  assert.equal(latest?.month, "April 2025")
  assert.equal(latest?.billed, 1240000)
  assert.equal(latest?.collected, 840000)
})

test("in-memory saving supersedes the seed with a newer period", async () => {
  __setTestDb(null)
  await saveCollection({ month: "May 2025", period: "2025-05", billed: 1300000, collected: 1100000, defaulters: 40, rteStudents: 215 })
  const latest = await latestCollection()
  assert.equal(latest?.period, "2025-05")
  assert.equal(latest?.collected, 1100000)
})

test("latest is undefined for a school with no snapshots", async () => {
  assert.equal(await latestCollection("00000000000"), undefined)
})
