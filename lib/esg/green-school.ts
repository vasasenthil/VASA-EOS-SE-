// VASA-EOS(SE) — green-school sustainability commitments register ("the school that teaches the planet").
//
// NEP 2020 §4.7 and the PM SHRI green-school vision make every campus a site of environmental
// stewardship; SDG 4.7 makes climate literacy a learning outcome. This maps each sustainability
// COMMITMENT — clean energy, water stewardship, sanitation, waste circularity, green cover,
// nutrition gardens, environmental literacy, a healthy campus and climate accountability — to the
// in-repo mechanism that operationalises it and the Sustainable Development Goal it advances.
// Every controlRef is asserted to exist on disk (self-verifying); commitments needing live sensor
// feeds at deploy (solar metering, water-quality telemetry) are honestly 'partial'. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type GreenStatus = "enforced" | "partial"

export interface GreenCommitment {
  id: string
  /** The sustainability commitment the campus makes. */
  commitment: string
  /** The Sustainable Development Goal it advances. */
  sdg: string
  /** The in-repo mechanism that operationalises it. */
  mechanism: string
  /** In-repo evidence path (asserted to exist on disk). */
  controlRef: string
  status: GreenStatus
}

export const GREEN_COMMITMENTS: GreenCommitment[] = [
  { id: "clean-energy", commitment: "Rooftop solar and clean-energy adoption on campus", sdg: "SDG 7 — Affordable & Clean Energy", mechanism: "ESG environmental metrics register tracking solar adoption and footprint", controlRef: "lib/esg/index.ts", status: "partial" },
  { id: "water-stewardship", commitment: "Rainwater harvesting and water conservation", sdg: "SDG 6 — Clean Water & Sanitation", mechanism: "Water-quality monitoring register with potability tracking", controlRef: "lib/water/index.ts", status: "partial" },
  { id: "sanitation-wash", commitment: "Safe sanitation, hygiene and functional toilets", sdg: "SDG 6 — Clean Water & Sanitation", mechanism: "WASH audit register with facility-norm scoring and corrective action", controlRef: "lib/wash/index.ts", status: "enforced" },
  { id: "eco-stewardship", commitment: "Waste segregation, plastic-free campus and tree plantation", sdg: "SDG 12/15 — Responsible Consumption & Life on Land", mechanism: "Eco-club activity log — drives, saplings planted and survival tracking", controlRef: "lib/eco/index.ts", status: "enforced" },
  { id: "green-infrastructure", commitment: "Green, climate-resilient school buildings (PM SHRI)", sdg: "SDG 9 — Resilient Infrastructure", mechanism: "Infrastructure register with norm gap analysis and traffic-light", controlRef: "lib/infrastructure/index.ts", status: "enforced" },
  { id: "nutrition-garden", commitment: "School kitchen / herbal nutrition gardens", sdg: "SDG 2 — Zero Hunger", mechanism: "PM POSHAN meals register linking garden produce to nutrition", controlRef: "lib/meals/index.ts", status: "partial" },
  { id: "environmental-literacy", commitment: "Environmental literacy through eco-club & co-curricular", sdg: "SDG 4.7 — Education for Sustainable Development", mechanism: "Co-curricular register capturing eco activities as learning outcomes", controlRef: "lib/cocurricular/index.ts", status: "enforced" },
  { id: "healthy-campus", commitment: "A healthy, pollution-aware campus environment", sdg: "SDG 3 — Good Health & Well-being", mechanism: "Health-screening register surfacing environmental health risks", controlRef: "lib/health/index.ts", status: "partial" },
  { id: "climate-accountability", commitment: "Transparent, auditable sustainability reporting", sdg: "SDG 13 — Climate Action", mechanism: "Hash-chained tamper-evident ledger over sustainability/ESG events", controlRef: "lib/audit/trail.ts", status: "enforced" },
]

export function commitmentById(id: string): GreenCommitment | undefined {
  return GREEN_COMMITMENTS.find((c) => c.id === id)
}

export function byStatus(status: GreenStatus): GreenCommitment[] {
  return GREEN_COMMITMENTS.filter((c) => c.status === status)
}

export interface GreenSummary {
  commitments: number
  enforced: number
  partial: number
  /** Distinct Sustainable Development Goals advanced across the register. */
  sdgsCovered: number
}

export function greenSummary(items: GreenCommitment[] = GREEN_COMMITMENTS): GreenSummary {
  return {
    commitments: items.length,
    enforced: items.filter((c) => c.status === "enforced").length,
    partial: items.filter((c) => c.status === "partial").length,
    sdgsCovered: new Set(items.map((c) => c.sdg)).size,
  }
}


export function toCSV(items: GreenCommitment[] = GREEN_COMMITMENTS): string {
  const header = ["Commitment", "SDG", "Mechanism", "Component", "Status"]
  const rows = items.map((c) => [c.commitment, c.sdg, c.mechanism, c.controlRef, c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
