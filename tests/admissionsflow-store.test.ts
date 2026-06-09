import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { fileApplicant, actOnApplicant, getApplicant, deleteApplicant, listApplicants } from "@/lib/admissionsflow/store"
import { recordResult, getResult, deleteResult, listResults } from "@/lib/sports/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("admissions: verify (Academic Head) -> enrol (Principal) mints APAAR; role-gated", async () => {
  const rec = await fileApplicant({ name: "Aarthi", dob: "2019-05-01", gender: "Female", category: "General", className: "1" })
  assert.equal(rec.instance.status, "in_progress")
  assert.equal(rec.apaarId, undefined)

  // Principal can't verify first — that's the Academic Head's step.
  assert.equal((await actOnApplicant(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })).ok, false)

  let res = await actOnApplicant(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "AH", decision: "approve" })
  assert.equal(res.record?.instance.status, "in_progress")
  res = await actOnApplicant(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.record?.instance.status, "approved")
  assert.match(res.record?.apaarId ?? "", /^APAAR-\d{12}$/) // minted on enrolment
  assert.ok((await getApplicant(rec.id))?.apaarId)
  assert.equal(await deleteApplicant(rec.id), true)
})

test("sports: record result, list, delete (DB path) + in-memory fallback", async () => {
  const r = await recordResult({ event: "100m Sprint", student: "A", medal: "gold" })
  assert.equal((await getResult(r.id))?.medal, "gold")
  assert.ok((await listResults()).some((x) => x.id === r.id))
  assert.equal(await deleteResult(r.id), true)

  __setTestDb(null)
  const r2 = await recordResult({ event: "Chess", student: "B", medal: "silver" })
  assert.ok((await listResults()).some((x) => x.id === r2.id))
})

test("admissions in-memory fallback works", async () => {
  __setTestDb(null)
  const rec = await fileApplicant({ name: "Z", dob: "2018-01-01", gender: "Male", category: "SC", className: "2" })
  await actOnApplicant(rec.id, { actorRole: "ACADEMIC_HEAD", actor: "AH", decision: "approve" })
  const res = await actOnApplicant(rec.id, { actorRole: "PRINCIPAL", actor: "HM", decision: "approve" })
  assert.equal(res.record?.instance.status, "approved")
  assert.ok(res.record?.apaarId)
})
