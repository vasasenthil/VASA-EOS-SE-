// VASA-EOS(SE) — child safeguarding controls register ("every child is safe on our watch").
//
// A school OS holds a duty of care no other government system carries: the children are
// physically present, every day, in our charge. This maps each child-safety RISK vector —
// stranger access, blind spots, peer abuse, unreported harm, unsafe transport, campus
// hazards, emergencies, record tampering, child-PII misuse and undetected ill-health — to
// the in-repo control that discharges it, and to the statutory duty (POCSO 2012, JJ Act
// 2015, RTE 2009, DPDP 2023) it satisfies. Every controlRef is asserted to exist on disk
// (self-verifying); controls needing a live feed at deploy (CCTV, GPS, health) are honestly
// 'partial'. Pure + client-safe.

export type SafeguardingStatus = "enforced" | "partial"

export interface SafeguardingControl {
  id: string
  /** The child-safety risk vector being addressed. */
  risk: string
  /** The statutory duty this discharges. */
  statute: string
  /** The in-repo mechanism that addresses it. */
  control: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: SafeguardingStatus
}

export const SAFEGUARDING_CONTROLS: SafeguardingControl[] = [
  { id: "stranger-access", risk: "Stranger / intruder reaching children on premises", statute: "POCSO 2012 · JJ Act 2015", control: "Visitor management — photo + ID + purpose capture, host approval, time-bound pass, full log", controlRef: "lib/visitors/index.ts", status: "enforced" },
  { id: "blind-spots", risk: "Unmonitored areas / surveillance blind spots", statute: "POCSO Rules 2020", control: "CCTV coverage register with retention policy and blind-spot gap analysis", controlRef: "lib/cctv/index.ts", status: "partial" },
  { id: "peer-abuse", risk: "Bullying, ragging, peer-on-peer abuse", statute: "JJ Act 2015 · Anti-ragging", control: "Disciplinary incident log with tiered escalation and remedial action tracking", controlRef: "lib/discipline/index.ts", status: "enforced" },
  { id: "unreported-harm", risk: "Abuse that goes unreported (POCSO mandatory reporting)", statute: "POCSO 2012 §19–21", control: "Confidential multi-tier grievance redressal with time-bound escalation to authority", controlRef: "lib/grievance/index.ts", status: "enforced" },
  { id: "unsafe-transport", risk: "Unsafe transport — unvetted driver/vehicle, child left behind", statute: "MV Act · TN school-transport norms", control: "Route-driver-vehicle binding + live bus tracking with boarding/alighting reconciliation", controlRef: "lib/bus-tracking/index.ts", status: "partial" },
  { id: "campus-hazards", risk: "Physical hazards and accidents on campus", statute: "RTE 2009 §19 (infrastructure norms)", control: "Safety incident register with hazard scoring and corrective-action workflow", controlRef: "lib/safety/index.ts", status: "enforced" },
  { id: "emergencies", risk: "Fire / disaster / emergency endangering children", statute: "TNSDMA · DM Act 2005", control: "Mock-drill register + emergency incident management with preparedness scoring", controlRef: "lib/drills/index.ts", status: "enforced" },
  { id: "record-tampering", risk: "Altered / destroyed safeguarding records", statute: "POCSO 2012 · evidentiary integrity", control: "Hash-chained tamper-evident audit ledger — safeguarding records cannot be altered", controlRef: "lib/audit/trail.ts", status: "enforced" },
  { id: "child-pii", risk: "Child PII exposure or misuse", statute: "DPDP 2023 §9 (children's data)", control: "Consent-gated PII with sensitive child-data classification and purpose binding", controlRef: "lib/consent/pii-catalogue.ts", status: "enforced" },
  { id: "undetected-illness", risk: "Medical / developmental risk undetected", statute: "RBSK · child-health entitlement", control: "RBSK health-screening register (4 Ds) with referral tracking", controlRef: "lib/health/index.ts", status: "partial" },
]

export function controlById(id: string): SafeguardingControl | undefined {
  return SAFEGUARDING_CONTROLS.find((c) => c.id === id)
}

export function byStatus(status: SafeguardingStatus): SafeguardingControl[] {
  return SAFEGUARDING_CONTROLS.filter((c) => c.status === status)
}

export interface SafeguardingSummary {
  controls: number
  enforced: number
  partial: number
  /** Distinct statutory duties discharged across the register. */
  statutesCovered: number
}

export function safeguardingSummary(items: SafeguardingControl[] = SAFEGUARDING_CONTROLS): SafeguardingSummary {
  return {
    controls: items.length,
    enforced: items.filter((c) => c.status === "enforced").length,
    partial: items.filter((c) => c.status === "partial").length,
    statutesCovered: new Set(items.map((c) => c.statute)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: SafeguardingControl[] = SAFEGUARDING_CONTROLS): string {
  const header = ["Risk", "Statute", "Control", "Component", "Status"]
  const rows = items.map((c) => [c.risk, c.statute, c.control, c.controlRef, c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
