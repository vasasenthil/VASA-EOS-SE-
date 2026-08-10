import { csvField } from "@/lib/csv"
import { AGENTS, type AgentId } from "@/lib/ai/agents"
import { ENGINES, type EngineId } from "@/lib/ai/engines"
import { PROTECTED_CONSTITUENCIES, VASA_CHARTER } from "@/lib/governance/charter"

export type AiRegisterKind = "engine" | "agent"
export type AiRegisterRisk = "low" | "medium" | "high"
export type AiRegisterStatus = "registered" | "human-review-required" | "blocked"

export interface PublicModelCard {
  modelCardId: string
  purpose: string
  dataBoundary: string
  humanAuthority: string
  childSafety: string
  explainability: string
  monitoring: string
}

export interface AiRegisterEntry {
  id: string
  moduleId: "71.1"
  kind: AiRegisterKind
  name: string
  ownerTier: "G5" | "G6" | "G7"
  protectedConstituency: (typeof PROTECTED_CONSTITUENCIES)[number]
  risk: AiRegisterRisk
  status: AiRegisterStatus
  publicModelCard: PublicModelCard
}

const ENGINE_CONSTITUENCY: Record<EngineId, (typeof PROTECTED_CONSTITUENCIES)[number]> = {
  reasoning: "Policy Officers",
  personalisation: "Learners",
  assessment: "Teachers",
  policy: "Policy Officers",
  analytics: "Governance Officers",
  conversational: "Complainants",
  languageSpeech: "Parents & Community",
  prediction: "Learners",
}

const ENGINE_RISK: Record<EngineId, AiRegisterRisk> = {
  reasoning: "medium",
  personalisation: "medium",
  assessment: "high",
  policy: "high",
  analytics: "medium",
  conversational: "medium",
  languageSpeech: "high",
  prediction: "high",
}

const AGENT_CONSTITUENCY: Record<AgentId, (typeof PROTECTED_CONSTITUENCIES)[number]> = {
  policy: "Policy Officers",
  teacher: "Teachers",
  student: "Learners",
  governance: "Governance Officers",
  grievance: "Complainants",
  compliance: "Statutory Bodies",
  parentCommunity: "Parents & Community",
  inclusion: "Children with Disabilities",
}

export const AI_REGISTER: AiRegisterEntry[] = [
  ...ENGINES.map((engine): AiRegisterEntry => ({
    id: `engine:${engine.id}`,
    moduleId: "71.1",
    kind: "engine",
    name: engine.label,
    ownerTier: engine.id === "languageSpeech" || engine.id === "prediction" || engine.id === "assessment" ? "G6" : "G5",
    protectedConstituency: ENGINE_CONSTITUENCY[engine.id],
    risk: ENGINE_RISK[engine.id],
    status: ENGINE_RISK[engine.id] === "high" ? "human-review-required" : "registered",
    publicModelCard: {
      modelCardId: `MC-${engine.id}`,
      purpose: engine.purpose,
      dataBoundary: "Public register entry only; no child-level data, prompts or features are published.",
      humanAuthority: engine.id === "prediction" ? "Every alert routes to a named human; no automated action on a prediction." : "Advisory-only engine; humans decide consequential actions.",
      childSafety: engine.id === "languageSpeech" ? "Minor voice biometric capture is blocked; Tamil dialect scale-up requires published accuracy and review." : "No behavioural tracking or autonomous child-facing decision is permitted.",
      explainability: "Outputs must be citable, deterministic or accompanied by confidence and rationale.",
      monitoring: "Covered by quarterly bias/drift review and annual AI transparency reporting.",
    },
  })),
  ...AGENTS.map((agent): AiRegisterEntry => ({
    id: `agent:${agent.id}`,
    moduleId: "71.1",
    kind: "agent",
    name: agent.label,
    ownerTier: agent.highStakes ? "G6" : "G5",
    protectedConstituency: AGENT_CONSTITUENCY[agent.id],
    risk: agent.highStakes ? "high" : "medium",
    status: agent.highStakes ? "human-review-required" : "registered",
    publicModelCard: {
      modelCardId: `MC-agent-${agent.id}`,
      purpose: agent.goal,
      dataBoundary: agent.perception,
      humanAuthority: agent.oversight,
      childSafety: agent.id === "student" ? "Age-appropriate, advisory and non-high-stakes by construction." : agent.id === "inclusion" ? "Supports accommodations only; never diagnoses; specialist-in-the-loop for IEP actions." : agent.id === "parentCommunity" ? "Adult-facing only; never contacts a child directly and is consent-bound." : "No autonomous evaluation, denial or grievance closure.",
      explainability: `Composes ${agent.cognition.join(" + ")} with bounded confidence and human approval gates.`,
      monitoring: "Every tool dispatch is auditable; high-stakes/low-confidence actions require HITL approval.",
    },
  })),
]

export function aiRegisterSummary(entries: AiRegisterEntry[] = AI_REGISTER) {
  const engines = entries.filter((e) => e.kind === "engine").length
  const agents = entries.filter((e) => e.kind === "agent").length
  const highRisk = entries.filter((e) => e.risk === "high").length
  const humanReview = entries.filter((e) => e.status === "human-review-required").length
  const constituencies = new Set(entries.map((e) => e.protectedConstituency)).size
  return {
    entries: entries.length,
    engines,
    agents,
    highRisk,
    humanReview,
    constituencies,
    charterAligned: engines === VASA_CHARTER.aiEngines && agents === VASA_CHARTER.aiAgents && constituencies === PROTECTED_CONSTITUENCIES.length,
  }
}

export function aiRegisterToCSV(entries: AiRegisterEntry[] = AI_REGISTER): string {
  const header = ["id", "moduleId", "kind", "name", "ownerTier", "protectedConstituency", "risk", "status", "modelCardId", "purpose", "humanAuthority"]
  const rows = entries.map((e) => [e.id, e.moduleId, e.kind, e.name, e.ownerTier, e.protectedConstituency, e.risk, e.status, e.publicModelCard.modelCardId, e.publicModelCard.purpose, e.publicModelCard.humanAuthority])
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n"
}
