// VASA-EOS(SE) — Eligibility & Compliance Checker: Reasoning Engine wired with HITL.
//
// AI-native policy-as-code, not a checklist: an officer captures the FACTS about an applicant/school
// and the Reasoning Engine (lib/ai/engines/reasoning, Engine 1 of 6) fires the policy rules whose
// conditions all hold, returning each derived conclusion with the rule and a plain-language
// "because" — deterministic, fully auditable, humanAuthority. A human then DECIDES (approve / reject)
// — the engine assists, a human decides. The derivation is recomputed on read so it is always
// reproducible from the facts + the published rule set.

import { reason, type Rule, type FactValue, type ReasoningResult } from "@/lib/ai/engines/reasoning"

export type { ReasoningResult }

export type FactType = "number" | "bool" | "enum" | "text"

export interface FactKey {
  key: string
  label: string
  type: FactType
  options?: string[]
}

export interface RuleSet {
  category: string
  description: string
  factKeys: FactKey[]
  rules: Rule[]
}

/** Published policy-as-code rule library (eligibility + compliance). */
export const RULE_SETS: Record<string, RuleSet> = {
  "Pudhumai Penn": {
    category: "Pudhumai Penn",
    description: "₹1,000/month for girls from government schools entering higher education.",
    factKeys: [
      { key: "gender", label: "Gender", type: "enum", options: ["Female", "Male", "Other"] },
      { key: "schoolType", label: "School type (Class 6–12)", type: "enum", options: ["Government", "Aided", "Private"] },
      { key: "pursuingHigherEd", label: "Pursuing higher education", type: "bool" },
    ],
    rules: [
      { id: "PP-1", when: [{ key: "gender", op: "eq", value: "Female" }, { key: "schoolType", op: "eq", value: "Government" }, { key: "pursuingHigherEd", op: "eq", value: true }], then: "Eligible for Pudhumai Penn (₹1,000/month)", because: "Girl who studied in a government school and is entering higher education." },
    ],
  },
  "RTE 25%": {
    category: "RTE 25%",
    description: "Free seat in a private unaided school for EWS/disadvantaged children (RTE Sec 12(1)(c)).",
    factKeys: [
      { key: "annualIncome", label: "Annual family income (₹)", type: "number" },
      { key: "age", label: "Age (years)", type: "number" },
    ],
    rules: [
      { id: "RTE-1", when: [{ key: "annualIncome", op: "lte", value: 200000 }, { key: "age", op: "gte", value: 6 }, { key: "age", op: "lte", value: 14 }], then: "Eligible for RTE 25% free seat", because: "EWS/disadvantaged child within the RTE 6–14 age band." },
    ],
  },
  "Post-Matric Scholarship": {
    category: "Post-Matric Scholarship",
    description: "Post-matric scholarship for SC/ST students below the income ceiling.",
    factKeys: [
      { key: "socialCategory", label: "Social category", type: "enum", options: ["OC", "BC", "MBC", "SC", "ST"] },
      { key: "annualIncome", label: "Annual family income (₹)", type: "number" },
    ],
    rules: [
      { id: "PMS-SC", when: [{ key: "socialCategory", op: "eq", value: "SC" }, { key: "annualIncome", op: "lte", value: 250000 }], then: "Eligible for Post-Matric Scholarship", because: "SC student below the income ceiling (₹2.5 L)." },
      { id: "PMS-ST", when: [{ key: "socialCategory", op: "eq", value: "ST" }, { key: "annualIncome", op: "lte", value: 250000 }], then: "Eligible for Post-Matric Scholarship", because: "ST student below the income ceiling (₹2.5 L)." },
    ],
  },
  "School Compliance": {
    category: "School Compliance",
    description: "RTE infrastructure & PTR compliance flags for a school.",
    factKeys: [
      { key: "pupilTeacherRatio", label: "Pupil–teacher ratio (x:1)", type: "number" },
      { key: "hasGirlsToilet", label: "Girls' toilet present", type: "bool" },
      { key: "hasDrinkingWater", label: "Drinking water present", type: "bool" },
    ],
    rules: [
      { id: "CMP-PTR", when: [{ key: "pupilTeacherRatio", op: "gte", value: 31 }], then: "PTR exceeds the RTE norm (30:1) — compliance gap", because: "Pupil–teacher ratio is 31:1 or higher." },
      { id: "CMP-WC", when: [{ key: "hasGirlsToilet", op: "eq", value: false }], then: "Girls' toilet missing — RTE/WASH compliance gap", because: "No functional girls' toilet reported." },
      { id: "CMP-WATER", when: [{ key: "hasDrinkingWater", op: "eq", value: false }], then: "Drinking water missing — compliance gap", because: "No safe drinking water reported." },
    ],
  },
}

export const CATEGORIES = Object.keys(RULE_SETS)

export const DECISIONS = ["AI Draft", "Approved", "Rejected"] as const
export type Decision = (typeof DECISIONS)[number]

export interface FactEntry {
  key: string
  value: string
}

export interface EligibilityCase {
  id: string
  subject: string
  reference: string
  category: string
  facts: FactEntry[]
  decision: Decision
  decidedBy: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CaseInput {
  subject: string
  reference: string
  category: string
  facts: FactEntry[]
  decision: Decision
  decidedBy: string
  notes: string
}

export function emptyCase(): CaseInput {
  const cat = CATEGORIES[0]
  return { subject: "", reference: "", category: cat, facts: factsFor(cat), decision: "AI Draft", decidedBy: "", notes: "" }
}

/** Default fact rows for a category (one per published fact key). */
export function factsFor(category: string): FactEntry[] {
  const set = RULE_SETS[category]
  if (!set) return []
  return set.factKeys.map((fk) => ({ key: fk.key, value: fk.type === "bool" ? "false" : fk.type === "enum" ? (fk.options?.[0] ?? "") : "" }))
}

function typed(facts: FactEntry[], category: string): Record<string, FactValue> {
  const set = RULE_SETS[category]
  const byKey = new Map((set?.factKeys ?? []).map((fk) => [fk.key, fk.type]))
  const out: Record<string, FactValue> = {}
  for (const f of facts) {
    const t = byKey.get(f.key) ?? "text"
    if (t === "number") { const n = Number(f.value); if (Number.isFinite(n)) out[f.key] = n }
    else if (t === "bool") out[f.key] = f.value === "true"
    else if (f.value !== "") out[f.key] = f.value
  }
  return out
}

/** Run the Reasoning Engine over the facts + the category's published rules — genuinely Engine 1. */
export function derive(facts: FactEntry[], category: string): ReasoningResult {
  const set = RULE_SETS[category]
  if (!set) return { conclusions: [], confidence: 0, explanation: "Unknown rule set.", humanAuthority: true }
  return reason({ facts: typed(facts, category), rules: set.rules })
}

export type CaseErrors = Partial<Record<keyof CaseInput, string>>

export function validateCase(f: CaseInput): { ok: boolean; errors: CaseErrors } {
  const e: CaseErrors = {}
  if (!f.subject.trim()) e.subject = "Subject (applicant/school) is required"
  if (!CATEGORIES.includes(f.category)) e.category = "Select a rule set"
  if (!(DECISIONS as readonly string[]).includes(f.decision)) e.decision = "Select a decision"
  if (f.decision !== "AI Draft" && !f.decidedBy.trim()) e.decidedBy = "Decider is required once past AI Draft"
  if (!Array.isArray(f.facts) || f.facts.length === 0) e.facts = "Provide the facts for this rule set"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export interface CaseFilters {
  query?: string
  category?: string
  decision?: string
  page?: number
  pageSize?: number
}

export interface CaseSummary {
  total: number
  withConclusion: number
  approved: number
  pending: number
}

export interface CasePage {
  cases: EligibilityCase[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: CaseSummary
}

const DEFAULT_PAGE_SIZE = 10

export function caseSummary(all: EligibilityCase[]): CaseSummary {
  let withConclusion = 0, approved = 0, pending = 0
  for (const c of all) {
    if (derive(c.facts, c.category).conclusions.length > 0) withConclusion++
    if (c.decision === "Approved") approved++
    if (c.decision === "AI Draft") pending++
  }
  return { total: all.length, withConclusion, approved, pending }
}

export function queryCases(all: EligibilityCase[], f: CaseFilters = {}): CasePage {
  const q = (f.query ?? "").trim().toLowerCase()
  const rows = all.filter((c) => {
    if (q && !(`${c.subject} ${c.reference}`.toLowerCase().includes(q))) return false
    if (f.category && c.category !== f.category) return false
    if (f.decision && c.decision !== f.decision) return false
    return true
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  const summary = caseSummary(rows)
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { cases: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
