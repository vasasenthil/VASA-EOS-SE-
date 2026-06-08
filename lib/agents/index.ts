// VASA-EOS(SE) — 8 specialised AI agents (Div III).
// Orchestration wrapper over the AgentProvider port. Adds confidence-gating
// (high-confidence => assertive; low => suggestion needing human judgement) and
// human-in-the-loop flags for high-stakes agents (welfare disbursement, compliance).

import { integrations } from "@/lib/integrations"
import type { AgentName, RetrievedChunk } from "@/lib/integrations"
import { toolsFor } from "./tools"

export interface AgentSpec {
  name: AgentName
  label: string
  scope: string
  tools: string[]
  /** High-stakes agents route actions through human approval. */
  highStakes?: boolean
}

export const AGENTS: AgentSpec[] = [
  { name: "curriculum", label: "Curriculum Agent", scope: "NCF 2023 + TN curriculum, content & lesson plans, Tamil-first delivery", tools: ["Bharat LLM", "Bhashini", "Anuvadini", "NCF KB"] },
  { name: "assessment", label: "Assessment Agent", scope: "Item generation, OMR, AI evaluation, knowledge tracing, Holistic Progress Card", tools: ["IRT engine", "OMR vision", "Whisper", "NLP"] },
  { name: "counselling", label: "Counselling Agent", scope: "Career guidance, PHQ-A mental-health screening, crisis flagging, counsellor handoff", tools: ["Mental health KB", "Career graphs", "NSDC"], highStakes: true },
  { name: "operations", label: "Operations Agent", scope: "Daily school ops, attendance, substitution, procurement, meal management", tools: ["Workflow engine", "Inventory DB", "GeM API"] },
  { name: "compliance", label: "Compliance Agent", scope: "RTE/RPwD/DPDP/POCSO/POSH compliance, recognition, audit prep", tools: ["Policy-as-code", "Regulatory KB", "Document AI"], highStakes: true },
  { name: "analytics", label: "Analytics Agent", scope: "Dropout prediction, learning-gap detection, scheme-leakage detection, ESG", tools: ["ML pipelines", "Graph analytics", "Time-series"] },
  { name: "communication", label: "Communication Agent", scope: "Multi-channel messaging, parent comms, grievance routing, IVR, 22 languages", tools: ["Bhashini", "IVR engine", "WhatsApp API"] },
  { name: "welfare", label: "Welfare Agent", scope: "Scheme eligibility, benefit calculation, DBT-APBS, fraud detection, dedup", tools: ["DBT API", "APBS", "Aadhaar bridge", "ML fraud"], highStakes: true },
]

const CONFIDENCE_THRESHOLD = 0.7

export interface AgentRunResult {
  agent: AgentName
  output: string
  confidence: number
  reasoning?: string
  mode: "mock" | "live"
  /** Above threshold => present assertively; below => present as a suggestion. */
  assertive: boolean
  /** High-stakes => action requires human approval before execution. */
  requiresApproval: boolean
  /** MCP tool names advertised to the model for this run. */
  availableTools: string[]
}

export async function runAgent(
  name: AgentName,
  input: string,
  context?: Record<string, unknown>,
): Promise<AgentRunResult> {
  const spec = AGENTS.find((a) => a.name === name)
  // Advertise the agent's MCP tools to the model (function-calling surface).
  const toolNames = toolsFor(name).map((t) => t.name)
  const res = await integrations.agents.invoke({
    agent: name,
    input,
    context: { ...context, tools: toolNames },
    requiresApproval: spec?.highStakes,
  })
  const confidence = res.data?.confidence ?? 0
  return {
    agent: name,
    output: res.data?.output ?? res.error ?? "No response",
    confidence,
    reasoning: res.data?.reasoning,
    mode: res.mode,
    assertive: confidence >= CONFIDENCE_THRESHOLD,
    requiresApproval: Boolean(spec?.highStakes),
    availableTools: toolNames,
  }
}

// ── RAG grounding: retrieve corpus chunks, then run the agent grounded on them ─
export interface Grounding {
  /** Numbered context block to prepend to the agent prompt. */
  context: string
  /** Distinct cited sources, in citation order. */
  sources: string[]
}

/** Compose a cited grounding block from retrieved chunks. Pure. */
export function composeGrounding(chunks: RetrievedChunk[]): Grounding {
  const sources: string[] = []
  const lines = chunks.map((c, i) => {
    if (!sources.includes(c.source)) sources.push(c.source)
    return `[${i + 1}] ${c.text} (${c.source})`
  })
  return { context: lines.join("\n"), sources }
}

export interface GroundedAgentResult extends AgentRunResult {
  /** Sources the answer was grounded on (empty when retrieval returned nothing). */
  sources: string[]
  grounded: boolean
}

/** Retrieve relevant corpus chunks (RAG), then run the agent grounded on them. */
export async function runGroundedAgent(
  name: AgentName,
  input: string,
  opts: { topK?: number; corpus?: string } = {},
): Promise<GroundedAgentResult> {
  const r = await integrations.retrieval.retrieve(input, opts)
  const chunks = r.ok ? r.data ?? [] : []
  const grounding = composeGrounding(chunks)
  const base = await runAgent(name, input, grounding.context ? { grounding: grounding.context } : undefined)
  return { ...base, sources: grounding.sources, grounded: chunks.length > 0 }
}
