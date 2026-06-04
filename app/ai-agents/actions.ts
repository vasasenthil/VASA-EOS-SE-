"use server"

import { runAgent, type AgentRunResult } from "@/lib/agents"
import type { AgentName } from "@/lib/integrations"

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
