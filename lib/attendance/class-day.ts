// VASA-EOS(SE) — class-wise daily attendance roll-up (pure logic).
//
// Backs the Principal dashboard's "Today's Attendance" block with live, durable data instead of
// hardcoded arrays. Each class contributes an enrolled/present pair for a day; from those we derive
// the per-class rate + a Good/Watch band (>= 90% is "Good") and a school-wide roll-up. Pure +
// client-safe so the same maths runs in tests and on the server-rendered dashboard.

/** A single class's attendance for one day. */
export interface ClassDay {
  cls: string
  enrolled: number
  present: number
}

export type AttendanceBand = "Good" | "Watch"

export interface ClassDayRate extends ClassDay {
  pct: number
  status: AttendanceBand
}

/** The school's class order (Class I → XII) used to present rows deterministically. */
export const CLASS_ORDER = [
  "Class I", "Class II", "Class III", "Class IV", "Class V", "Class VI",
  "Class VII", "Class VIII", "Class IX", "Class X", "Class XI", "Class XII",
] as const

/** Attendance at/above this percentage is healthy ("Good"); below it needs watching. */
export const HEALTHY_PCT = 90

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Per-class rate (1 dp) and band. */
export function rateFor(c: ClassDay): ClassDayRate {
  const pct = c.enrolled === 0 ? 0 : round1((c.present / c.enrolled) * 100)
  return { ...c, pct, status: pct >= HEALTHY_PCT ? "Good" : "Watch" }
}

export interface SchoolDayRollup {
  classes: ClassDayRate[]
  enrolled: number
  present: number
  pct: number
}

/** School-wide roll-up across classes, sorted by CLASS_ORDER (unknown classes kept, appended). */
export function rollup(rows: ClassDay[]): SchoolDayRollup {
  const ordered = [...rows].sort((a, b) => {
    const ia = CLASS_ORDER.indexOf(a.cls as (typeof CLASS_ORDER)[number])
    const ib = CLASS_ORDER.indexOf(b.cls as (typeof CLASS_ORDER)[number])
    return (ia < 0 ? CLASS_ORDER.length : ia) - (ib < 0 ? CLASS_ORDER.length : ib)
  })
  const enrolled = ordered.reduce((n, c) => n + c.enrolled, 0)
  const present = ordered.reduce((n, c) => n + c.present, 0)
  const pct = enrolled === 0 ? 0 : round1((present / enrolled) * 100)
  return { classes: ordered.map(rateFor), enrolled, present, pct }
}
