// VASA-EOS(SE) — free-scheme distribution tracking (Sec 43 / welfare).
// Track free textbooks/uniforms/cycles/laptops from entitled → issued → acknowledged.

import { SIS_ROSTER } from "@/lib/sis"

export type DistStatus = "entitled" | "issued" | "acknowledged"

export const DIST_FLOW: DistStatus[] = ["entitled", "issued", "acknowledged"]

export const DIST_ITEMS = ["Textbooks", "Notebooks", "Uniform", "Bicycle (Cl.11)", "Laptop (Cl.12)", "Shoes & socks"]

export function nextDistStatus(s: DistStatus): DistStatus {
  const i = DIST_FLOW.indexOf(s)
  return i < 0 || i >= DIST_FLOW.length - 1 ? "acknowledged" : DIST_FLOW[i + 1]
}

export interface DistRecord {
  id: string
  student: string
  item: string
  status: DistStatus
}

export const SAMPLE_DISTRIBUTION: DistRecord[] = SIS_ROSTER.map((s, i) => ({
  id: `d-${i}`,
  student: s.name,
  item: DIST_ITEMS[i % DIST_ITEMS.length],
  status: DIST_FLOW[i % DIST_FLOW.length],
}))

export interface DistSummary {
  total: number
  entitled: number
  issued: number
  acknowledged: number
  coveragePct: number // (issued + acknowledged) / total
}

export function distributionSummary(records: DistRecord[]): DistSummary {
  const issued = records.filter((r) => r.status === "issued").length
  const acknowledged = records.filter((r) => r.status === "acknowledged").length
  return {
    total: records.length,
    entitled: records.filter((r) => r.status === "entitled").length,
    issued,
    acknowledged,
    coveragePct: records.length === 0 ? 0 : Math.round(((issued + acknowledged) / records.length) * 100),
  }
}
