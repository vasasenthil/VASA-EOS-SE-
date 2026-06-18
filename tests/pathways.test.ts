import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyPathway, validatePathway, recommend, suggestPlan, pathwaySummary, queryPathways,
  type Pathway, type PathwayInput, type PathwayObjective,
} from "@/lib/pathways"
import { listPathways, getPathway, createPathway, updatePathway, deletePathway, seedPathways } from "@/lib/pathways/store"

function objectives(): PathwayObjective[] {
  return [
    { id: "o1", label: "Linear equations", prereqs: [], mastery: 85 },
    { id: "o2", label: "Factorisation", prereqs: ["Linear equations"], mastery: 35 },
    { id: "o3", label: "Quadratic formula", prereqs: ["Factorisation"], mastery: 10 },
  ]
}
function valid(over: Partial<PathwayInput> = {}): PathwayInput {
  return { student: "Bharath K.", apaarId: "100200300402", classLevel: "X", section: "A", subject: "Mathematics", title: "Algebra pathway", objectives: objectives(), threshold: 70, planStatus: "AI Draft", approvedBy: "", plan: "", ...over }
}

test("recommend genuinely runs the Personalisation Engine: next-ready by mastery + prerequisites", () => {
  const r = recommend(objectives(), 70)
  assert.equal(r.humanAuthority, true)
  // Linear (85%) mastered → Factorisation is ready (prereq met, not mastered). Quadratic is blocked.
  assert.equal(r.recommendations.length, 1)
  assert.equal(r.recommendations[0].label, "Factorisation")
  assert.match(r.explanation, /ready now/)
})

test("recommend unblocks the chain as mastery rises", () => {
  const objs = objectives().map((o) => (o.id === "o2" ? { ...o, mastery: 80 } : o)) // Factorisation now mastered
  const r = recommend(objs, 70)
  assert.equal(r.recommendations[0].label, "Quadratic formula") // now ready
})

test("suggestPlan lists the recommended sequence (or reinforcement when none ready)", () => {
  assert.match(suggestPlan(recommend(objectives(), 70)), /Factorisation/)
  const allMastered = recommend([{ id: "o1", label: "Done", prereqs: [], mastery: 100 }], 70)
  assert.match(suggestPlan(allMastered), /reinforce|No ready/i)
})

test("validation: objectives required, mastery 0-100, threshold 1-100, approver past AI Draft", () => {
  assert.equal(validatePathway(valid()).ok, true)
  assert.ok(validatePathway(valid({ objectives: [] })).errors.objectives)
  assert.ok(validatePathway(valid({ objectives: [{ id: "x", label: "T", prereqs: [], mastery: 150 }] })).errors.objectives)
  assert.ok(validatePathway(valid({ threshold: 0 })).errors.threshold)
  assert.ok(validatePathway(valid({ planStatus: "Approved", approvedBy: "" })).errors.approvedBy)
  assert.equal(validatePathway(valid({ planStatus: "Approved", approvedBy: "Mr. Sharma" })).ok, true)
  assert.ok(validatePathway(emptyPathway()).errors.student)
})

function bulk(n: number): Pathway[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ subject: i % 2 ? "Mathematics" : "Science", planStatus: i % 3 === 0 ? "Completed" : "AI Draft", title: `P${i}`,
      objectives: i % 2 ? objectives() : [{ id: "o1", label: "All", prereqs: [], mastery: 100 }] }),
    id: `p${i}`, createdAt: "", updatedAt: "",
  })) as Pathway[]
}

test("pathwaySummary counts those with a ready step via the engine; queryPathways filters/paginates", () => {
  const all = bulk(12)
  const s = pathwaySummary(all)
  assert.equal(s.total, 12)
  assert.ok(s.withReadyStep >= 1) // odd indices have a ready 'Factorisation'
  assert.ok(queryPathways(all, { subject: "Mathematics" }).pathways.every((p) => p.subject === "Mathematics"))
  assert.ok(queryPathways(all, { planStatus: "Completed" }).pathways.every((p) => p.planStatus === "Completed"))
  const pg = queryPathways(all, { pageSize: 5 })
  assert.equal(pg.pathways.length, 5)
  assert.equal(pg.totalPages, 3)
})

test("store CRUD: create → read → approve → delete (DB path, objectives JSONB round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createPathway(valid())
  assert.match(created.id, /^PATH-/)
  assert.equal((await getPathway(created.id))?.objectives.length, 3)
  const updated = await updatePathway(created.id, valid({ planStatus: "Approved", approvedBy: "Mr. Sharma", plan: "Next: Factorisation." }))
  assert.equal(updated?.planStatus, "Approved")
  assert.equal(await deletePathway(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedPathways idempotent", async () => {
  __setTestDb(null)
  const before = await listPathways()
  assert.ok(before.length >= 3)
  assert.equal(await seedPathways(), 3)
  assert.equal((await listPathways()).length, before.length)
})
