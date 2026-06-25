// VASA-EOS(SE) — welfare-scheme design & launch tool (the Minister's flagship-launch desk).
//
// A new scheme — Pudhumai Penn, a breakfast scheme, a learning-kit grant — is the executive's signature act,
// but a scheme launched without eligibility, funding, a delivery rail or a grievance channel becomes the next
// leakage scandal. This models scheme launch as a gated workflow: each scheme is designed against a fixed set of
// readiness GATES (objective, eligibility, funding, delivery, beneficiary identification, grievance channel,
// monitoring), its funding head is cross-checked against the real budget, and validateLaunch() refuses to call a
// scheme launch-ready until every mandatory gate is met — so a half-designed scheme is caught, not announced.
// Pure + client-safe.

import { csvField } from "@/lib/csv"

import { BUDGET } from "@/lib/finance"

export type SchemeStatus = "design" | "approved" | "launched"
export type DeliveryMode = "DBT" | "in-kind" | "service"

export interface LaunchGate {
  key: string
  label: string
  mandatory: boolean
}

export const LAUNCH_GATES: LaunchGate[] = [
  { key: "objective", label: "Objective & target outcome defined", mandatory: true },
  { key: "eligibility", label: "Eligibility criteria specified", mandatory: true },
  { key: "funding", label: "Funding head identified & sanctioned", mandatory: true },
  { key: "delivery", label: "Delivery mechanism (DBT / in-kind / service) wired", mandatory: true },
  { key: "beneficiary-id", label: "Beneficiary identification (APAAR / Aadhaar) ready", mandatory: true },
  { key: "grievance", label: "Grievance / redressal channel in place", mandatory: true },
  { key: "monitoring", label: "Monitoring & evaluation plan", mandatory: false },
]

export interface SchemeMilestone {
  label: string
  targetDate: string
}

export interface SchemeLaunch {
  id: string
  name: string
  objective: string
  deliveryMode: DeliveryMode
  /** Budget head funding the scheme (cross-checked against the real budget). */
  fundingHead: string
  targetBeneficiaries: number
  eligibility: string[]
  /** Gates the scheme has cleared (subset of LAUNCH_GATES keys). */
  gatesMet: string[]
  milestones: SchemeMilestone[]
  status: SchemeStatus
}

export const SCHEME_LAUNCHES: SchemeLaunch[] = [
  {
    id: "SCH-PP2", name: "Pudhumai Penn 2.0", objective: "₹1,000/month to girls in Classes 6–12 in government schools to raise transition to higher education.",
    deliveryMode: "DBT", fundingHead: "Samagra Shiksha (composite grant)", targetBeneficiaries: 320000,
    eligibility: ["Girl student", "Classes 6–12", "Government school enrolment"],
    gatesMet: ["objective", "eligibility", "funding", "delivery", "beneficiary-id", "grievance", "monitoring"],
    milestones: [{ label: "District rollout", targetDate: "2026-07-15" }, { label: "First DBT cycle", targetDate: "2026-08-01" }],
    status: "launched",
  },
  {
    id: "SCH-FLK", name: "Foundational Learning Kits", objective: "Free FLN kits (slates, readers, manipulatives) to every Class 1–3 child to support Ennum Ezhuthum.",
    deliveryMode: "in-kind", fundingHead: "Library & TLM", targetBeneficiaries: 540000,
    eligibility: ["Classes 1–3", "Government & aided schools"],
    gatesMet: ["objective", "eligibility", "funding", "delivery", "beneficiary-id", "grievance"],
    milestones: [{ label: "Procurement", targetDate: "2026-07-30" }, { label: "School distribution", targetDate: "2026-09-01" }],
    status: "approved",
  },
  {
    id: "SCH-DTA", name: "Digital Tutor Access", objective: "After-hours AI tutor access for secondary learners in aspirational blocks.",
    deliveryMode: "service", fundingHead: "Infrastructure & maintenance", targetBeneficiaries: 80000,
    eligibility: ["Classes 9–12", "Aspirational blocks"],
    gatesMet: ["objective", "eligibility"],
    milestones: [{ label: "Pilot in 3 districts", targetDate: "2026-10-01" }],
    status: "design",
  },
]

/** Does the scheme's funding head map to a real budget head? */
export function fundingResolved(scheme: SchemeLaunch): boolean {
  return BUDGET.some((b) => b.head === scheme.fundingHead)
}

export interface LaunchValidation {
  ok: boolean
  unmet: string[]
}

export function validateLaunch(scheme: SchemeLaunch): LaunchValidation {
  const mandatory = LAUNCH_GATES.filter((g) => g.mandatory)
  const unmet = mandatory
    .filter((g) => !scheme.gatesMet.includes(g.key) || (g.key === "funding" && !fundingResolved(scheme)))
    .map((g) => g.key)
  return { ok: unmet.length === 0, unmet }
}

/** Share of mandatory gates met, 0–100. */
export function readinessPct(scheme: SchemeLaunch): number {
  const mandatory = LAUNCH_GATES.filter((g) => g.mandatory)
  const met = mandatory.filter((g) => scheme.gatesMet.includes(g.key)).length
  return Math.round((met / mandatory.length) * 100)
}

export function schemeById(id: string): SchemeLaunch | undefined {
  return SCHEME_LAUNCHES.find((s) => s.id === id)
}

export function byStatus(status: SchemeStatus): SchemeLaunch[] {
  return SCHEME_LAUNCHES.filter((s) => s.status === status)
}

export interface SchemeLaunchSummary {
  schemes: number
  design: number
  approved: number
  launched: number
  /** Schemes that pass every mandatory launch gate. */
  launchReady: number
  totalTargetBeneficiaries: number
  mandatoryGates: number
}

export function schemeLaunchSummary(items: SchemeLaunch[] = SCHEME_LAUNCHES): SchemeLaunchSummary {
  return {
    schemes: items.length,
    design: items.filter((s) => s.status === "design").length,
    approved: items.filter((s) => s.status === "approved").length,
    launched: items.filter((s) => s.status === "launched").length,
    launchReady: items.filter((s) => validateLaunch(s).ok).length,
    totalTargetBeneficiaries: items.reduce((n, s) => n + s.targetBeneficiaries, 0),
    mandatoryGates: LAUNCH_GATES.filter((g) => g.mandatory).length,
  }
}


export function toCSV(items: SchemeLaunch[] = SCHEME_LAUNCHES): string {
  const header = ["ID", "Name", "Delivery", "Funding head", "Target beneficiaries", "Readiness %", "Launch-ready", "Status"]
  const rows = items.map((s) => {
    const v = validateLaunch(s)
    return [s.id, s.name, s.deliveryMode, s.fundingHead, String(s.targetBeneficiaries), String(readinessPct(s)), v.ok ? "yes" : "no", s.status].map(csvField).join(",")
  })
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
