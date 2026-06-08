"use server"

import { runAgent, type AgentRunResult } from "@/lib/agents"
import { dispatchTool, type ToolArgs, type ToolDispatchResult } from "@/lib/agents/dispatch"
import type { AgentName } from "@/lib/integrations"
import { appendAudit } from "@/lib/audit/trail"
import { logger } from "@/lib/logger"

export interface AgentConsoleState {
  result?: AgentRunResult
  error?: string
}

export async function invokeAgentAction(
  _prev: AgentConsoleState,
  formData: FormData,
): Promise<AgentConsoleState> {
  const agent = formData.get("agent") as AgentName | null
  const input = ((formData.get("input") as string) || "").trim()
  if (!agent || !input) return { error: "Select an agent and enter a prompt." }
  try {
    const result = await runAgent(agent, input)
    return { result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Agent invocation failed." }
  }
}

/**
 * Execute an MCP tool call. Side-effecting tools require `approved` (human-in-the-loop);
 * every dispatch is recorded in the tamper-evident audit ledger.
 */
export async function dispatchToolAction(
  agent: AgentName,
  tool: string,
  args: ToolArgs,
  approved = false,
): Promise<ToolDispatchResult> {
  const res = dispatchTool(agent, tool, args, { approved })
  try {
    await appendAudit({
      actor: `agent:${agent}`,
      action: res.executed ? "agent.tool.executed" : res.requiresApproval ? "agent.tool.pending" : "agent.tool.rejected",
      resource: tool,
      details: { ok: res.ok, executed: res.executed, requiresApproval: res.requiresApproval },
    })
  } catch (e) {
    logger.error("agent.tool audit failed", { error: String(e) })
  }
  return res
}
