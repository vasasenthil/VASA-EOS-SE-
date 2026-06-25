// VASA-EOS(SE) — social justice as architecture: the 12 equity dimensions.
//
// The platform's moral core: equity operationalised, not aspirational. Each of the twelve
// dimensions Tamil Nadu has a constitutional obligation to protect is mapped to the
// constitutional Articles it answers to and the in-repo component that evidences it. Status
// is honest: 'implemented' where the mechanism is in code, 'partial' where a dedicated
// module (e.g. a transgender self-identification portal, full Madarasa modernisation) is
// still to be built. Every controlRef is asserted to exist on disk (self-verifying). Pure
// + client-safe.

import { csvField } from "@/lib/csv"

export type EquityStatus = "implemented" | "partial"

export interface EquityDimension {
  id: string
  name: string
  /** Who / what it protects. */
  protects: string
  /** Constitutional Articles it operationalises. */
  articles: string[]
  /** In-repo component evidencing it (asserted to exist on disk). */
  controlRef: string
  status: EquityStatus
}

export const EQUITY_DIMENSIONS: EquityDimension[] = [
  { id: "caste", name: "Caste Equity", protects: "SC (15%) / ST (1%) reservation, Adi Dravidar sub-categorisation, 69% TN framework", articles: ["15", "16", "46"], controlRef: "lib/sis", status: "implemented" },
  { id: "community", name: "Community Equity", protects: "BC, MBC and Minority Welfare entitlements", articles: ["15", "46"], controlRef: "lib/scholarship", status: "implemented" },
  { id: "gender", name: "Gender Equity", protects: "Pudhumai Penn, female-teacher tracking, gender-disaggregated analytics", articles: ["15", "39"], controlRef: "lib/integrations/live/dbt.ts", status: "implemented" },
  { id: "disability", name: "Disability Equity", protects: "All 21 RPwD categories with accessibility", articles: ["41", "46"], controlRef: "lib/accessibility/rpwd.ts", status: "implemented" },
  { id: "transgender", name: "Transgender Inclusion", protects: "Self-identification with dignity (NALSA judgment)", articles: ["14", "15", "21"], controlRef: "lib/sis", status: "partial" },
  { id: "tribal", name: "Tribal Equity", protects: "Toda/Kota/Irula/Kurumba, PESA, mother-tongue materials", articles: ["46", "350A"], controlRef: "lib/i18n/languages.ts", status: "implemented" },
  { id: "geographic", name: "Geographic Equity", protects: "Offline-first / 2G / solar reach for rural, hill & coastal areas", articles: ["14"], controlRef: "lib/accessibility/delivery.ts", status: "partial" },
  { id: "economic", name: "Economic Equity", protects: "RTE 25% EWS quota + welfare entitlement tracking", articles: ["21A", "46"], controlRef: "lib/rte", status: "implemented" },
  { id: "linguistic", name: "Linguistic Equity", protects: "Tamil-first, 22 languages, 150+ dialects", articles: ["29", "350A"], controlRef: "lib/i18n/languages.ts", status: "implemented" },
  { id: "religious", name: "Religious Equity", protects: "Madarasa modernisation, minority scholarship tracking", articles: ["28", "30"], controlRef: "lib/scholarship", status: "partial" },
  { id: "age", name: "Age Equity", protects: "Over-age & bridge programmes, out-of-school children", articles: ["21A"], controlRef: "lib/oosc", status: "implemented" },
  { id: "migrant", name: "Migrant & Refugee Equity", protects: "Sri Lankan Tamil refugees, inter-state portability via APAAR", articles: ["21", "21A"], controlRef: "lib/sis", status: "partial" },
]

export function dimensionById(id: string): EquityDimension | undefined {
  return EQUITY_DIMENSIONS.find((d) => d.id === id)
}

export function byStatus(status: EquityStatus): EquityDimension[] {
  return EQUITY_DIMENSIONS.filter((d) => d.status === status)
}

/** All distinct constitutional Articles operationalised across the dimensions. */
export function articlesOperationalised(): string[] {
  return [...new Set(EQUITY_DIMENSIONS.flatMap((d) => d.articles))].sort((a, b) => parseInt(a) - parseInt(b))
}

export interface EquitySummary {
  dimensions: number
  implemented: number
  partial: number
  articles: number
}

export function equitySummary(items: EquityDimension[] = EQUITY_DIMENSIONS): EquitySummary {
  return {
    dimensions: items.length,
    implemented: items.filter((d) => d.status === "implemented").length,
    partial: items.filter((d) => d.status === "partial").length,
    articles: articlesOperationalised().length,
  }
}


export function toCSV(items: EquityDimension[] = EQUITY_DIMENSIONS): string {
  const header = ["Dimension", "Protects", "Articles", "Component", "Status"]
  const rows = items.map((d) =>
    [d.name, d.protects, d.articles.map((a) => `Art ${a}`).join("; "), d.controlRef, d.status].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
