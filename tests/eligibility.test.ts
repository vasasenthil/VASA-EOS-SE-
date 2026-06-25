import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyCase, validateCase, derive, factsFor, RULE_SETS, CATEGORIES, caseSummary, queryCases,
  type EligibilityCase, type CaseInput, type FactEntry,
} from "@/lib/eligibility"
import { listCases, getCase, createCase, updateCase, deleteCase, seedCases } from "@/lib/eligibility/store"

function facts(pairs: Record<string, string>): FactEntry[] {
  return Object.entries(pairs).map(([key, value]) => ({ key, value }))
}

test("derive genuinely runs the Reasoning Engine: rule fires with conclusion + because + ruleId", () => {
  const r = derive(facts({ gender: "Female", schoolType: "Government", pursuingHigherEd: "true" }), "Pudhumai Penn")
  assert.equal(r.humanAuthority, true)
  assert.equal(r.conclusions.length, 1)
  assert.match(r.conclusions[0].conclusion, /Pudhumai Penn/)
  assert.equal(r.conclusions[0].ruleId, "PP-1")
  assert.match(r.conclusions[0].because, /government school/i)
  // not female → no rule fires
  assert.equal(derive(facts({ gender: "Male", schoolType: "Government", pursuingHigherEd: "true" }), "Pudhumai Penn").conclusions.length, 0)
})

test("numeric rules: RTE income+age band fires only within bounds", () => {
  assert.equal(derive(facts({ annualIncome: "150000", age: "9" }), "RTE 25%").conclusions.length, 1)
  assert.equal(derive(facts({ annualIncome: "150000", age: "15" }), "RTE 25%").conclusions.length, 0) // over age band
  assert.equal(derive(facts({ annualIncome: "300000", age: "9" }), "RTE 25%").conclusions.length, 0) // over income
})

test("bool/compliance rules: missing water fires a compliance gap; high PTR fires PTR gap", () => {
  const r = derive(facts({ pupilTeacherRatio: "34", hasGirlsToilet: "true", hasDrinkingWater: "false" }), "School Compliance")
  const ids = r.conclusions.map((c) => c.ruleId)
  assert.ok(ids.includes("CMP-PTR"))
  assert.ok(ids.includes("CMP-WATER"))
  assert.ok(!ids.includes("CMP-WC")) // toilet present → no gap
})

test("two rules to one conclusion: SC or ST below income both qualify", () => {
  assert.equal(derive(facts({ socialCategory: "SC", annualIncome: "180000" }), "Post-Matric Scholarship").conclusions[0].ruleId, "PMS-SC")
  assert.equal(derive(facts({ socialCategory: "ST", annualIncome: "180000" }), "Post-Matric Scholarship").conclusions[0].ruleId, "PMS-ST")
  assert.equal(derive(facts({ socialCategory: "OC", annualIncome: "180000" }), "Post-Matric Scholarship").conclusions.length, 0)
})

test("factsFor + validation: rule set required, decider once past AI Draft", () => {
  assert.equal(factsFor("Pudhumai Penn").length, RULE_SETS["Pudhumai Penn"].factKeys.length)
  const ok: CaseInput = { subject: "Aarthi", reference: "", category: "Pudhumai Penn", facts: factsFor("Pudhumai Penn"), decision: "AI Draft", decidedBy: "", notes: "" }
  assert.equal(validateCase(ok).ok, true)
  assert.ok(validateCase({ ...ok, decision: "Approved", decidedBy: "" }).errors.decidedBy)
  assert.ok(validateCase(emptyCase()).errors.subject)
  assert.ok(CATEGORIES.length >= 4)
})

function bulk(n: number): EligibilityCase[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`, subject: `S${i}`, reference: "", category: i % 2 ? "Pudhumai Penn" : "RTE 25%",
    facts: i % 2 ? facts({ gender: "Female", schoolType: "Government", pursuingHigherEd: "true" }) : facts({ annualIncome: "150000", age: "9" }),
    decision: i % 3 === 0 ? "Approved" : "AI Draft", decidedBy: "", notes: "", createdAt: `2026-06-${String(i + 1).padStart(2, "0")}`, updatedAt: "",
  })) as EligibilityCase[]
}

test("caseSummary counts those with a fired rule; queryCases filters/paginates", () => {
  const all = bulk(12)
  const s = caseSummary(all)
  assert.equal(s.total, 12)
  assert.equal(s.withConclusion, 12) // all demo facts fire a rule
  assert.ok(queryCases(all, { category: "Pudhumai Penn" }).cases.every((c) => c.category === "Pudhumai Penn"))
  assert.ok(queryCases(all, { decision: "Approved" }).cases.every((c) => c.decision === "Approved"))
  const pg = queryCases(all, { pageSize: 5 })
  assert.equal(pg.cases.length, 5)
  assert.equal(pg.totalPages, 3)
})

test("store CRUD: create → read → decide → delete (DB path, facts JSONB round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createCase({ subject: "Aarthi", reference: "x", category: "Pudhumai Penn", facts: factsFor("Pudhumai Penn"), decision: "AI Draft", decidedBy: "", notes: "" })
  assert.match(created.id, /^ELG-/)
  assert.equal((await getCase(created.id))?.facts.length, 3)
  const updated = await updateCase(created.id, { subject: "Aarthi", reference: "x", category: "Pudhumai Penn", facts: factsFor("Pudhumai Penn"), decision: "Approved", decidedBy: "BEO", notes: "ok" })
  assert.equal(updated?.decision, "Approved")
  assert.equal(await deleteCase(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedCases idempotent", async () => {
  __setTestDb(null)
  const before = await listCases()
  assert.ok(before.length >= 4)
  assert.equal(await seedCases(), 4)
  assert.equal((await listCases()).length, before.length)
})
