// VASA-EOS(SE) — the six AI Agents (Native-AI Agent Layer, brochure L9).
//
// Six purpose-built agents that COMPOSE the six engines into role-facing recommendations,
// every one under human authority. Each agent has the brochure's five-part anatomy:
//   1. goal        — what it is for
//   2. perception  — the inputs it reads
//   3. cognition   — the engine(s) it reasons with
//   4. action      — the advisory output it proposes
//   5. oversight   — the human gate before anything happens
// Agents are ADVISORY: they never act autonomously. High-stakes or low-confidence
// recommendations are flagged to require human approval (the agent tool-approval queue).

import {
  reason,
  personalise,
  assess,
  projectPolicy,
  analyse,
  converse,
  type Rule,
  type FactValue,
  type Objective,
  type RubricItem,
  type ItemResponse,
  type PolicyLever,
  type PopulationBaseline,
  type Doc,
  type EngineId,
} from "@/lib/ai/engines"

export type AgentId = "policy" | "teacher" | "student" | "governance" | "grievance" | "compliance"

export interface AgentSpec {
  id: AgentId
  label: string
  goal: string
  perception: string
  cognition: EngineId[]
  action: string
  oversight: string
  highStakes: boolean
}

export const AGENTS: AgentSpec[] = [
  { id: "policy", label: "Policy Agent", goal: "Advise a sanctioning authority on a policy lever's impact.", perception: "Policy lever + population baseline", cognition: ["policy", "reasoning"], action: "Proposes a projected coverage/cost/equity note", oversight: "Sanction requires a human authority", highStakes: true },
  { id: "teacher", label: "Teacher Agent", goal: "Turn assessment results into a remediation plan.", perception: "Rubric, responses, syllabus, mastery", cognition: ["assessment", "personalisation"], action: "Diagnoses weak objectives + recommends next steps", oversight: "The teacher decides what to teach", highStakes: false },
  { id: "student", label: "Student Agent", goal: "Guide a learner to their next objective and answer questions.", perception: "Learner mastery, syllabus, a question, corpus", cognition: ["personalisation", "conversational"], action: "Recommends next objective + a grounded answer", oversight: "Advisory to the learner and teacher", highStakes: false },
  { id: "governance", label: "Governance Agent", goal: "Surface risk in an indicator for an officer.", perception: "An indicator series + optional rules/facts", cognition: ["analytics", "reasoning"], action: "Flags anomalies + derives conclusions", oversight: "The officer investigates and decides", highStakes: false },
  { id: "grievance", label: "Grievance Agent", goal: "Recommend routing and cite the governing policy.", perception: "Grievance facts + a query + corpus", cognition: ["reasoning", "conversational"], action: "Proposes a tier + a cited policy basis", oversight: "The tier officer resolves or escalates", highStakes: false },
  { id: "compliance", label: "Compliance Agent", goal: "Derive compliance findings from school facts.", perception: "School facts + compliance rules", cognition: ["reasoning"], action: "Lists findings (RTE/RPwD/DPDP/POCSO)", oversight: "A compliance officer signs off", highStakes: true },
]

export function agentSpec(id: AgentId): AgentSpec {
  const s = AGENTS.find((a) => a.id === id)
  if (!s) throw new Error(`unknown agent ${id}`)
  return s
}

export interface AgentRecommendation {
  agent: AgentId
  summary: string
  confidence: number
  enginesUsed: EngineId[]
  detail: string
  /** True when a human MUST approve before any action (high-stakes or low-confidence). */
  requiresHumanApproval: boolean
  /** Agents never act autonomously. */
  humanAuthority: true
}

const APPROVAL_CONFIDENCE = 0.7

function finalise(id: AgentId, summary: string, detail: string, confidence: number): AgentRecommendation {
  const spec = agentSpec(id)
  return {
    agent: id,
    summary,
    detail,
    confidence,
    enginesUsed: spec.cognition,
    requiresHumanApproval: spec.highStakes || confidence < APPROVAL_CONFIDENCE,
    humanAuthority: true,
  }
}

export function runPolicyAgent(input: { lever: PolicyLever; baseline: PopulationBaseline }): AgentRecommendation {
  const p = projectPolicy(input.baseline, input.lever)
  return finalise("policy", p.explanation, `${p.equityNote} (newly covered ${p.newlyCovered.toLocaleString("en-IN")}, ~₹${p.indicativeCost.toLocaleString("en-IN")})`, p.confidence)
}

export function runTeacherAgent(input: { rubric: RubricItem[]; responses: ItemResponse[]; syllabus: Objective[]; mastery: Record<string, number> }): AgentRecommendation {
  const a = assess(input.rubric, input.responses)
  const rec = personalise({ mastery: input.mastery, syllabus: input.syllabus })
  const next = rec.recommendations.map((r) => r.label).slice(0, 3).join(", ") || "none pending"
  const summary = `${a.pct}% (band ${a.band}); ${a.weakObjectives.length ? `remediate ${a.weakObjectives.join(", ")}` : "no weak objectives"}.`
  return finalise("teacher", summary, `Next objectives: ${next}.`, Math.min(a.confidence, rec.confidence))
}

export function runStudentAgent(input: { mastery: Record<string, number>; syllabus: Objective[]; question: string; corpus: Doc[] }): AgentRecommendation {
  const rec = personalise({ mastery: input.mastery, syllabus: input.syllabus })
  const ans = converse(input.question, input.corpus)
  const next = rec.recommendations[0]?.label ?? "all objectives mastered"
  return finalise("student", `Suggested next: ${next}.`, ans.grounded ? `Q: answered — ${ans.answer} [${ans.citations.map((c) => c.source).join(", ")}]` : "Q: no grounded answer in the corpus.", Math.min(rec.confidence, ans.grounded ? ans.confidence : 0.5))
}

export function runGovernanceAgent(input: { indicator: number[]; facts?: Record<string, FactValue>; rules?: Rule[] }): AgentRecommendation {
  const a = analyse(input.indicator)
  const inf = input.facts && input.rules ? reason({ facts: input.facts, rules: input.rules }) : null
  const flags = a.anomalies.length ? `anomaly at index ${a.anomalies.join(", ")}` : "no anomalies"
  const summary = `Trend ${a.trend}, ${flags}.`
  const detail = inf && inf.conclusions.length ? `Derived: ${inf.conclusions.map((c) => c.conclusion).join("; ")}.` : "No rule-based conclusions."
  return finalise("governance", summary, detail, a.confidence)
}

export function runGrievanceAgent(input: { facts: Record<string, FactValue>; rules: Rule[]; query: string; corpus: Doc[] }): AgentRecommendation {
  const route = reason({ facts: input.facts, rules: input.rules })
  const cite = converse(input.query, input.corpus)
  const tier = route.conclusions[0]?.conclusion ?? "School (default tier)"
  return finalise("grievance", `Route to: ${tier}.`, cite.grounded ? `Policy basis: ${cite.answer} [${cite.citations.map((c) => c.source).join(", ")}]` : "No policy citation found in the corpus.", route.confidence ? (cite.grounded ? cite.confidence : 0.6) : 0.4)
}

export function runComplianceAgent(input: { facts: Record<string, FactValue>; rules: Rule[] }): AgentRecommendation {
  const r = reason({ facts: input.facts, rules: input.rules })
  const findings = r.conclusions.map((c) => c.conclusion)
  const summary = findings.length ? `${findings.length} finding(s): ${findings.join("; ")}.` : "No compliance issues derived."
  return finalise("compliance", summary, r.explanation, r.confidence)
}

export const AGENT_COUNT = AGENTS.length
