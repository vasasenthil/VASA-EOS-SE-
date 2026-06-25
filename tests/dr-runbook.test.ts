import { test } from "node:test"
import assert from "node:assert/strict"
import {
  RUNBOOKS,
  SEVERITY_LEVELS,
  ON_CALL_ROLES,
  runbookFor,
  severityById,
  unmappedScenarios,
  unknownOwners,
  runbookSummary,
  toMarkdown,
} from "@/lib/ops-posture/runbook"
import { DR_TIERS } from "@/lib/ops-posture"

test("every DR scenario has a runbook, and every runbook maps to a DR scenario", () => {
  // Referential integrity both ways: runbooks <-> declared DR tiers.
  assert.deepEqual(unmappedScenarios(), [])
  const covered = new Set(RUNBOOKS.map((r) => r.scenario))
  for (const t of DR_TIERS) assert.ok(covered.has(t.scenario), `no runbook for "${t.scenario}"`)
})

test("every recovery step names a known on-call role", () => {
  assert.deepEqual(unknownOwners(), [])
})

test("runbook steps are ordered 1..n and use valid phases", () => {
  const phases = new Set(["detect", "declare", "contain", "recover", "verify", "review"])
  for (const rb of RUNBOOKS) {
    rb.steps.forEach((s, i) => {
      assert.equal(s.order, i + 1, `${rb.scenario} step order`)
      assert.ok(phases.has(s.phase))
    })
    assert.ok(SEVERITY_LEVELS.some((sv) => sv.id === rb.severity))
  }
})

test("data-corruption / DC-outage are SEV1; lookups resolve", () => {
  assert.equal(runbookFor("Data corruption / ransomware")?.severity, "SEV1")
  assert.equal(runbookFor("Zone / DC outage")?.severity, "SEV1")
  assert.equal(severityById("SEV1")?.name, "Critical")
  assert.equal(runbookFor("nope"), undefined)
})

test("summary tallies and confirms full DR-scenario coverage", () => {
  const s = runbookSummary()
  assert.equal(s.runbooks, RUNBOOKS.length)
  assert.equal(s.severities, SEVERITY_LEVELS.length)
  assert.equal(s.onCallRoles, ON_CALL_ROLES.length)
  assert.equal(s.drScenariosCovered, DR_TIERS.length) // all declared scenarios covered
  assert.ok(s.steps >= RUNBOOKS.length)
})

test("Markdown renders the SLA matrix, roles and per-scenario runbooks", () => {
  const md = toMarkdown()
  assert.match(md, /## Incident severity \/ SLA matrix/)
  assert.match(md, /## On-call roles/)
  for (const rb of RUNBOOKS) assert.ok(md.includes(rb.scenario), `${rb.scenario} present`)
  assert.ok(md.includes("Incident Commander"))
})
