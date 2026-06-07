import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { checkIn, checkOut, getVisitor, deleteVisitor, listVisitors } from "@/lib/visitors/store"
import { issueLoan, returnLoan, getLoan, deleteLoan, listLoans } from "@/lib/circulation/store"
import { registerAlumnus, deleteAlumnus, listAlumni } from "@/lib/alumni/store"

beforeEach(() => __setTestDb(makeFakeDb() as unknown as SupabaseClient))
afterEach(() => __setTestDb(undefined))

test("visitors: check-in, check-out (once), delete (DB path)", async () => {
  const v = await checkIn({ name: "Parent A", purpose: "Parent meeting", meeting: "Class teacher", inTime: "10:00" })
  assert.equal(v.outTime, undefined)
  assert.equal((await checkOut(v.id, "10:45"))?.outTime, "10:45")
  // Second check-out is a no-op (already out).
  assert.equal((await checkOut(v.id, "11:00"))?.outTime, "10:45")
  assert.ok((await listVisitors()).some((x) => x.id === v.id))
  assert.equal(await deleteVisitor(v.id), true)
})

test("circulation: issue with computed due date, return, delete (DB path)", async () => {
  const l = await issueLoan({ bookId: "b1", bookTitle: "Thirukkural", borrower: "Aarthi", issuedOn: "2026-06-01" })
  assert.equal(l.dueOn, "2026-06-15") // +14 days
  assert.equal((await getLoan(l.id))?.returnedOn, undefined)
  assert.equal((await returnLoan(l.id, "2026-06-10"))?.returnedOn, "2026-06-10")
  assert.ok((await listLoans()).some((x) => x.id === l.id))
  assert.equal(await deleteLoan(l.id), true)
})

test("alumni: register, list (seeded in-memory), delete", async () => {
  const a = await registerAlumnus({ name: "New Grad", batchYear: 2024, occupation: "Engineer", contact: "x@y.com" })
  assert.ok((await listAlumni()).some((x) => x.id === a.id))
  assert.equal(await deleteAlumnus(a.id), true)

  __setTestDb(null)
  assert.ok((await listAlumni()).length >= 3) // seeded sample alumni
})
