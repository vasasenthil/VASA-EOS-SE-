// VASA-EOS(SE) — Reasoning Engine (Engine 1 of 6).
//
// Forward-chaining, explainable rule inference: given a set of FACTS and policy-as-code
// RULES, it fires the rules whose conditions all hold and returns the derived conclusions
// each with the rule that produced it and a plain-language "because". Deterministic and
// fully auditable — the engine ASSISTS; a human decides. No side effects.

export type FactValue = string | number | boolean

export interface Condition {
  key: string
  /** "eq" | "ne" | "gte" | "lte" — numeric comparators require numeric facts. */
  op: "eq" | "ne" | "gte" | "lte"
  value: FactValue
}

export interface Rule {
  id: string
  /** All conditions must hold for the rule to fire (logical AND). */
  when: Condition[]
  then: string
  because: string
}

export interface ReasoningInput {
  facts: Record<string, FactValue>
  rules: Rule[]
}

export interface Derivation {
  conclusion: string
  because: string
  ruleId: string
}

export interface ReasoningResult {
  conclusions: Derivation[]
  /** Advisory confidence: 1 when at least one rule fired deterministically, else 0. */
  confidence: number
  explanation: string
  /** Engines never act autonomously — output is advisory for a human decision. */
  humanAuthority: true
}

function holds(c: Condition, facts: Record<string, FactValue>): boolean {
  const f = facts[c.key]
  if (f === undefined) return false
  switch (c.op) {
    case "eq":
      return f === c.value
    case "ne":
      return f !== c.value
    case "gte":
      return typeof f === "number" && typeof c.value === "number" && f >= c.value
    case "lte":
      return typeof f === "number" && typeof c.value === "number" && f <= c.value
  }
}

export function reason(input: ReasoningInput): ReasoningResult {
  const fired = input.rules.filter((r) => r.when.length > 0 && r.when.every((c) => holds(c, input.facts)))
  const conclusions: Derivation[] = fired.map((r) => ({ conclusion: r.then, because: r.because, ruleId: r.id }))
  const explanation = conclusions.length
    ? `${fired.length} of ${input.rules.length} rule(s) fired: ${fired.map((r) => r.id).join(", ")}.`
    : "No rule conditions were satisfied by the given facts."
  return { conclusions, confidence: conclusions.length ? 1 : 0, explanation, humanAuthority: true }
}
