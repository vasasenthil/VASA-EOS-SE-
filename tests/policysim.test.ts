import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyProposal, validateProposal, project, proposalSummary, queryProposals, inr,
  type PolicyProposal, type ProposalInput,
} from "@/lib/policysim"
import { listProposals, getProposal, createProposal, updateProposal, deleteProposal, seedProposals } from "@/lib/policysim/store"

function valid(over: Partial<ProposalInput> = {}): ProposalInput {
  return { title: "Pudhumai Penn — 90%", scheme: "Pudhumai Penn", scope: "District", population: 100000, baselineCoveragePct: 60, unitCost: 1000, targetCoveragePct: 85, equityWeighted: true, status: "AI Draft", decidedBy: "", sanctionedBudget: 0, notes: "", ...over }
}

test("project genuinely runs the Policy Engine: newly covered, cost, equity", () => {
  const proj = project(valid())
  assert.equal(proj.humanAuthority, true)
  // 60% → 85% of 100,000 = 25,000 newly covered; cost 25,000 * ₹1,000 = ₹2,50,00,000
  assert.equal(proj.newlyCovered, 25000)
  assert.equal(proj.indicativeCost, 25000000)
  assert.equal(Math.round(proj.projectedCoverage * 100), 85)
  assert.match(proj.equityNote, /Equity-weighted/)
  // target below baseline → no additional beneficiaries
  assert.equal(project(valid({ targetCoveragePct: 50 })).newlyCovered, 0)
})

test("inr formats Cr / L / plain", () => {
  assert.equal(inr(25000000), "₹2.50 Cr")
  assert.equal(inr(250000), "₹2.50 L")
  assert.equal(inr(5000), "₹5,000")
})

test("validation: population/coverage/target order, sanctioning authority for a decision", () => {
  assert.equal(validateProposal(valid()).ok, true)
  assert.ok(validateProposal(valid({ population: 0 })).errors.population)
  assert.ok(validateProposal(valid({ baselineCoveragePct: 120 })).errors.baselineCoveragePct)
  assert.ok(validateProposal(valid({ targetCoveragePct: 40 })).errors.targetCoveragePct) // below baseline 60
  assert.ok(validateProposal(valid({ status: "Sanctioned", decidedBy: "" })).errors.decidedBy)
  assert.equal(validateProposal(valid({ status: "Sanctioned", decidedBy: "DEO" })).ok, true)
  assert.ok(validateProposal(emptyProposal()).errors.title)
})

function bulk(n: number): PolicyProposal[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ scheme: i % 2 ? "Pudhumai Penn" : "Cycle Scheme", status: i % 3 === 0 ? "Sanctioned" : "Submitted", scope: i % 2 ? "District" : "Block", targetCoveragePct: 70 + (i % 30) }),
    id: `p${i}`, createdAt: "", updatedAt: "",
  })) as PolicyProposal[]
}

test("proposalSummary aggregates engine projections; queryProposals filters/paginates by impact", () => {
  const all = bulk(12)
  const s = proposalSummary(all)
  assert.equal(s.total, 12)
  assert.ok(s.projectedBeneficiaries > 0 && s.projectedCost > 0)
  assert.ok(queryProposals(all, { status: "Sanctioned" }).proposals.every((p) => p.status === "Sanctioned"))
  assert.ok(queryProposals(all, { scope: "Block" }).proposals.every((p) => p.scope === "Block"))
  const sorted = queryProposals(all, { sortBy: "impact", sortDir: "desc", pageSize: 50 }).proposals
  assert.ok(project(sorted[0]).newlyCovered >= project(sorted[sorted.length - 1]).newlyCovered)
  const pg = queryProposals(all, { pageSize: 5 })
  assert.equal(pg.proposals.length, 5)
  assert.equal(pg.totalPages, 3)
})

test("store CRUD: create → read → sanction → delete (DB path)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createProposal(valid())
  assert.match(created.id, /^POL-/)
  assert.equal((await getProposal(created.id))?.scheme, "Pudhumai Penn")
  const updated = await updateProposal(created.id, valid({ status: "Sanctioned", decidedBy: "DEO Chennai", sanctionedBudget: 25000000 }))
  assert.equal(updated?.status, "Sanctioned")
  assert.equal(updated?.sanctionedBudget, 25000000)
  assert.equal(await deleteProposal(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedProposals idempotent", async () => {
  __setTestDb(null)
  const before = await listProposals()
  assert.ok(before.length >= 4)
  assert.equal(await seedProposals(), 4)
  assert.equal((await listProposals()).length, before.length)
})
