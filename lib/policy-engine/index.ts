// VASA-EOS(SE) — Policy-as-Code engine: Education Acts as an ENFORCED runtime gate.
//
// The audit found regulation was mostly DECLARATIVE (registers, checklists) — honest, but it did not
// stop a non-compliant action at runtime. This is the executable layer: each statutory rule is code
// with a pure predicate over the action + its context, an effect (deny / require-approval / permit),
// and the CITATION that justifies it. evaluate() composes them deny-wins, then require-approval, then
// permit — so a fund release without a sanction is DENIED citing the rule, a high-value release needs
// approval, and a compliant action passes. The server gate (./server) audits every decision with the
// rule id, giving the brief's "every decision traceable to the clause that justified it". Pure +
// deterministic + client-safe (the simulator runs it in the browser).

export type PolicyEffect = "permit" | "deny" | "require-approval"
export type PolicySeverity = "block" | "gate" | "advisory"

export interface PolicyContext {
  /** The action being attempted, e.g. "fund.release", "student.expel", "pii.process". */
  action: string
  subject?: { role?: string; tier?: string }
  /** Attributes of the resource/decision, e.g. { age: 8, sanctioned: false, amount: 9000000 }. */
  resource?: Record<string, string | number | boolean>
}

export interface PolicyRule {
  id: string
  /** The Act / regulation this rule enforces. */
  act: string
  /** The specific clause. */
  clause: string
  title: string
  effect: PolicyEffect
  severity: PolicySeverity
  /** Human-legible citation shown with the decision. */
  citation: string
  rationale: string
  /** Actions this rule is relevant to (for the register/simulator). */
  appliesTo: string[]
  /** Pure predicate: does this rule fire for the given context? */
  match: (ctx: PolicyContext) => boolean
}

// ── context readers ──────────────────────────────────────────────────────────────────────────────
const num = (ctx: PolicyContext, k: string): number => Number(ctx.resource?.[k] ?? Number.NaN)
const bool = (ctx: PolicyContext, k: string): boolean => ctx.resource?.[k] === true
const isAction = (ctx: PolicyContext, ...actions: string[]): boolean => actions.includes(ctx.action)

/** High-value fund releases require secretariat approval above this threshold (₹). */
export const FUND_APPROVAL_THRESHOLD = 5_000_000

// ── the statutory rule set (Education Acts as code) ────────────────────────────────────────────────
export const POLICY_RULES: PolicyRule[] = [
  {
    id: "RTE-NO-DETENTION",
    act: "RTE Act 2009",
    clause: "§16 (as amended) · Art. 21A",
    title: "No expulsion or detention of a child 6–14",
    effect: "deny",
    severity: "block",
    citation: "RTE Act 2009 §16 — no child admitted shall be held back or expelled till elementary education is complete.",
    rationale: "Elementary education is a fundamental right; a school cannot expel or detain a 6–14 child.",
    appliesTo: ["student.expel", "student.detain"],
    match: (ctx) => isAction(ctx, "student.expel", "student.detain") && num(ctx, "age") >= 6 && num(ctx, "age") <= 14,
  },
  {
    id: "RTE-NO-SCREENING",
    act: "RTE Act 2009",
    clause: "§13(1)",
    title: "No screening procedure or capitation fee at admission",
    effect: "deny",
    severity: "block",
    citation: "RTE Act 2009 §13(1) — no school shall subject a child to any screening procedure or collect any capitation fee.",
    rationale: "Admission screening and capitation fees are prohibited.",
    appliesTo: ["admission.screen", "fee.capitation"],
    match: (ctx) => isAction(ctx, "admission.screen", "fee.capitation"),
  },
  {
    id: "RTE-EWS-QUOTA",
    act: "RTE Act 2009",
    clause: "§12(1)(c)",
    title: "25% EWS/DG quota — rejection needs authority review",
    effect: "require-approval",
    severity: "gate",
    citation: "RTE Act 2009 §12(1)(c) — at least 25% of entry-class seats are reserved for EWS/disadvantaged groups.",
    rationale: "Rejecting an EWS/DG applicant while the 25% quota is unmet must be reviewed by the BEO/DEO.",
    appliesTo: ["admission.reject"],
    match: (ctx) => ctx.action === "admission.reject" && ["EWS", "DG"].includes(String(ctx.resource?.category ?? "")) && !bool(ctx, "quotaFull"),
  },
  {
    id: "RPWD-ACCOMMODATION",
    act: "RPwD Act 2016",
    clause: "§16 · §31",
    title: "Reasonable accommodation for a CWSN learner is mandatory",
    effect: "deny",
    severity: "block",
    citation: "RPwD Act 2016 §16/§31 — inclusive education with reasonable accommodation for children with disabilities.",
    rationale: "Assessing or admitting a PwD learner without the required accommodation denies an inclusive-education right.",
    appliesTo: ["assessment.conduct", "admission.process"],
    match: (ctx) => isAction(ctx, "assessment.conduct", "admission.process") && bool(ctx, "pwd") && !bool(ctx, "accommodation"),
  },
  {
    id: "DPDP-CONSENT",
    act: "DPDP Act 2023",
    clause: "§6 · §9",
    title: "Lawful, purpose-bound consent required before processing personal data",
    effect: "deny",
    severity: "block",
    citation: "DPDP Act 2023 §6 — personal data may be processed only for a lawful purpose with consent; §9 — a minor needs verifiable guardian consent.",
    rationale: "Processing or sharing personal data without consent (guardian consent for a minor) is unlawful.",
    appliesTo: ["pii.process", "pii.share"],
    match: (ctx) => isAction(ctx, "pii.process", "pii.share") && (!bool(ctx, "consent") || (num(ctx, "age") < 18 && !bool(ctx, "guardianConsent"))),
  },
  {
    id: "DPDP-RETENTION",
    act: "DPDP Act 2023",
    clause: "§8(7)",
    title: "Erase personal data past its retention purpose",
    effect: "deny",
    severity: "block",
    citation: "DPDP Act 2023 §8(7) — a data fiduciary must erase personal data once the purpose is served and retention is not required.",
    rationale: "Retaining personal data beyond its lawful retention window is prohibited.",
    appliesTo: ["pii.retain"],
    match: (ctx) => ctx.action === "pii.retain" && bool(ctx, "pastRetention"),
  },
  {
    id: "POCSO-BGV",
    act: "POCSO Act 2012 · Child-safety",
    clause: "Background verification",
    title: "Staff appointment requires completed background verification",
    effect: "deny",
    severity: "block",
    citation: "Child-safety / POCSO due diligence — personnel with access to children must clear background verification before appointment.",
    rationale: "Appointing staff with access to children without background verification is a safeguarding breach.",
    appliesTo: ["staff.appoint"],
    match: (ctx) => ctx.action === "staff.appoint" && !bool(ctx, "backgroundVerified"),
  },
  {
    id: "PFMS-SANCTION-FIRST",
    act: "PFMS / Fund-flow (GFR)",
    clause: "Sanction → release",
    title: "No fund release without a prior sanction",
    effect: "deny",
    severity: "block",
    citation: "General Financial Rules / PFMS — funds may be released only against a valid sanction order.",
    rationale: "Releasing funds without a sanction order is an unauthorised disbursement.",
    appliesTo: ["fund.release"],
    match: (ctx) => ctx.action === "fund.release" && !bool(ctx, "sanctioned"),
  },
  {
    id: "PFMS-WITHIN-ALLOCATION",
    act: "PFMS / Fund-flow (GFR)",
    clause: "Release ≤ allocation",
    title: "A release may not exceed the sanctioned allocation",
    effect: "deny",
    severity: "block",
    citation: "General Financial Rules — expenditure/release must stay within the sanctioned allocation.",
    rationale: "Releasing more than the allocation is an excess, ultra-vires disbursement.",
    appliesTo: ["fund.release"],
    match: (ctx) => ctx.action === "fund.release" && bool(ctx, "exceedsAllocation"),
  },
  {
    id: "FUND-HIGH-VALUE-APPROVAL",
    act: "Financial delegation",
    clause: "Delegated powers",
    title: "High-value fund release needs secretariat approval",
    effect: "require-approval",
    severity: "gate",
    citation: `Delegation of financial powers — a release above ₹${FUND_APPROVAL_THRESHOLD.toLocaleString("en-IN")} requires higher (secretariat) approval.`,
    rationale: "Above the delegated limit, a second authority must approve.",
    appliesTo: ["fund.release"],
    match: (ctx) => ctx.action === "fund.release" && num(ctx, "amount") > FUND_APPROVAL_THRESHOLD,
  },
]

export interface PolicyDecision {
  decision: PolicyEffect
  /** Every rule that fired (for transparency). */
  matched: PolicyRule[]
  /** The rules that drove the decision (the denies, or the approvals). */
  governing: PolicyRule[]
  citations: string[]
  rationale: string
}

/**
 * Evaluate the action+context against the statutory rule set. Deny-wins, then require-approval, then
 * permit. Pure and order-independent. Returns the governing rules + their citations.
 */
export function evaluate(ctx: PolicyContext, rules: PolicyRule[] = POLICY_RULES): PolicyDecision {
  const matched = rules.filter((r) => r.match(ctx))
  const denies = matched.filter((r) => r.effect === "deny")
  const approvals = matched.filter((r) => r.effect === "require-approval")
  let decision: PolicyEffect = "permit"
  let governing: PolicyRule[] = []
  if (denies.length > 0) {
    decision = "deny"
    governing = denies
  } else if (approvals.length > 0) {
    decision = "require-approval"
    governing = approvals
  }
  const rationale =
    decision === "permit"
      ? matched.length === 0
        ? "No statutory rule constrains this action."
        : "All applicable statutory rules are satisfied."
      : governing.map((r) => `${r.title} (${r.act})`).join("; ")
  return { decision, matched, governing, citations: governing.map((r) => r.citation), rationale }
}

// ── catalogue helpers for the register / simulator ─────────────────────────────────────────────────
export const POLICY_ACTIONS: string[] = [...new Set(POLICY_RULES.flatMap((r) => r.appliesTo))].sort()

export function rulesForAct(act: string, rules: PolicyRule[] = POLICY_RULES): PolicyRule[] {
  return rules.filter((r) => r.act === act)
}

export function enforcedActs(rules: PolicyRule[] = POLICY_RULES): string[] {
  return [...new Set(rules.map((r) => r.act))].sort()
}

export interface PolicyEngineSummary {
  rules: number
  acts: number
  blocking: number
  gating: number
}

export function policyEngineSummary(rules: PolicyRule[] = POLICY_RULES): PolicyEngineSummary {
  return {
    rules: rules.length,
    acts: enforcedActs(rules).length,
    blocking: rules.filter((r) => r.effect === "deny").length,
    gating: rules.filter((r) => r.effect === "require-approval").length,
  }
}
