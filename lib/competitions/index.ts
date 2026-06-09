// VASA-EOS(SE) — olympiad & competition results register (co-scholastic achievement).
// Record competition entries by level and medal won. Pure logic.

export const COMP_LEVELS = ["School", "Cluster", "Block", "District", "State", "National"]

export type Medal = "Gold" | "Silver" | "Bronze" | "Participation"

export const MEDALS: Medal[] = ["Gold", "Silver", "Bronze", "Participation"]

export interface CompEntry {
  id: string
  student: string
  event: string
  level: string
  medal: Medal
  /** Tenant node this entry belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface CompSummary {
  entries: number
  medals: number
  gold: number
  participation: number
}

export function isPodium(medal: Medal): boolean {
  return medal === "Gold" || medal === "Silver" || medal === "Bronze"
}

export function compSummary(entries: CompEntry[]): CompSummary {
  return {
    entries: entries.length,
    medals: entries.filter((e) => isPodium(e.medal)).length,
    gold: entries.filter((e) => e.medal === "Gold").length,
    participation: entries.filter((e) => e.medal === "Participation").length,
  }
}
