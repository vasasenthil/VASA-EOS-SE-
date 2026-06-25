import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import { emptyKpi, validateKpi, aggregate, groupBy, flagged, districtsOf, type SchoolKpi, type KpiInput } from "@/lib/rollup"
import { listKpis, getKpi, createKpi, updateKpi, deleteKpi, seedKpis } from "@/lib/rollup/store"

function kpi(over: Partial<SchoolKpi>): SchoolKpi {
  return { id: "k", schoolName: "S", udise: "33010100101", district: "Chennai", block: "Egmore", enrolment: 100, attendancePct: 80, passPct: 70, feeCollectionPct: 90, atRiskCount: 5, complianceGaps: 0, academicYear: "2026-2027", createdAt: "", updatedAt: "", ...over }
}

test("aggregate is enrolment-weighted and sums counts", () => {
  const rows = [kpi({ enrolment: 100, attendancePct: 90 }), kpi({ enrolment: 300, attendancePct: 70 })]
  const a = aggregate("X", rows)
  assert.equal(a.schools, 2)
  assert.equal(a.enrolment, 400)
  // weighted attendance = (90*100 + 70*300)/400 = 75
  assert.equal(a.attendancePct, 75)
  assert.equal(a.atRiskCount, 10) // summed
})

test("aggregate handles zero enrolment safely", () => {
  const a = aggregate("Empty", [])
  assert.equal(a.enrolment, 0)
  assert.equal(a.attendancePct, 0)
})

test("groupBy district/block aggregates each group, largest enrolment first", () => {
  const rows = [
    kpi({ district: "Chennai", block: "Egmore", enrolment: 100 }),
    kpi({ district: "Chennai", block: "Triplicane", enrolment: 300 }),
    kpi({ district: "Coimbatore", block: "North", enrolment: 500 }),
  ]
  const byDistrict = groupBy(rows, "district")
  assert.equal(byDistrict.length, 2)
  assert.equal(byDistrict[0].label, "Coimbatore") // 500 enrolment, largest first
  assert.equal(byDistrict[0].enrolment, 500)
  const chennai = byDistrict.find((d) => d.label === "Chennai")!
  assert.equal(chennai.enrolment, 400)
  assert.equal(groupBy(rows, "block").length, 3)
})

test("flagged surfaces under-performing units, worst attendance first", () => {
  const units = [aggregate("Good", [kpi({ attendancePct: 90, passPct: 85, feeCollectionPct: 90 })]), aggregate("Bad", [kpi({ attendancePct: 60, passPct: 50, feeCollectionPct: 60, complianceGaps: 2 })])]
  const f = flagged(units)
  assert.equal(f.length, 1)
  assert.equal(f[0].label, "Bad")
})

test("districtsOf is unique + sorted", () => {
  assert.deepEqual(districtsOf([kpi({ district: "Madurai" }), kpi({ district: "Chennai" }), kpi({ district: "Chennai" })]), ["Chennai", "Madurai"])
})

test("validateKpi: UDISE 11 digits, percentages 0-100, enrolment>0", () => {
  const ok: KpiInput = { schoolName: "GHSS", udise: "33010100101", district: "Chennai", block: "Egmore", enrolment: 1000, attendancePct: 85, passPct: 80, feeCollectionPct: 90, atRiskCount: 5, complianceGaps: 0, academicYear: "2026-2027" }
  assert.equal(validateKpi(ok).ok, true)
  assert.ok(validateKpi({ ...ok, udise: "123" }).errors.udise)
  assert.ok(validateKpi({ ...ok, attendancePct: 120 }).errors.attendancePct)
  assert.ok(validateKpi({ ...ok, enrolment: 0 }).errors.enrolment)
  assert.ok(validateKpi({ ...ok, academicYear: "2026-2028" }).errors.academicYear)
  assert.ok(validateKpi(emptyKpi()).errors.schoolName)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createKpi({ schoolName: "GHSS Test", udise: "33019900101", district: "Test", block: "T", enrolment: 500, attendancePct: 80, passPct: 70, feeCollectionPct: 85, atRiskCount: 3, complianceGaps: 0, academicYear: "2026-2027" })
  assert.match(created.id, /^KPI-/)
  assert.equal((await getKpi(created.id))?.schoolName, "GHSS Test")
  const updated = await updateKpi(created.id, { schoolName: "GHSS Test", udise: "33019900101", district: "Test", block: "T", enrolment: 520, attendancePct: 88, passPct: 78, feeCollectionPct: 90, atRiskCount: 2, complianceGaps: 1, academicYear: "2026-2027" })
  assert.equal(updated?.attendancePct, 88)
  assert.equal(await deleteKpi(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedKpis idempotent; roll-up aggregates the seed", async () => {
  __setTestDb(null)
  const before = await listKpis()
  assert.ok(before.length >= 8)
  assert.equal(await seedKpis(), 8)
  assert.equal((await listKpis()).length, before.length)
  const state = aggregate("TN", before)
  assert.ok(state.enrolment > 0 && state.attendancePct > 0)
  assert.ok(groupBy(before, "district").length >= 3) // Chennai, Coimbatore, Madurai
})
