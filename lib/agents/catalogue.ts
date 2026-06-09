// VASA-EOS(SE) — agent capability catalogue (Native-AI Fabric).
//
// Makes the "8 specialised agents" concrete and inspectable: each agent's scope, the
// human-named capabilities it declares, the actual MCP tools it can dispatch, whether it
// is high-stakes (and therefore human-in-the-loop), and the confidence threshold above
// which its output is assertive rather than a suggestion. Composed from the live AGENTS
// spec and the AGENT_TOOLS MCP definitions, so it can't drift; a test asserts every agent
// has MCP tools and that high-stakes agents are HITL. Pure + client-safe.

import { AGENTS, ASSERTIVE_CONFIDENCE_THRESHOLD } from "./index"
import { toolsFor } from "./tools"
import type { AgentName } from "@/lib/integrations"

export { ASSERTIVE_CONFIDENCE_THRESHOLD }

export interface AgentCapability {
  name: AgentName
  label: string
  scope: string
  /** Human-named capabilities declared on the agent spec. */
  declaredTools: string[]
  /** Actual MCP tool names the agent can dispatch (from AGENT_TOOLS). */
  mcpTools: string[]
  highStakes: boolean
  /** High-stakes agents route actions through human approval. */
  humanInLoop: boolean
}

export function agentCapabilities(): AgentCapability[] {
  return AGENTS.map((a) => {
    const highStakes = a.highStakes === true
    return {
      name: a.name,
      label: a.label,
      scope: a.scope,
      declaredTools: a.tools,
      mcpTools: toolsFor(a.name).map((t) => t.name),
      highStakes,
      humanInLoop: highStakes,
    }
  })
}

export function capabilityFor(name: AgentName): AgentCapability | undefined {
  return agentCapabilities().find((c) => c.name === name)
}

/** Agents that declare no MCP tools (should be none — every agent must be actionable). */
export function agentsWithoutTools(): AgentName[] {
  return agentCapabilities().filter((c) => c.mcpTools.length === 0).map((c) => c.name)
}

export interface AgentCatalogueSummary {
  agents: number
  highStakes: number
  humanInLoop: number
  mcpTools: number
  confidenceThreshold: number
}

export function agentCatalogueSummary(): AgentCatalogueSummary {
  const caps = agentCapabilities()
  return {
    agents: caps.length,
    highStakes: caps.filter((c) => c.highStakes).length,
    humanInLoop: caps.filter((c) => c.humanInLoop).length,
    mcpTools: caps.reduce((n, c) => n + c.mcpTools.length, 0),
    confidenceThreshold: ASSERTIVE_CONFIDENCE_THRESHOLD,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(caps: AgentCapability[] = agentCapabilities()): string {
  const header = ["Agent", "Scope", "MCP tools", "High-stakes", "Human-in-the-loop"]
  const rows = caps.map((c) =>
    [c.label, c.scope, c.mcpTools.join("; "), c.highStakes ? "yes" : "no", c.humanInLoop ? "yes" : "no"].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
