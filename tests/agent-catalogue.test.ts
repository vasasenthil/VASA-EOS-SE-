import { test } from "node:test"
import assert from "node:assert/strict"
import {
  agentCapabilities,
  capabilityFor,
  agentsWithoutTools,
  agentCatalogueSummary,
  ASSERTIVE_CONFIDENCE_THRESHOLD,
  toCSV,
} from "@/lib/agents/catalogue"
import { AGENTS } from "@/lib/agents"

test("the catalogue covers every declared agent", () => {
  const caps = agentCapabilities()
  assert.equal(caps.length, AGENTS.length)
  assert.ok(caps.length >= 8)
  const names = new Set(caps.map((c) => c.name))
  for (const a of AGENTS) assert.ok(names.has(a.name), `missing ${a.name}`)
})

test("every agent declares at least one MCP tool (self-verifying actionability)", () => {
  assert.deepEqual(agentsWithoutTools(), [])
  for (const c of agentCapabilities()) assert.ok(c.mcpTools.length >= 1, `${c.name} has no MCP tools`)
})

test("high-stakes agents are human-in-the-loop", () => {
  for (const c of agentCapabilities()) {
    if (c.highStakes) assert.equal(c.humanInLoop, true, `${c.name} must be HITL`)
  }
  // counselling, compliance and welfare are high-stakes
  for (const n of ["counselling", "compliance", "welfare"] as const) {
    assert.equal(capabilityFor(n)?.highStakes, true)
  }
})

test("confidence threshold is the real engine value (0 < t < 1)", () => {
  assert.equal(ASSERTIVE_CONFIDENCE_THRESHOLD, 0.7)
  assert.ok(ASSERTIVE_CONFIDENCE_THRESHOLD > 0 && ASSERTIVE_CONFIDENCE_THRESHOLD < 1)
})

test("summary tallies agents, high-stakes, HITL and tools", () => {
  const s = agentCatalogueSummary()
  assert.equal(s.agents, AGENTS.length)
  assert.equal(s.highStakes, s.humanInLoop) // every high-stakes agent is HITL
  assert.ok(s.highStakes >= 1 && s.mcpTools >= s.agents)
  assert.equal(s.confidenceThreshold, ASSERTIVE_CONFIDENCE_THRESHOLD)
})

test("CSV has a header plus one row per agent", () => {
  const lines = toCSV().split("\r\n").filter(Boolean)
  assert.equal(lines[0], "Agent,Scope,MCP tools,High-stakes,Human-in-the-loop")
  assert.equal(lines.length, agentCapabilities().length + 1)
})
