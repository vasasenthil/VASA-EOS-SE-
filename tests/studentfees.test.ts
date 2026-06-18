import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyFee, validateFee, feeGross, netDemand, totalPaid, balance, paymentStatus, isDefaulter, feeSummary, queryFees,
  type FeeRecord, type FeeInput, type FeeReceipt,
} from "@/lib/studentfees"
import { listFees, getFee, createFee, updateFee, deleteFee, seedFees } from "@/lib/studentfees/store"

function valid(receipts: FeeReceipt[] = []): FeeInput {
  return {
    student: "Aarthi M.", apaarId: "100200300401", classLevel: "X", section: "A", academicYear: "2026-2027",
    heads: [{ type: "Tuition", amount: 12000 }, { type: "Term Fee", amount: 3000 }], concessionType: "None", concessionAmount: 0,
    scholarshipScheme: "", dbtReference: "", dueDate: "2026-07-31", receipts, notes: "",
  }
}
const asOf = new Date("2026-08-01T00:00:00Z")

test("money maths: gross, net demand, paid, balance, status", () => {
  const rec = { ...valid([{ date: "2026-06-20", amount: 10000, mode: "UPI", reference: "x" }]), concessionAmount: 2000 }
  assert.equal(feeGross(rec.heads), 15000)
  assert.equal(netDemand(rec), 13000) // 15000 - 2000
  assert.equal(totalPaid(rec.receipts), 10000)
  assert.equal(balance(rec), 3000)
  assert.equal(paymentStatus(rec), "Partial")
  assert.equal(paymentStatus({ ...valid(), concessionAmount: 15000 }), "Paid") // fully waived → nothing due
  assert.equal(paymentStatus(valid()), "Pending") // nothing paid
})

test("isDefaulter: outstanding past due only", () => {
  assert.equal(isDefaulter(valid(), asOf), true) // due 2026-07-31, asOf Aug 1, unpaid
  assert.equal(isDefaulter({ ...valid([{ date: "2026-06-20", amount: 15000, mode: "Cash", reference: "x" }]) }, asOf), false) // fully paid
  assert.equal(isDefaulter({ ...valid(), dueDate: "2026-12-31" }, asOf), false) // not yet due
})

test("validation: heads, concession bound, receipts, DBT reference requirement", () => {
  assert.equal(validateFee(valid()).ok, true)
  assert.ok(validateFee({ ...valid(), heads: [] }).errors.heads)
  assert.ok(validateFee({ ...valid(), concessionAmount: 99999 }).errors.concessionAmount) // exceeds gross
  assert.ok(validateFee({ ...valid([{ date: "bad", amount: -5, mode: "UPI", reference: "" }]) }).errors.receipts)
  assert.ok(validateFee({ ...valid(), concessionType: "DBT Credit", dbtReference: "" }).errors.dbtReference)
  assert.equal(validateFee({ ...valid(), concessionType: "DBT Credit", dbtReference: "DBT-1" }).ok, true)
  assert.ok(validateFee(emptyFee()).errors.student)
})

function rec(over: Partial<FeeRecord>): FeeRecord {
  return { ...valid(), id: "r", createdAt: "", updatedAt: "", ...over } as FeeRecord
}

test("feeSummary aggregates demand/collected/outstanding/rate/defaulters", () => {
  const records = [
    rec({ id: "a", receipts: [{ date: "2026-06-01", amount: 15000, mode: "UPI", reference: "x" }] }), // paid 15000/15000
    rec({ id: "b", receipts: [{ date: "2026-06-01", amount: 5000, mode: "Cash", reference: "y" }] }), // 5000/15000, defaulter
    rec({ id: "c", receipts: [] }), // 0/15000, defaulter
  ]
  const s = feeSummary(records, asOf)
  assert.equal(s.demand, 45000)
  assert.equal(s.collected, 20000)
  assert.equal(s.outstanding, 25000)
  assert.equal(s.collectionRate, 44.4)
  assert.equal(s.defaulters, 2)
})

test("queryFees filters by status + defaulter and paginates; summary reflects filter", () => {
  const records = Array.from({ length: 12 }, (_, i) => rec({ id: `r${i}`, student: `S${i}`, receipts: i % 2 ? [{ date: "2026-06-01", amount: 15000, mode: "UPI", reference: "x" }] : [] }))
  const pending = queryFees(records, { status: "Pending" }, asOf)
  assert.ok(pending.records.every((r) => paymentStatus(r) === "Pending"))
  const defaulters = queryFees(records, { defaulter: true }, asOf)
  assert.ok(defaulters.records.every((r) => isDefaulter(r, asOf)))
  const p = queryFees(records, { pageSize: 5 }, asOf)
  assert.equal(p.records.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update (add receipt) → delete (DB path, JSONB round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createFee(valid())
  assert.match(created.id, /^FEE-/)
  const got = await getFee(created.id)
  assert.equal(got?.heads.length, 2)
  const updated = await updateFee(created.id, valid([{ date: "2026-06-20", amount: 15000, mode: "UPI", reference: "RC-1" }]))
  assert.equal(updated?.receipts.length, 1)
  assert.equal(paymentStatus(updated!), "Paid")
  assert.equal(await deleteFee(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedFees idempotent", async () => {
  __setTestDb(null)
  const before = await listFees()
  assert.ok(before.length >= 6)
  assert.equal(await seedFees(), 6)
  assert.equal((await listFees()).length, before.length)
})
