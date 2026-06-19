import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyHealth, validateHealth, bmi, bmiBand, isAnaemic, needsReferral, referralReasons, healthSummary, queryHealth,
  type HealthRecord, type HealthInput,
} from "@/lib/healthregister"
import { listHealth, getHealth, createHealth, updateHealth, deleteHealth, seedHealth } from "@/lib/healthregister/store"

function rec(over: Partial<HealthRecord> = {}): HealthRecord {
  return { id: "h", student: "Aarthi", apaarId: "100200300401", classLevel: "X", section: "A", gender: "Female", screeningDate: "2026-06-15", heightCm: 160, weightKg: 56, vision: "Normal", hearing: "Normal", dental: "Normal", immunisationUpToDate: true, hemoglobin: 12.5, remarks: "", createdAt: "", updatedAt: "", ...over }
}

test("bmi + band: computed from height/weight", () => {
  assert.equal(bmi(rec({ heightCm: 160, weightKg: 56 })), 21.9) // 56/1.6^2
  assert.equal(bmiBand(rec({ heightCm: 160, weightKg: 56 })), "Normal")
  assert.equal(bmiBand(rec({ heightCm: 162, weightKg: 41 })), "Underweight") // 15.6
  assert.equal(bmiBand(rec({ heightCm: 170, weightKg: 92 })), "Obese") // 31.8
  assert.equal(bmiBand(rec({ heightCm: 0, weightKg: 0 })), "—")
})

test("anaemia + referral: flags abnormal findings with reasons", () => {
  assert.equal(isAnaemic(rec({ hemoglobin: 10.8 })), true)
  assert.equal(isAnaemic(rec({ hemoglobin: 12.5 })), false)
  assert.equal(isAnaemic(rec({ hemoglobin: 0 })), false) // not measured
  assert.equal(needsReferral(rec()), false) // all normal
  const r = rec({ heightCm: 162, weightKg: 41, dental: "Refer", hemoglobin: 10.8, immunisationUpToDate: false })
  assert.equal(needsReferral(r), true)
  const reasons = referralReasons(r)
  assert.ok(reasons.some((x) => /Underweight/.test(x)))
  assert.ok(reasons.some((x) => /Dental/.test(x)))
  assert.ok(reasons.some((x) => /Anaemia/.test(x)))
  assert.ok(reasons.some((x) => /Immunisation/.test(x)))
})

test("validation: height/weight range, screen results, haemoglobin range", () => {
  const ok: HealthInput = { student: "A", apaarId: "", classLevel: "X", section: "A", gender: "Female", screeningDate: "2026-06-15", heightCm: 160, weightKg: 56, vision: "Normal", hearing: "Normal", dental: "Normal", immunisationUpToDate: true, hemoglobin: 12.5, remarks: "" }
  assert.equal(validateHealth(ok).ok, true)
  assert.ok(validateHealth({ ...ok, heightCm: 30 }).errors.heightCm)
  assert.ok(validateHealth({ ...ok, weightKg: 200 }).errors.weightKg)
  assert.ok(validateHealth({ ...ok, hemoglobin: 99 }).errors.hemoglobin)
  assert.ok(validateHealth({ ...ok, apaarId: "12" }).errors.apaarId)
  assert.ok(validateHealth(emptyHealth()).errors.student)
})

function bulk(n: number): HealthRecord[] {
  return Array.from({ length: n }, (_, i) => rec({ id: `h${i}`, classLevel: i % 3 === 0 ? "X" : "IX", weightKg: i % 4 === 0 ? 41 : 56, heightCm: 162, hemoglobin: i % 5 === 0 ? 10.5 : 12.5 }))
}

test("healthSummary + queryHealth (band/referral filter, paginate, bmi sort)", () => {
  const all = bulk(12)
  const s = healthSummary(all)
  assert.equal(s.total, 12)
  assert.ok(s.underweight >= 1 && s.anaemia >= 1 && s.referrals >= 1)
  assert.ok(queryHealth(all, { band: "Underweight" }).records.every((r) => bmiBand(r) === "Underweight"))
  assert.ok(queryHealth(all, { referral: true }).records.every((r) => needsReferral(r)))
  const sorted = queryHealth(all, { sortBy: "bmi", sortDir: "asc", pageSize: 50 }).records
  assert.ok(bmi(sorted[0]) <= bmi(sorted[sorted.length - 1]))
  const p = queryHealth(all, { pageSize: 5 })
  assert.equal(p.records.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createHealth({ student: "Test", apaarId: "", classLevel: "X", section: "A", gender: "Male", screeningDate: "2026-06-15", heightCm: 165, weightKg: 60, vision: "Normal", hearing: "Normal", dental: "Normal", immunisationUpToDate: true, hemoglobin: 13, remarks: "" })
  assert.match(created.id, /^HLT-/)
  assert.equal((await getHealth(created.id))?.student, "Test")
  const updated = await updateHealth(created.id, { student: "Test", apaarId: "", classLevel: "X", section: "A", gender: "Male", screeningDate: "2026-06-15", heightCm: 165, weightKg: 90, vision: "Refer", hearing: "Normal", dental: "Normal", immunisationUpToDate: true, hemoglobin: 13, remarks: "" })
  assert.equal(bmiBand(updated!), "Obese")
  assert.equal(needsReferral(updated!), true)
  assert.equal(await deleteHealth(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedHealth idempotent", async () => {
  __setTestDb(null)
  const before = await listHealth()
  assert.ok(before.length >= 6)
  assert.equal(await seedHealth(), 6)
  assert.equal((await listHealth()).length, before.length)
})
