import { test } from "node:test"
import assert from "node:assert/strict"
import { AGENT_TOOLS, toolsFor, toolByName, mcpManifest, toolSummary, type AgentTool } from "@/lib/agents/tools"
import { AGENTS, runAgent } from "@/lib/agents"

test("every agent declares well-formed MCP tools (valid JSON-Schema)", () => {
  for (const a of AGENTS) {
    const tools = toolsFor(a.name)
    assert.ok(tools.length >= 1, `${a.name} has no tools`)
    const names = new Set<string>()
    for (const t of tools) {
      assert.ok(!names.has(t.name), `duplicate tool ${t.name}`)
      names.add(t.name)
      assert.equal(t.inputSchema.type, "object")
      // every 'required' key exists in properties
      for (const r of t.inputSchema.required) assert.ok(r in t.inputSchema.properties, `${t.name}: required ${r} not declared`)
    }
  }
})

test("high-stakes agents expose at least one side-effecting tool (HITL surface)", () => {
  for (const a of AGENTS.filter((x) => x.highStakes)) {
    assert.ok(toolsFor(a.name).some((t: AgentTool) => t.sideEffect), `${a.name} should have a side-effect tool`)
  }
})

test("mcpManifest returns the MCP tools/list shape", () => {
  const m = mcpManifest("welfare")
  assert.ok(Array.isArray(m.tools))
  const dbt = m.tools.find((t) => t.name === "initiate_dbt")
  assert.ok(dbt)
  assert.equal(dbt?.inputSchema.type, "object")
  assert.ok("amount" in (dbt?.inputSchema.properties ?? {}))
})

test("toolByName resolves within an agent only", () => {
  assert.ok(toolByName("welfare", "initiate_dbt"))
  assert.equal(toolByName("curriculum", "initiate_dbt"), undefined) // not this agent's tool
})

test("summary counts agents, tools and side-effecting tools", () => {
  const s = toolSummary()
  assert.equal(s.agents, Object.keys(AGENT_TOOLS).length)
  assert.ok(s.tools >= 16)
  assert.ok(s.sideEffectTools >= 5)
})

test("runAgent advertises the agent's tools on the result", async () => {
  const r = await runAgent("welfare", "Is this student eligible?")
  assert.ok(r.availableTools.includes("check_eligibility"))
  assert.ok(r.availableTools.includes("initiate_dbt"))
})
