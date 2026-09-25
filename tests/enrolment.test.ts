import type { VasaSession } from "@/lib/auth/session"
const session: VasaSession = { subject: "school-operator", roles: ["PRINCIPAL"], tenant: { stateId: "TN", schoolId: DEMO_UDISE }, metadata: {} }
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { ProductionDatabaseError } from "@/lib/db/require-db"
import { makeFakeDb } from "./helpers/fake-db"
import { viewFor, type Enrolment } from "@/lib/enrolment"
import { saveEnrolment, latestEnrolment, DEMO_UDISE } from "@/lib/enrolment/store"

beforeEach(async () => {
  const db = makeFakeDb()
  for (const code of [DEMO_UDISE,"99999999999","00000000000"]) await db.from("school_tenant_bindings").insert({ school_id: code, udise_code: code, tenant_id: `tenant-${code}`, state_id: "TN" })
  __setTestDb(db as unknown as SupabaseClient)
})
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
  await saveEnrolment({ asOf: "2026-04-01", total: 1248, boys: 636, girls: 612 }, session)
  await saveEnrolment({ asOf: "2026-06-01", total: 1262, boys: 640, girls: 622 }, session)
  const latest = await latestEnrolment(undefined, session)
  assert.equal(latest?.asOf, "2026-06-01")
  assert.equal(latest?.total, 1262)
})

test("latest is scoped to the requested school (UDISE)", async () => {
  await saveEnrolment({ udiseCode: DEMO_UDISE, asOf: "2026-06-01", total: 1262, boys: 640, girls: 622 }, session)
  await saveEnrolment({ udiseCode: "99999999999", asOf: "2026-06-01", total: 300, boys: 150, girls: 150 }, { ...session, tenant: { schoolId: "99999999999" } })
  assert.equal((await latestEnrolment(DEMO_UDISE, session))?.total, 1262)
  assert.equal((await latestEnrolment("99999999999", { ...session, tenant: { schoolId: "99999999999" } }))?.total, 300)
})

test("missing durable DB fails closed for enrolment snapshots", async () => {
  __setTestDb(null)
  await assert.rejects(() => latestEnrolment(undefined, session), ProductionDatabaseError)
  await assert.rejects(() => saveEnrolment({ asOf: "2026-04-01", total: 1248, boys: 636, girls: 612 }, session), ProductionDatabaseError)
})

test("latest is undefined for a school with no snapshots", async () => {
  assert.equal(await latestEnrolment("00000000000", { ...session, tenant: { schoolId: "00000000000" } }), undefined)
})
