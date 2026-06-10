// VASA-EOS(SE) — shared role-capability register primitives.
//
// Every role-coverage register (Secretary, Minister, and the Directors/DEO/BEO to come) answers the same
// question — "is every general/technical/functional feature of this office built?" — with the same honest
// three-state status and the same anti-overclaim invariant (pending ⇔ no feature; built/partial ⇔ a real
// on-disk feature). This module holds the one definition of that shape, summary and CSV so each role register
// is just its data plus thin wrappers. Pure + client-safe.

import { csvField } from "@/lib/csv"

export type CapabilityStatus = "built" | "partial" | "pending"
export type CapabilityDimension = "general" | "technical" | "functional"

export interface RoleCapability {
  id: string
  dimension: CapabilityDimension
  /** The office responsibility. */
  responsibility: string
  /** In-repo feature delivering it — empty string when pending (honestly nothing yet). */
  featureRef: string
  /** In-app route, when one exists. */
  route: string
  status: CapabilityStatus
}

export interface RoleCapabilitySummary {
  capabilities: number
  built: number
  partial: number
  pending: number
  /** Share of the surface that is built, 0–100. */
  builtPct: number
  general: number
  technical: number
  functional: number
}

export function roleCapabilitySummary(items: RoleCapability[]): RoleCapabilitySummary {
  const built = items.filter((c) => c.status === "built").length
  return {
    capabilities: items.length,
    built,
    partial: items.filter((c) => c.status === "partial").length,
    pending: items.filter((c) => c.status === "pending").length,
    builtPct: items.length === 0 ? 0 : Math.round((built / items.length) * 100),
    general: items.filter((c) => c.dimension === "general").length,
    technical: items.filter((c) => c.dimension === "technical").length,
    functional: items.filter((c) => c.dimension === "functional").length,
  }
}


export function roleCapabilitiesToCSV(items: RoleCapability[]): string {
  const header = ["Dimension", "Responsibility", "Feature", "Route", "Status"]
  const rows = items.map((c) => [c.dimension, c.responsibility, c.featureRef || "—", c.route || "—", c.status].map(csvField).join(","))
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
