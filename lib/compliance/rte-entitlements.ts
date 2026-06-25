// VASA-EOS(SE) — RTE Act entitlements register ("education is a fundamental right, not a favour").
//
// The Right of Children to Free and Compulsory Education Act, 2009 turns Article 21A into
// enforceable entitlements: free & compulsory schooling 6–14, a 25% EWS/DG quota, no
// screening or capitation, no detention or expulsion, infrastructure norms, qualified
// teachers, a parent-majority SMC, neighbourhood access and a transfer certificate that
// cannot be withheld. This maps each statutory ENTITLEMENT (with its RTE section) to the
// in-repo mechanism that enforces it. Every controlRef is asserted to exist on disk
// (self-verifying); entitlements needing real rosters/census at deploy are honestly
// 'partial'. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type RteEntitlementStatus = "enforced" | "partial"

export interface RteEntitlement {
  id: string
  /** The statutory entitlement guaranteed to the child. */
  entitlement: string
  /** The RTE Act 2009 section/schedule that grants it. */
  section: string
  /** The in-repo mechanism that enforces it. */
  mechanism: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: RteEntitlementStatus
}

export const RTE_ENTITLEMENTS: RteEntitlement[] = [
  { id: "free-compulsory", entitlement: "Free & compulsory education for every child aged 6–14", section: "RTE §3", mechanism: "No-fee admission + enrolment lifecycle — no child turned away", controlRef: "lib/admissions/index.ts", status: "enforced" },
  { id: "ews-quota", entitlement: "25% reservation for EWS / disadvantaged in unaided schools", section: "RTE §12(1)(c)", mechanism: "EWS/DG quota tracker (applied→verified→allotted→admitted) + reimbursement", controlRef: "lib/rte/index.ts", status: "enforced" },
  { id: "no-screening", entitlement: "No screening procedure and no capitation fee at admission", section: "RTE §13", mechanism: "Fee register gates capitation; admission carries no screening fields", controlRef: "lib/fees/index.ts", status: "enforced" },
  { id: "no-detention", entitlement: "No detention to Class 8; continuous comprehensive evaluation", section: "RTE §16 (CCE)", mechanism: "Holistic progress card (scholastic + co-scholastic) drives promotion", controlRef: "lib/hpc/index.ts", status: "enforced" },
  { id: "no-expulsion", entitlement: "No corporal punishment and no expulsion of any child", section: "RTE §16–17", mechanism: "Disciplinary log bars corporal punishment/expulsion; remedial-only escalation", controlRef: "lib/discipline/index.ts", status: "enforced" },
  { id: "infrastructure-norms", entitlement: "School meets §19 infrastructure & RPwD-access norms (Schedule)", section: "RTE §19 + Schedule", mechanism: "Infrastructure register with RTE/RPwD gap analysis and traffic-light", controlRef: "lib/infrastructure/index.ts", status: "enforced" },
  { id: "ptr-qualified-teachers", entitlement: "Prescribed pupil-teacher ratio with qualified teachers", section: "RTE §23–25 + Schedule", mechanism: "Postings/deployment + vacancy tracking against sanctioned strength", controlRef: "lib/postings/index.ts", status: "partial" },
  { id: "smc-parents", entitlement: "School Management Committee — 75% parents, 50% women", section: "RTE §21", mechanism: "SMC quorum-voting register binding parent-majority composition", controlRef: "lib/smc/index.ts", status: "enforced" },
  { id: "neighbourhood-access", entitlement: "Neighbourhood access; out-of-school children mainstreamed (age-appropriate)", section: "RTE §4 + §6", mechanism: "Out-of-school children register with age-appropriate admission tracking", controlRef: "lib/oosc/index.ts", status: "partial" },
  { id: "tc-on-demand", entitlement: "Transfer certificate cannot be withheld; no denial for lack of TC", section: "RTE §5", mechanism: "Transfer-certificate issuance register — TC issued on demand, denial logged", controlRef: "lib/tc/index.ts", status: "enforced" },
  { id: "tamper-evident", entitlement: "Entitlement records are auditable and non-repudiable", section: "RTE §9 (local-authority duty)", mechanism: "Hash-chained tamper-evident audit ledger over entitlement events", controlRef: "lib/audit/trail.ts", status: "enforced" },
]

export function entitlementById(id: string): RteEntitlement | undefined {
  return RTE_ENTITLEMENTS.find((e) => e.id === id)
}

export function byStatus(status: RteEntitlementStatus): RteEntitlement[] {
  return RTE_ENTITLEMENTS.filter((e) => e.status === status)
}

export interface RteEntitlementSummary {
  entitlements: number
  enforced: number
  partial: number
  /** Distinct RTE sections/schedules enforced across the register. */
  sectionsCovered: number
}

export function rteEntitlementSummary(items: RteEntitlement[] = RTE_ENTITLEMENTS): RteEntitlementSummary {
  return {
    entitlements: items.length,
    enforced: items.filter((e) => e.status === "enforced").length,
    partial: items.filter((e) => e.status === "partial").length,
    sectionsCovered: new Set(items.map((e) => e.section)).size,
  }
}


export function toCSV(items: RteEntitlement[] = RTE_ENTITLEMENTS): string {
  const header = ["Entitlement", "Section", "Mechanism", "Component", "Status"]
  const rows = items.map((e) => [e.entitlement, e.section, e.mechanism, e.controlRef, e.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
