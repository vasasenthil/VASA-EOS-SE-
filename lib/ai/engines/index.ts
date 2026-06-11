// VASA-EOS(SE) — the six AI Engines (Native-AI Engine Layer, brochure L8).
//
// Six purpose-built, deterministic, explainable engines that power the agents and modules.
// Each is pure, auditable, and ADVISORY — engines assist, humans decide; none performs a
// side effect. This module is the registry + shared metadata; each engine lives in its own
// file with its own typed input/output.

export * from "./reasoning"
export * from "./personalisation"
export * from "./assessment"
export * from "./policy"
export * from "./analytics"
export * from "./conversational"

export type EngineId =
  | "reasoning"
  | "personalisation"
  | "assessment"
  | "policy"
  | "analytics"
  | "conversational"

export interface EngineMeta {
  id: EngineId
  label: string
  purpose: string
  /** Where it is used across the platform. */
  poweredModules: string
}

export const ENGINES: EngineMeta[] = [
  { id: "reasoning", label: "Reasoning Engine", purpose: "Explainable forward-chaining inference over policy-as-code rules and facts.", poweredModules: "Eligibility, entitlements, compliance derivation" },
  { id: "personalisation", label: "Personalisation Engine", purpose: "Recommends the next learning objectives a learner is ready for, by mastery + prerequisites.", poweredModules: "Adaptive learning paths, remediation" },
  { id: "assessment", label: "Assessment Engine", purpose: "Scores responses against a rubric and diagnoses weak objectives per learner.", poweredModules: "Assessments, Holistic Progress Card, diagnostics" },
  { id: "policy", label: "Policy Engine", purpose: "Projects the coverage, cost and equity impact of a policy lever on a population.", poweredModules: "Scheme design, budget sanction, simulation" },
  { id: "analytics", label: "Analytics Engine", purpose: "Summary statistics, trend and anomaly detection over an indicator series.", poweredModules: "Dashboards, dropout/leakage flags, KPIs" },
  { id: "conversational", label: "Conversational Engine", purpose: "Grounded, cited retrieval-augmented answers from the TN pedagogical/policy corpus.", poweredModules: "Help desks, citizen Q&A, teacher assistant" },
]

export const ENGINE_COUNT = ENGINES.length
