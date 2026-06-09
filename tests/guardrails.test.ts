import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  GUARDRAILS,
  AI_RISKS,
  guardrailById,
  byRisk,
  byPrinciple,
  unguardedRisks,
  guardrailSummary,
  toCSV,
} from "@/lib/agents/guardrails"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("every modelled AI risk has at least one guardrail", () => {
  assert.deepEqual(unguardedRisks(), [])
  assert.equal(guardrailSummary().risksCovered, AI_RISKS.length)
})

test("the register is well-formed: unique ids, valid risk/principle/status", () => {
  const ids = new Set<string>()
  const principles = new Set(["grounding", "human-agency", "privacy", "fairness", "accountability", "safety", "robustness"])
  for (const g of GUARDRAILS) {
    assert.ok(!ids.has(g.id), `duplicate ${g.id}`)
    ids.add(g.id)
    assert.ok(AI_RISKS.includes(g.risk))
    assert.ok(principles.has(g.principle))
    assert.ok(["enforced", "partial", "planned"].includes(g.status))
    assert.ok(g.description && g.control)
  }
})

test("every controlRef points at a real file in the repo (self-verifying)", () => {
  for (const g of GUARDRAILS) {
    assert.ok(existsSync(join(repoRoot, g.controlRef)), `${g.id} → missing control ${g.controlRef}`)
  }
})

test("high-stakes autonomy is human-gated; PII into prompts is consent-gated", () => {
  assert.equal(guardrailById("G3")?.controlRef, "lib/agents/dispatch.ts")
  assert.equal(guardrailById("G3")?.status, "enforced")
  assert.equal(guardrailById("G5")?.principle, "privacy")
  assert.ok(byPrinciple("human-agency").length >= 2)
  assert.ok(byRisk("hallucination").length >= 1)
})

test("summary tallies statuses and coverage", () => {
  const s = guardrailSummary()
  assert.equal(s.guardrails, GUARDRAILS.length)
  assert.equal(s.enforced + s.partial + s.planned, s.guardrails)
  assert.ok(s.enforced >= 1 && s.risksCovered === AI_RISKS.length)
})

test("CSV has a header plus one row per guardrail", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "ID,Risk,Principle,Description,Control,ControlRef,Status")
  assert.equal(lines.length, GUARDRAILS.length + 1)
})
