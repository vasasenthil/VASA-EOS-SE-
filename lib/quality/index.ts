// VASA-EOS(SE) — Quality Monitoring & Inspection (Sec 46).
// AI-prioritised inspections, a school quality index, and a compliance traffic-light.

export type Compliance = "green" | "amber" | "red"

export interface SchoolQuality {
  udise: string
  name: string
  qualityIndex: number // 0-100
  compliance: Compliance
  inspectionPriority: "low" | "medium" | "high"
  lastInspected: string
}

export const QUALITY: SchoolQuality[] = [
  { udise: "33010100101", name: "GHSS Egmore", qualityIndex: 82, compliance: "green", inspectionPriority: "low", lastInspected: "2026-02-10" },
  { udise: "33020200202", name: "GHS Coimbatore Rural", qualityIndex: 64, compliance: "amber", inspectionPriority: "high", lastInspected: "2025-09-01" },
  { udise: "33030300303", name: "Tribal Welfare School, Nilgiris", qualityIndex: 58, compliance: "amber", inspectionPriority: "high", lastInspected: "2025-08-15" },
  { udise: "33040400404", name: "Govt Matric, Madurai", qualityIndex: 71, compliance: "green", inspectionPriority: "medium", lastInspected: "2026-01-20" },
]

export interface QualitySummary {
  schools: number
  avgIndex: number
  highPriority: number
  red: number
}

export function qualitySummary(q: SchoolQuality[] = QUALITY): QualitySummary {
  return {
    schools: q.length,
    avgIndex: Math.round(q.reduce((s, x) => s + x.qualityIndex, 0) / Math.max(q.length, 1)),
    highPriority: q.filter((x) => x.inspectionPriority === "high").length,
    red: q.filter((x) => x.compliance === "red").length,
  }
}

export const COMPLIANCE_AREAS = ["RTE", "RPwD", "DPDP", "POCSO", "POSH", "FSSAI"]
