import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyLoan, validateLoan, loanStatus, overdueDays, fineDue, canRenew, circulationSummary, queryLoans,
  type LibraryLoan, type LoanInput,
} from "@/lib/librarycirc"
import { listLoans, getLoan, createLoan, updateLoan, deleteLoan, seedLoans } from "@/lib/librarycirc/store"

function valid(over: Partial<LoanInput> = {}): LoanInput {
  return {
    accessionNo: "ACC-00123", title: "Wings of Fire", author: "Kalam", category: "Non-fiction", member: "Aarthi M.",
    memberId: "100200300401", memberType: "Student", classLevel: "X", issueDate: "2026-06-10", dueDate: "2026-06-24",
    returnDate: "", renewalCount: 0, finePerDay: 2, fineWaived: 0, notes: "", ...over,
  }
}
const asOf = new Date("2026-06-30T00:00:00Z")

test("loanStatus + overdueDays + fineDue", () => {
  // unreturned, due 06-24, asOf 06-30 → overdue 6 days, fine 6*2=12
  const l = valid()
  assert.equal(loanStatus(l, asOf), "Overdue")
  assert.equal(overdueDays(l, asOf), 6)
  assert.equal(fineDue(l, asOf), 12)
  // waive 5 → 7
  assert.equal(fineDue({ ...l, fineWaived: 5 }, asOf), 7)
  // returned on time
  const ret = valid({ returnDate: "2026-06-20" })
  assert.equal(loanStatus(ret, asOf), "Returned")
  assert.equal(fineDue(ret, asOf), 0)
  // returned late: due 06-24 returned 06-28 → 4 days * 2 = 8
  assert.equal(fineDue(valid({ returnDate: "2026-06-28" }), asOf), 8)
  // not yet due
  assert.equal(loanStatus(valid({ dueDate: "2026-12-31" }), asOf), "Issued")
})

test("canRenew respects MAX_RENEWALS and return state", () => {
  assert.equal(canRenew(valid()), true)
  assert.equal(canRenew(valid({ renewalCount: 2 })), false)
  assert.equal(canRenew(valid({ returnDate: "2026-06-20" })), false)
})

test("validation: accession pattern, dates, member, student needs class", () => {
  assert.equal(validateLoan(valid()).ok, true)
  assert.ok(validateLoan(valid({ accessionNo: "123" })).errors.accessionNo)
  assert.ok(validateLoan(valid({ dueDate: "2026-06-01" })).errors.dueDate) // before issue
  assert.ok(validateLoan(valid({ memberType: "Student", classLevel: "" })).errors.classLevel)
  assert.equal(validateLoan(valid({ memberType: "Teacher", classLevel: "" })).ok, true) // teacher no class needed
  assert.ok(validateLoan(emptyLoan()).errors.title)
})

function bulk(n: number): LibraryLoan[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ returnDate: i % 3 === 0 ? "2026-06-20" : "", dueDate: i % 2 ? "2026-06-24" : "2026-12-31", category: i % 2 ? "Fiction" : "Textbook", memberType: i % 2 ? "Student" : "Teacher" }),
    id: `l${i}`, createdAt: "", updatedAt: "",
  })) as LibraryLoan[]
}

test("circulationSummary + queryLoans (status/category filter, paginate)", () => {
  const all = bulk(12)
  const s = circulationSummary(all, asOf)
  assert.equal(s.total, 12)
  assert.equal(s.issued + s.overdue + s.returned, 12)
  assert.ok(queryLoans(all, { status: "Overdue" }, asOf).loans.every((l) => loanStatus(l, asOf) === "Overdue"))
  assert.ok(queryLoans(all, { category: "Fiction" }, asOf).loans.every((l) => l.category === "Fiction"))
  const p = queryLoans(all, { pageSize: 5 }, asOf)
  assert.equal(p.loans.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update (return) → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createLoan(valid())
  assert.match(created.id, /^LN-/)
  assert.equal((await getLoan(created.id))?.title, "Wings of Fire")
  const updated = await updateLoan(created.id, valid({ returnDate: "2026-06-22" }))
  assert.equal(updated?.returnDate, "2026-06-22")
  assert.equal(await deleteLoan(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedLoans idempotent", async () => {
  __setTestDb(null)
  const before = await listLoans()
  assert.ok(before.length >= 6)
  assert.equal(await seedLoans(), 6)
  assert.equal((await listLoans()).length, before.length)
})
