// VASA-EOS(SE) — responsible-AI guardrails register (Native-AI Fabric pillar).
//
// AI here advises on children's education and welfare, so every model risk must have a
// declared, enforced control. This maps the responsible-AI principles (grounding,
// human agency, privacy, fairness, accountability, safety, robustness) to the concrete
// guardrail in the codebase that enforces them, via a real controlRef path (a test
// asserts each exists on disk — self-verifying, like the architecture matrix and STRIDE
// threat model). Pure + client-safe. AI is advisory: high-stakes actions stay
// human-in-the-loop; this register is the governance face of that commitment.

export type AiRisk =
  | "hallucination"
  | "unsafe-action"
  | "pii-exposure"
  | "prompt-injection"
  | "bias-fairness"
  | "lack-of-oversight"
  | "non-auditability"
  | "authz-bypass"

export type RaiPrinciple =
  | "grounding"
  | "human-agency"
  | "privacy"
  | "fairness"
  | "accountability"
  | "safety"
  | "robustness"

export type GuardrailStatus = "enforced" | "partial" | "planned"

export interface Guardrail {
  id: string
  risk: AiRisk
  principle: RaiPrinciple
  /** The risk if unguarded. */
  description: string
  /** The control that mitigates it. */
  control: string
  /** Repository path implementing the control (asserted to exist on disk). */
  controlRef: string
  status: GuardrailStatus
}

export const GUARDRAILS: Guardrail[] = [
  { id: "G1", risk: "hallucination", principle: "grounding", description: "Model invents facts not in the curriculum/record", control: "RAG grounding — answers composed from retrieved, cited chunks", controlRef: "lib/integrations/live/retrieval.ts", status: "partial" },
  { id: "G2", risk: "hallucination", principle: "robustness", description: "Low-confidence output presented as authoritative", control: "Confidence gating — below threshold is shown as a suggestion, not an assertion", controlRef: "lib/agents/index.ts", status: "enforced" },
  { id: "G3", risk: "unsafe-action", principle: "human-agency", description: "Agent autonomously performs a high-stakes action (DBT, record change)", control: "HITL-gated MCP tool dispatch — privileged tools require human approval", controlRef: "lib/agents/dispatch.ts", status: "enforced" },
  { id: "G4", risk: "lack-of-oversight", principle: "human-agency", description: "No human review queue for agent-proposed actions", control: "Approval inbox — proposed tool calls queue for an authorised human", controlRef: "lib/agentflow/store.ts", status: "enforced" },
  { id: "G5", risk: "pii-exposure", principle: "privacy", description: "Student PII flows into a model prompt without basis", control: "Consent-gated, minimised PII reads (fail-closed) feed any AI context", controlRef: "lib/consent/gate-server.ts", status: "enforced" },
  { id: "G6", risk: "prompt-injection", principle: "safety", description: "Untrusted content coerces the agent into an unauthorised tool call", control: "Deny-by-default tool dispatch + human approval breaks the injection chain", controlRef: "lib/agents/dispatch.ts", status: "partial" },
  { id: "G7", risk: "authz-bypass", principle: "safety", description: "Using an agent to act beyond the user's permissions", control: "AI acts within the 5-model PDP; deny-wins authorization still applies", controlRef: "lib/access/policy.ts", status: "enforced" },
  { id: "G8", risk: "non-auditability", principle: "accountability", description: "AI decisions/tool-calls cannot be reconstructed after the fact", control: "Every agent decision & tool call appended to the tamper-evident audit ledger", controlRef: "lib/audit/trail.ts", status: "enforced" },
  { id: "G9", risk: "bias-fairness", principle: "fairness", description: "Predictive scores (dropout/learning-gap) bias against a group", control: "Scores are advisory inputs to human review, never automated denials; periodic fairness review", controlRef: "lib/agentflow/store.ts", status: "partial" },
]

export const AI_RISKS: AiRisk[] = [
  "hallucination",
  "unsafe-action",
  "pii-exposure",
  "prompt-injection",
  "bias-fairness",
  "lack-of-oversight",
  "non-auditability",
  "authz-bypass",
]

export function guardrailById(id: string): Guardrail | undefined {
  return GUARDRAILS.find((g) => g.id === id)
}

export function byRisk(risk: AiRisk): Guardrail[] {
  return GUARDRAILS.filter((g) => g.risk === risk)
}

export function byPrinciple(principle: RaiPrinciple): Guardrail[] {
  return GUARDRAILS.filter((g) => g.principle === principle)
}

/** AI risks with no declared guardrail (should be none). */
export function unguardedRisks(): AiRisk[] {
  return AI_RISKS.filter((r) => byRisk(r).length === 0)
}

export interface GuardrailSummary {
  guardrails: number
  risksCovered: number
  principles: number
  enforced: number
  partial: number
  planned: number
}

export function guardrailSummary(items: Guardrail[] = GUARDRAILS): GuardrailSummary {
  return {
    guardrails: items.length,
    risksCovered: new Set(items.map((g) => g.risk)).size,
    principles: new Set(items.map((g) => g.principle)).size,
    enforced: items.filter((g) => g.status === "enforced").length,
    partial: items.filter((g) => g.status === "partial").length,
    planned: items.filter((g) => g.status === "planned").length,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: Guardrail[] = GUARDRAILS): string {
  const header = ["ID", "Risk", "Principle", "Description", "Control", "ControlRef", "Status"]
  const rows = items.map((g) =>
    [g.id, g.risk, g.principle, g.description, g.control, g.controlRef, g.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
