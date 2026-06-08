// VASA-EOS(SE) — MCP tool-execution dispatcher (Native-AI runtime).
//
// Bridges a model's tool call to execution. It (1) resolves the tool on the agent,
// (2) validates the arguments against the tool's JSON-Schema, and (3) gates
// side-effecting tools behind explicit human approval (HITL) before running them.
// Pure + deterministic so it is unit-testable; the server action layer wraps this
// to append an audit entry per dispatch.

import type { AgentName } from "@/lib/integrations"
import { toolByName, type AgentTool } from "./tools"

export type ToolArgs = Record<string, string | number | boolean>

/** Validate args against a tool's inputSchema. Returns a list of human-readable errors. */
export function validateToolArgs(tool: AgentTool, args: ToolArgs): string[] {
  const errors: string[] = []
  for (const key of tool.inputSchema.required) {
    if (!(key in args) || args[key] === "" || args[key] === undefined) {
      errors.push(`missing required argument: ${key}`)
    }
  }
  for (const [key, val] of Object.entries(args)) {
    const spec = tool.inputSchema.properties[key]
    if (!spec) {
      errors.push(`unknown argument: ${key}`)
      continue
    }
    if (typeof val !== spec.type) {
      errors.push(`argument ${key} must be ${spec.type}`)
    }
  }
  return errors
}

export interface ToolDispatchResult {
  ok: boolean
  agent: AgentName
  tool: string
  /** True only when the tool actually ran. */
  executed: boolean
  /** Side-effecting tool not yet approved => awaiting human-in-the-loop sign-off. */
  requiresApproval: boolean
  output?: string
  errors?: string[]
}

// Deterministic handlers (the seam where a real MCP server / module action runs).
// Read-only tools execute immediately; the default returns a structured preview.
const HANDLERS: Record<string, (args: ToolArgs) => string> = {
  check_eligibility: (a) => `Eligibility check for ${a.apaar} under scheme ${a.scheme}: review benefit rules.`,
  check_rte_compliance: (a) => `RTE compliance snapshot for UDISE ${a.udise} prepared.`,
  predict_dropout: (a) => `Dropout-risk estimate computed for ${a.apaar}.`,
  suggest_careers: (a) => `Career pathways suggested for interests: ${a.interests}.`,
  generate_lesson_plan: (a) => `Draft lesson plan for "${a.topic}" (Grade ${a.grade}).`,
}

/**
 * Dispatch a tool call. Side-effecting tools are NOT executed unless opts.approved
 * is true — they return requiresApproval so the orchestrator routes them to a human.
 */
export function dispatchTool(
  agent: AgentName,
  toolName: string,
  args: ToolArgs,
  opts: { approved?: boolean } = {},
): ToolDispatchResult {
  const tool = toolByName(agent, toolName)
  if (!tool) {
    return { ok: false, agent, tool: toolName, executed: false, requiresApproval: false, errors: [`unknown tool for ${agent}: ${toolName}`] }
  }

  const errors = validateToolArgs(tool, args)
  if (errors.length > 0) {
    return { ok: false, agent, tool: toolName, executed: false, requiresApproval: false, errors }
  }

  if (tool.sideEffect && !opts.approved) {
    return {
      ok: true,
      agent,
      tool: toolName,
      executed: false,
      requiresApproval: true,
      output: `Awaiting human approval before executing ${toolName}.`,
    }
  }

  const handler = HANDLERS[toolName]
  const output = handler ? handler(args) : `Executed ${toolName} with ${Object.keys(args).length} argument(s).`
  return { ok: true, agent, tool: toolName, executed: true, requiresApproval: false, output }
}
