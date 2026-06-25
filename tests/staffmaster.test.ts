import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyStaff, validateStaff, serviceYears, ageYears, retirementDue, totalLeaveBalance, staffSummary, queryStaff,
  type StaffMember, type StaffInput,
} from "@/lib/staffmaster"
import { listStaff, getStaff, createStaff, updateStaff, deleteStaff, seedStaff } from "@/lib/staffmaster/store"

function valid(over: Partial<StaffInput> = {}): StaffInput {
  return {
    staffId: "EMP-001", name: "Mr. Sharma", designation: "Post Graduate Teacher (PGT)", cadre: "Teaching", department: "Mathematics",
    gender: "Male", dob: "1982-09-05", doj: "2008-07-15", qualification: "M.Sc., B.Ed.", phone: "9840020002", email: "sharma@vasa-eos.tn.gov.in",
    employmentType: "Permanent", status: "Active", casualLeaveBalance: 8, earnedLeaveBalance: 120, payScale: "Level 17", notes: "", ...over,
  }
}
const asOf = new Date("2026-06-15T00:00:00Z")

test("derived: service years, age, retirement-due, leave balance", () => {
  assert.equal(serviceYears("2008-07-15", asOf), 17.9)
  assert.equal(ageYears("1982-09-05", asOf), 43)
  assert.equal(retirementDue("1967-03-12", asOf), true) // ~59 → within 1 yr of 60
  assert.equal(retirementDue("1982-09-05", asOf), false)
  assert.equal(totalLeaveBalance({ casualLeaveBalance: 8, earnedLeaveBalance: 120 }), 128)
})

test("validation: staff-id pattern, email, phone, dob range, doj after dob", () => {
  assert.equal(validateStaff(valid()).ok, true)
  assert.ok(validateStaff(valid({ staffId: "1" })).errors.staffId)
  assert.ok(validateStaff(valid({ email: "bad" })).errors.email)
  assert.ok(validateStaff(valid({ phone: "123" })).errors.phone)
  assert.ok(validateStaff(valid({ dob: "2020-01-01" })).errors.dob) // too young
  assert.ok(validateStaff(valid({ doj: "1980-01-01" })).errors.doj) // before dob
  assert.ok(validateStaff(emptyStaff()).errors.staffId)
})

function bulk(n: number): StaffMember[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ staffId: `EMP-${100 + i}`, cadre: i % 3 === 0 ? "Non-teaching" : "Teaching", status: i % 4 === 0 ? "On Leave" : "Active", doj: `20${String(10 + (i % 15)).padStart(2, "0")}-06-01` }),
    id: `s${i}`, createdAt: "", updatedAt: "",
  })) as StaffMember[]
}

test("staffSummary + queryStaff (cadre/status filter, service sort, paginate)", () => {
  const all = bulk(12)
  const s = staffSummary(all, asOf)
  assert.equal(s.total, 12)
  assert.equal(s.teaching + s.nonTeaching, 12)
  assert.ok(queryStaff(all, { cadre: "Teaching" }, asOf).staff.every((m) => m.cadre === "Teaching"))
  assert.ok(queryStaff(all, { status: "On Leave" }, asOf).staff.every((m) => m.status === "On Leave"))
  const sorted = queryStaff(all, { sortBy: "service", sortDir: "desc", pageSize: 50 }, asOf).staff
  assert.ok(serviceYears(sorted[0].doj, asOf) >= serviceYears(sorted[sorted.length - 1].doj, asOf))
  const p = queryStaff(all, { pageSize: 5 }, asOf)
  assert.equal(p.staff.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createStaff(valid())
  assert.match(created.id, /^STF-/)
  assert.equal((await getStaff(created.id))?.name, "Mr. Sharma")
  const updated = await updateStaff(created.id, valid({ status: "Transferred", earnedLeaveBalance: 130 }))
  assert.equal(updated?.status, "Transferred")
  assert.equal(updated?.earnedLeaveBalance, 130)
  assert.equal(await deleteStaff(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedStaff idempotent", async () => {
  __setTestDb(null)
  const before = await listStaff()
  assert.ok(before.length >= 6)
  assert.equal(await seedStaff(), 6)
  assert.equal((await listStaff()).length, before.length)
})
