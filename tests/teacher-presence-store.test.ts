import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { recordTeacherPresence, latestTeacherPresence, presencePct, DEMO_UDISE } from "@/lib/staff-attendance/presence-store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("presencePct rounds and is divide-by-zero safe", () => {
  assert.equal(presencePct(38, 42), 90) // 90.47…
  assert.equal(presencePct(0, 0), 0)
  assert.equal(presencePct(42, 42), 100)
})

test("recording and reading the latest presence (DB path), newest day wins", async () => {
  await recordTeacherPresence({ date: "2026-06-15", present: 39, total: 42 })
  await recordTeacherPresence({ date: "2026-06-16", present: 40, total: 42 })
  const latest = await latestTeacherPresence()
  assert.equal(latest?.date, "2026-06-16")
  assert.equal(latest?.present, 40)
})

test("latest is scoped to the requested school (UDISE)", async () => {
  await recordTeacherPresence({ udiseCode: DEMO_UDISE, date: "2026-06-16", present: 40, total: 42 })
  await recordTeacherPresence({ udiseCode: "99999999999", date: "2026-06-16", present: 12, total: 30 })
  assert.equal((await latestTeacherPresence(DEMO_UDISE))?.present, 40)
  assert.equal((await latestTeacherPresence("99999999999"))?.present, 12)
})

test("in-memory fallback is pre-seeded with the demo school's headline (38/42)", async () => {
  __setTestDb(null)
  const latest = await latestTeacherPresence()
  assert.equal(latest?.present, 38)
  assert.equal(latest?.total, 42)
})

test("latest is undefined for a school with no snapshots", async () => {
  assert.equal(await latestTeacherPresence("00000000000"), undefined)
})
