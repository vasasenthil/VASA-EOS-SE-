// VASA-EOS(SE) — CCTV / surveillance compliance register (POCSO & campus safety).
// Register cameras by zone, track working status and zone coverage. Pure logic.

export const CCTV_ZONES = [
  "Main gate",
  "Corridor",
  "Playground",
  "Laboratory",
  "Office / records",
  "Boundary wall",
  "Classroom block",
  "Kitchen / store",
]

export interface Camera {
  id: string
  location: string
  zone: string
  working: boolean
}

export interface CctvSummary {
  total: number
  working: number
  down: number
  zonesCovered: number
  uptimePct: number
}

export function cctvSummary(cameras: Camera[]): CctvSummary {
  const total = cameras.length
  const working = cameras.filter((c) => c.working).length
  return {
    total,
    working,
    down: total - working,
    zonesCovered: new Set(cameras.filter((c) => c.working).map((c) => c.zone)).size,
    uptimePct: total === 0 ? 0 : Math.round((working / total) * 100),
  }
}

export function uncoveredZones(cameras: Camera[]): string[] {
  const covered = new Set(cameras.filter((c) => c.working).map((c) => c.zone))
  return CCTV_ZONES.filter((z) => !covered.has(z))
}
