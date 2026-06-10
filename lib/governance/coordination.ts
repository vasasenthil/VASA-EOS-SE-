// VASA-EOS(SE) — inter-departmental & CSR coordination tracker (the Secretary's convergence desk).
//
// No school-education outcome is delivered by one department alone: child health rides on Health &
// Family Welfare, nutrition on Social Welfare, SC/ST scholarships on Adi Dravidar Welfare, money on
// Finance, buildings on Rural Development — and CSR foundations, multilaterals and CSOs fund the edges.
// This tracks each convergence INITIATIVE the Secretary coordinates, naming the partner, the convergence
// purpose, and the in-repo module the initiative actually touches (asserted to exist on disk, so the desk
// can never list a partnership with no platform footprint). Pure + client-safe.

export type PartnerType = "department" | "csr" | "multilateral" | "cso"
export type InitiativeStatus = "active" | "proposed" | "completed"

export interface CoordinationInitiative {
  id: string
  title: string
  /** The coordinating partner. */
  partner: string
  partnerType: PartnerType
  /** What is converged / shared. */
  purpose: string
  /** In-repo module the initiative touches (asserted to exist). */
  linkedModule: string
  status: InitiativeStatus
}

export const COORDINATION_INITIATIVES: CoordinationInitiative[] = [
  { id: "rbsk-health", title: "RBSK school-health screening", partner: "Health & Family Welfare Dept", partnerType: "department", purpose: "Joint 4-D screening, referral and treatment for every child", linkedModule: "lib/health/index.ts", status: "active" },
  { id: "poshan-nutrition", title: "PM POSHAN nutrition convergence", partner: "Social Welfare & Women Empowerment Dept", partnerType: "department", purpose: "Shared menu, supplementary nutrition and anganwadi-to-school continuity", linkedModule: "lib/meals/index.ts", status: "active" },
  { id: "sc-st-scholarships", title: "SC/ST/OBC scholarship disbursement", partner: "Adi Dravidar & Tribal Welfare Dept", partnerType: "department", purpose: "Converged eligibility and DBT scholarship payout", linkedModule: "lib/scholarship/index.ts", status: "active" },
  { id: "finance-pfms", title: "Budget & PFMS reconciliation", partner: "Finance Dept", partnerType: "department", purpose: "Grant release, utilisation certificates and audit alignment", linkedModule: "lib/finance/index.ts", status: "active" },
  { id: "rural-infra", title: "School infrastructure & sanitation works", partner: "Rural Development & Panchayat Raj Dept", partnerType: "department", purpose: "Convergent civil works against RTE §19 gaps", linkedModule: "lib/infrastructure/index.ts", status: "proposed" },
  { id: "it-connectivity", title: "School connectivity & digital backbone", partner: "Information Technology Dept", partnerType: "department", purpose: "Broadband, BharatNet and device provisioning to schools", linkedModule: "lib/integrations/index.ts", status: "proposed" },
  { id: "csr-smartclass", title: "Smart-classroom & ICT-lab sponsorship", partner: "Corporate CSR Foundation", partnerType: "csr", purpose: "Funded smart classrooms and computer labs in aspirational blocks", linkedModule: "lib/ictlab/index.ts", status: "active" },
  { id: "multilateral-fln", title: "Foundational literacy & numeracy programme", partner: "UNICEF / World Bank (multilateral)", partnerType: "multilateral", purpose: "Technical support and assessment for NIPUN FLN goals", linkedModule: "lib/diagnostic/index.ts", status: "active" },
  { id: "cso-remedial", title: "Volunteer-led remedial & reading camps", partner: "Education CSO / NGO network", partnerType: "cso", purpose: "After-school remediation and reading-fluency camps", linkedModule: "lib/remedial/index.ts", status: "active" },
  { id: "csr-econtent", title: "Open e-content & teacher-resource grant", partner: "Technology CSR Partner", partnerType: "csr", purpose: "Sponsored Tamil-first digital content and teacher resources", linkedModule: "lib/econtent/index.ts", status: "completed" },
]

export function initiativeById(id: string): CoordinationInitiative | undefined {
  return COORDINATION_INITIATIVES.find((i) => i.id === id)
}

export function byStatus(status: InitiativeStatus): CoordinationInitiative[] {
  return COORDINATION_INITIATIVES.filter((i) => i.status === status)
}

export function byPartnerType(type: PartnerType): CoordinationInitiative[] {
  return COORDINATION_INITIATIVES.filter((i) => i.partnerType === type)
}

export interface CoordinationSummary {
  initiatives: number
  active: number
  proposed: number
  completed: number
  /** Distinct partner departments engaged. */
  departments: number
  /** Non-government partners (CSR + multilateral + CSO). */
  externalPartners: number
  /** Distinct in-repo modules touched. */
  modulesLinked: number
}

export function coordinationSummary(items: CoordinationInitiative[] = COORDINATION_INITIATIVES): CoordinationSummary {
  return {
    initiatives: items.length,
    active: items.filter((i) => i.status === "active").length,
    proposed: items.filter((i) => i.status === "proposed").length,
    completed: items.filter((i) => i.status === "completed").length,
    departments: new Set(items.filter((i) => i.partnerType === "department").map((i) => i.partner)).size,
    externalPartners: items.filter((i) => i.partnerType !== "department").length,
    modulesLinked: new Set(items.map((i) => i.linkedModule)).size,
  }
}

function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(items: CoordinationInitiative[] = COORDINATION_INITIATIVES): string {
  const header = ["Initiative", "Partner", "Type", "Purpose", "Module", "Status"]
  const rows = items.map((i) => [i.title, i.partner, i.partnerType, i.purpose, i.linkedModule, i.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
