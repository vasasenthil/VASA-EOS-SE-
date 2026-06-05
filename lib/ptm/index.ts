// VASA-EOS(SE) — parent-teacher meeting (PTM) scheduling (Sec 48 / engagement).
// Generate time slots and track bookings. Pure time math + summary.

export interface Slot {
  id: string
  time: string // HH:MM
  parent?: string
}

/** Add minutes to an HH:MM time, wrapping within a day. */
export function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = (h * 60 + m + mins + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export function generateSlots(start: string, count: number, stepMin: number): Slot[] {
  const n = Math.max(0, Math.floor(count))
  return Array.from({ length: n }, (_, i) => ({ id: `slot-${i}`, time: addMinutes(start, i * stepMin) }))
}

export interface PtmSummary {
  total: number
  booked: number
  free: number
}

export function ptmSummary(slots: Slot[]): PtmSummary {
  const booked = slots.filter((s) => s.parent).length
  return { total: slots.length, booked, free: slots.length - booked }
}
