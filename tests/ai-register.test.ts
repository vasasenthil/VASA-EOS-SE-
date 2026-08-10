import { test } from "node:test"
import assert from "node:assert/strict"
import { AI_REGISTER, aiRegisterSummary, aiRegisterToCSV } from "@/lib/ai/register"
import { VASA_CHARTER, PROTECTED_CONSTITUENCIES } from "@/lib/governance/charter"

test("AI Register 71.1 publishes every engine and agent with model cards", () => {
  const summary = aiRegisterSummary()
  assert.equal(summary.engines, VASA_CHARTER.aiEngines)
  assert.equal(summary.agents, VASA_CHARTER.aiAgents)
  assert.equal(summary.entries, VASA_CHARTER.aiEngines + VASA_CHARTER.aiAgents)
  assert.equal(summary.charterAligned, true)

  for (const entry of AI_REGISTER) {
    assert.equal(entry.moduleId, "71.1")
    assert.ok(entry.publicModelCard.modelCardId)
    assert.ok(entry.publicModelCard.purpose)
    assert.ok(entry.publicModelCard.humanAuthority)
    assert.ok(entry.publicModelCard.childSafety)
    assert.ok(entry.publicModelCard.monitoring)
    assert.ok(PROTECTED_CONSTITUENCIES.includes(entry.protectedConstituency))
  }
})

test("high-risk engines and agents are explicitly human-review gated", () => {
  const highRisk = AI_REGISTER.filter((entry) => entry.risk === "high")
  assert.ok(highRisk.length >= 1)
  assert.ok(highRisk.every((entry) => entry.status === "human-review-required"))
  assert.match(AI_REGISTER.find((entry) => entry.id === "engine:prediction")!.publicModelCard.humanAuthority, /named human/)
  assert.match(AI_REGISTER.find((entry) => entry.id === "engine:languageSpeech")!.publicModelCard.childSafety, /Minor voice biometric capture is blocked/)
})

test("AI Register CSV is public-safe and has one row per entry", () => {
  const csv = aiRegisterToCSV()
  const lines = csv.trimEnd().split("\r\n")
  assert.equal(lines.length, AI_REGISTER.length + 1)
  assert.match(lines[0], /modelCardId/)
  assert.doesNotMatch(csv, /inputFeatures|prompt|studentName|apaar/i)
})
