// VASA-EOS(SE) — drinking-water & sanitation quality log (WASH / Swachh Vidyalaya).
// Record water-quality tests by source and track safe/unsafe results. Pure logic.

export const WATER_SOURCES = [
  "Borewell",
  "Overhead tank",
  "RO / purifier unit",
  "Hand pump",
  "Municipal supply",
]

export type WaterResult = "safe" | "unsafe"

export interface WaterTest {
  id: string
  source: string
  date: string
  ph: number
  result: WaterResult
  remarks: string
  /** Tenant node this test belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface WaterSummary {
  tests: number
  safe: number
  unsafe: number
  sources: number
  safePct: number
}

// WHO/IS 10500 acceptable drinking-water pH range.
export function isPhSafe(ph: number): boolean {
  return ph >= 6.5 && ph <= 8.5
}

export function waterSummary(tests: WaterTest[]): WaterSummary {
  const total = tests.length
  const safe = tests.filter((t) => t.result === "safe").length
  return {
    tests: total,
    safe,
    unsafe: total - safe,
    sources: new Set(tests.map((t) => t.source)).size,
    safePct: total === 0 ? 0 : Math.round((safe / total) * 100),
  }
}
