// VASA-EOS(SE) — per-agent MCP tool definitions (Native-AI Fabric depth).
//
// Each of the 8 agents declares the tools it can call, in MCP shape: a name,
// description and JSON-Schema `inputSchema` (exactly what an MCP `tools/list`
// response carries). Side-effecting tools are flagged so the orchestrator routes
// them through human-in-the-loop approval and the audit ledger. Pure + client-safe;
// the wiring in lib/agents advertises these tools on every agent invocation.

import type { AgentName } from "@/lib/integrations"

export interface ToolSchema {
  type: "object"
  properties: Record<string, { type: "string" | "number" | "boolean"; description: string }>
  required: string[]
}

export interface AgentTool {
  name: string
  description: string
  inputSchema: ToolSchema
  /** True when the tool mutates state or triggers an external action. */
  sideEffect: boolean
}

function tool(name: string, description: string, props: ToolSchema["properties"], required: string[], sideEffect = false): AgentTool {
  return { name, description, inputSchema: { type: "object", properties: props, required }, sideEffect }
}

const S = (description: string) => ({ type: "string" as const, description })
const N = (description: string) => ({ type: "number" as const, description })

export const AGENT_TOOLS: Record<AgentName, AgentTool[]> = {
  curriculum: [
    tool("generate_lesson_plan", "Draft an NCF-aligned lesson plan", { topic: S("Lesson topic"), grade: N("Grade 1–12") }, ["topic", "grade"]),
    tool("translate_content", "Translate content into a target language (Bhashini)", { text: S("Source text"), language: S("Target language code") }, ["text", "language"]),
  ],
  assessment: [
    tool("generate_items", "Generate assessment items at a difficulty", { subject: S("Subject"), count: N("Number of items"), difficulty: S("easy|medium|hard") }, ["subject", "count"]),
    tool("update_hpc", "Write a Holistic Progress Card domain score", { apaar: S("APAAR id"), domain: S("HPC domain"), score: N("0–100") }, ["apaar", "domain", "score"], true),
  ],
  counselling: [
    tool("suggest_careers", "Suggest career pathways from interests", { interests: S("Comma-separated interests") }, ["interests"]),
    tool("flag_crisis", "Escalate a mental-health crisis to a counsellor", { apaar: S("APAAR id"), note: S("Observation") }, ["apaar", "note"], true),
  ],
  operations: [
    tool("plan_substitution", "Propose a teacher substitution plan", { date: S("YYYY-MM-DD"), absent: S("Absent teacher id") }, ["date", "absent"]),
    tool("raise_indent", "Raise a procurement indent", { item: S("Item"), qty: N("Quantity") }, ["item", "qty"], true),
  ],
  compliance: [
    tool("check_rte_compliance", "Check a school's RTE compliance", { udise: S("UDISE code") }, ["udise"]),
    tool("flag_violation", "Record a compliance violation for review", { kind: S("Violation type"), ref: S("Resource ref") }, ["kind", "ref"], true),
  ],
  analytics: [
    tool("predict_dropout", "Estimate dropout risk for a learner", { apaar: S("APAAR id") }, ["apaar"]),
    tool("detect_leakage", "Detect scheme-leakage signals", { scheme: S("Scheme code") }, ["scheme"]),
  ],
  communication: [
    tool("draft_message", "Draft a multilingual stakeholder message", { audience: S("Audience"), topic: S("Topic") }, ["audience", "topic"]),
    tool("send_ivr", "Place an IVR voice broadcast", { numbers: S("Recipient list"), message: S("Message") }, ["numbers", "message"], true),
  ],
  welfare: [
    tool("check_eligibility", "Check scheme eligibility for a learner", { apaar: S("APAAR id"), scheme: S("Scheme code") }, ["apaar", "scheme"]),
    tool("initiate_dbt", "Initiate a DBT/APBS disbursement", { apaar: S("APAAR id"), amount: N("Amount (₹)") }, ["apaar", "amount"], true),
  ],
}

export function toolsFor(agent: AgentName): AgentTool[] {
  return AGENT_TOOLS[agent] ?? []
}

export function toolByName(agent: AgentName, name: string): AgentTool | undefined {
  return toolsFor(agent).find((t) => t.name === name)
}

/** MCP `tools/list` manifest for an agent (the exact response shape). */
export function mcpManifest(agent: AgentName): { tools: { name: string; description: string; inputSchema: ToolSchema }[] } {
  return { tools: toolsFor(agent).map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }
}

export interface ToolSummary {
  agents: number
  tools: number
  sideEffectTools: number
}

export function toolSummary(): ToolSummary {
  const all = Object.values(AGENT_TOOLS).flat()
  return {
    agents: Object.keys(AGENT_TOOLS).length,
    tools: all.length,
    sideEffectTools: all.filter((t) => t.sideEffect).length,
  }
}
