// VASA-EOS(SE) — out-of-school children (OoSC) mainstreaming & bridge course (NEP/Samagra Shiksha).
// Identify never-enrolled / dropout children and track to mainstreamed. Pure logic.

export type OoscStatus = "identified" | "enrolled" | "bridging" | "mainstreamed"

export const OOSC_FLOW: OoscStatus[] = ["identified", "enrolled", "bridging", "mainstreamed"]

export function nextOoscStatus(s: OoscStatus): OoscStatus {
  const i = OOSC_FLOW.indexOf(s)
  return i < 0 || i >= OOSC_FLOW.length - 1 ? "mainstreamed" : OOSC_FLOW[i + 1]
}

export const OOSC_REASONS = [
  "Migration",
  "Never enrolled",
  "Dropout — economic",
  "Dropout — distance",
  "Dropout — illness",
  "Child labour",
]

export interface OoscChild {
  id: string
  name: string
  age: number
  reason: string
  status: OoscStatus
  targetClass: string
  /** Tenant node this child is tracked under — drives per-role data scoping. */
  tenantId: string
}

export interface OoscSummary {
  total: number
  identified: number
  bridging: number
  mainstreamed: number
  mainstreamPct: number
}

export function ooscSummary(children: OoscChild[]): OoscSummary {
  const total = children.length
  const mainstreamed = children.filter((c) => c.status === "mainstreamed").length
  return {
    total,
    identified: children.filter((c) => c.status === "identified").length,
    bridging: children.filter((c) => c.status === "bridging").length,
    mainstreamed,
    mainstreamPct: total === 0 ? 0 : Math.round((mainstreamed / total) * 100),
  }
}
