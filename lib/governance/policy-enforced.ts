// VASA-EOS(SE) — self-verifying register of Policy-as-Code enforced server actions.
//
// The Policy-as-Code engine (lib/policy-engine) encodes the statutory rule set (RTE / RPwD / DPDP / POCSO / GFR-
// PFMS) as cited, tested rules. This register names the LIVE server-action flows that actually call policyGate()
// at runtime — turning the engine from a simulator into an enforced, audited gate (deny-wins, every decision
// anchored to the integrity ledger with the governing rule ids). tests/policy-enforced.test.ts asserts each
// listed file genuinely imports the gate, so this list can never drift from reality.
//
// This is the honest measure of the "Policy-as-Code automates compliance in real time" claim: N flows enforced
// today, with the remainder of the catalogue's mutating flows still to be wired (tracked openly here).

export interface PolicyEnforcedAction {
  /** The durable module route whose action is gated. */
  route: string
  /** The server-action file that calls policyGate(). */
  file: string
  /** The policy-engine action key evaluated. */
  policyAction: string
  /** The statute(s) this enforcement primarily serves. */
  statute: string
  /** What the gate does in this flow. */
  effect: string
}

export const POLICY_ENFORCED_ACTIONS: PolicyEnforcedAction[] = [
  {
    route: "gem-procurement",
    file: "app/gem-procurement/actions.ts",
    policyAction: "fund.release",
    statute: "GFR / PFMS fund-flow + financial delegation",
    effect: "vendor payment is denied if unsanctioned and routed to secretariat approval above the delegated threshold",
  },
  {
    route: "dbt-scholarship",
    file: "app/dbt-scholarship/actions.ts",
    policyAction: "fund.release",
    statute: "PFMS sanction-first + financial delegation",
    effect: "scholarship disbursement is denied if unsanctioned and gated above the delegated threshold",
  },
  {
    route: "rte-admissions",
    file: "app/rte-admissions/actions.ts",
    policyAction: "admission.process",
    statute: "RPwD Act 2016 §16/§31 — inclusive education",
    effect: "a CWSN applicant cannot be processed without reasonable accommodation",
  },
  {
    route: "establishment",
    file: "app/establishment/actions.ts",
    policyAction: "staff.appoint",
    statute: "Child-safety / POCSO due diligence",
    effect: "staff with access to children cannot be appointed without clearing background verification",
  },
  {
    route: "transfer-certificate",
    file: "app/transfer-certificate/actions.ts",
    policyAction: "pii.share",
    statute: "DPDP Act 2023 §6/§9 — consent (minor: guardian consent)",
    effect: "issuing a TC (sharing a minor's record) is denied without lawful consent",
  },
  {
    route: "fee-ledger",
    file: "app/fee-ledger/actions.ts",
    policyAction: "fee.capitation",
    statute: "RTE Act 2009 §13(1) — no screening / no capitation fee",
    effect: "raising a capitation/screening/donation fee demand is denied outright",
  },
  {
    route: "exams",
    file: "app/exams/actions.ts",
    policyAction: "assessment.conduct",
    statute: "RPwD Act 2016 §16/§31 — inclusive assessment",
    effect: "a CWSN candidate's result cannot be processed without reasonable accommodation",
  },
]

/** Count of mutating server-action flows wired to the runtime policy gate. */
export const POLICY_ENFORCED_COUNT = POLICY_ENFORCED_ACTIONS.length

/** Distinct policy-engine action keys enforced live. */
export function policyEnforcedActionKeys(): string[] {
  return Array.from(new Set(POLICY_ENFORCED_ACTIONS.map((a) => a.policyAction))).sort()
}
