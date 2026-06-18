import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyDiagnostic, validateDiagnostic, diagnose, suggestRemediation, diagnosticSummary, queryDiagnostics,
  type Diagnostic, type DiagnosticInput, type RubricEntry,
} from "@/lib/diagnostics"
import { listDiagnostics, getDiagnostic, createDiagnostic, updateDiagnostic, deleteDiagnostic, seedDiagnostics } from "@/lib/diagnostics/store"

function items(): RubricEntry[] {
  return [
    { id: "a1", objective: "Linear equations", marks: 10, awarded: 8 },
    { id: "a2", objective: "Factorisation", marks: 10, awarded: 3 },
    { id: "a3", objective: "Quadratic formula", marks: 10, awarded: 4 },
  ]
}
function valid(over: Partial<DiagnosticInput> = {}): DiagnosticInput {
  return { student: "Bharath K.", apaarId: "100200300402", classLevel: "X", section: "A", subject: "Mathematics", title: "Algebra diagnostic", assessmentType: "Diagnostic", date: "2026-06-18", items: items(), planStatus: "AI Draft", approvedBy: "", remediation: "", ...over }
}

test("diagnose genuinely runs the Assessment Engine: per-objective mastery, weak objectives, band", () => {
  const r = diagnose(items())
  assert.equal(r.humanAuthority, true)
  assert.equal(r.score, 15)
  assert.equal(r.max, 30)
  assert.equal(r.pct, 50)
  assert.equal(r.objectiveMastery.length, 3)
  // Factorisation (30%) and Quadratic formula (40%) are < 50% → weak
  assert.deepEqual(r.weakObjectives.sort(), ["Factorisation", "Quadratic formula"])
  assert.match(r.explanation, /Weak:/)
})

test("suggestRemediation: targets weak objectives, or enrichment when none", () => {
  assert.match(suggestRemediation(diagnose(items())), /Factorisation/)
  const strong = diagnose([{ id: "x", objective: "Topic", marks: 10, awarded: 10 }])
  assert.match(suggestRemediation(strong), /enrichment|On track/i)
})

test("validation: rubric required, awarded within marks, approver once past AI Draft", () => {
  assert.equal(validateDiagnostic(valid()).ok, true)
  assert.ok(validateDiagnostic(valid({ items: [] })).errors.items)
  assert.ok(validateDiagnostic(valid({ items: [{ id: "x", objective: "T", marks: 10, awarded: 12 }] })).errors.items) // awarded > marks
  assert.ok(validateDiagnostic(valid({ items: [{ id: "x", objective: "", marks: 10, awarded: 5 }] })).errors.items) // no objective
  assert.ok(validateDiagnostic(valid({ planStatus: "Approved", approvedBy: "" })).errors.approvedBy)
  assert.equal(validateDiagnostic(valid({ planStatus: "Approved", approvedBy: "Mr. Sharma" })).ok, true)
  assert.ok(validateDiagnostic(emptyDiagnostic()).errors.student)
})

function bulk(n: number): Diagnostic[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ subject: i % 2 ? "Mathematics" : "Science", planStatus: i % 3 === 0 ? "Completed" : "AI Draft", title: `D${i}`, items: i % 2 ? items() : [{ id: "ok", objective: "Mastered", marks: 10, awarded: 10 }] }),
    id: `d${i}`, createdAt: `2026-06-${String(i + 1).padStart(2, "0")}`, updatedAt: "",
  })) as Diagnostic[]
}

test("diagnosticSummary counts those needing remediation via the engine; queryDiagnostics filters/paginates", () => {
  const all = bulk(12)
  const s = diagnosticSummary(all)
  assert.equal(s.total, 12)
  assert.ok(s.needingRemediation >= 1) // odd indices have weak objectives
  assert.ok(queryDiagnostics(all, { subject: "Mathematics" }).diagnostics.every((d) => d.subject === "Mathematics"))
  assert.ok(queryDiagnostics(all, { planStatus: "Completed" }).diagnostics.every((d) => d.planStatus === "Completed"))
  const p = queryDiagnostics(all, { pageSize: 5 })
  assert.equal(p.diagnostics.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → approve plan → delete (DB path, items JSONB round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createDiagnostic(valid())
  assert.match(created.id, /^DIAG-/)
  assert.equal((await getDiagnostic(created.id))?.items.length, 3)
  const updated = await updateDiagnostic(created.id, valid({ planStatus: "Approved", approvedBy: "Mr. Sharma", remediation: "Re-teach factorisation." }))
  assert.equal(updated?.planStatus, "Approved")
  assert.equal(await deleteDiagnostic(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedDiagnostics idempotent", async () => {
  __setTestDb(null)
  const before = await listDiagnostics()
  assert.ok(before.length >= 3)
  assert.equal(await seedDiagnostics(), 3)
  assert.equal((await listDiagnostics()).length, before.length)
})
