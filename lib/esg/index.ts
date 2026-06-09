// VASA-EOS(SE) — Green School & ESG (Sec 49 / Part XIX).
// Environmental, Social and Governance metrics for school operations + ESG reporting.

export interface EsgMetric {
  label: string
  value: string
  trend?: "up" | "down" | "flat"
}

export const ENVIRONMENTAL: EsgMetric[] = [
  { label: "Rooftop solar adoption", value: "42% of schools", trend: "up" },
  { label: "Rainwater harvesting", value: "68% of schools", trend: "up" },
  { label: "Waste segregation", value: "Active", trend: "flat" },
  { label: "Trees planted (YTD)", value: "12,400", trend: "up" },
  { label: "Carbon footprint", value: "↓ 9% YoY", trend: "down" },
]

export const SOCIAL: EsgMetric[] = [
  { label: "Gender parity index (9-12)", value: "1.04" },
  { label: "CWSN inclusion (21 RPwD)", value: "Tracked" },
  { label: "Mother-tongue instruction", value: "Tamil-first" },
  { label: "POCSO / POSH compliance", value: "Active" },
]

export const GOVERNANCE: EsgMetric[] = [
  { label: "Audit-ready operations", value: "CAG-ready" },
  { label: "RTI auto-disclosure", value: "Enabled" },
  { label: "Blockchain-anchored decisions", value: "Enabled" },
  { label: "Grievance redressal SLA", value: "<7 days target" },
]

export const ESG_FRAMEWORKS = ["GRI Standards", "TCFD", "SASB", "UN SDG 4"]
