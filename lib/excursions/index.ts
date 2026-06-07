// VASA-EOS(SE) — field trip / excursion management (safety + parental consent).
// Plan trips and track consent forms collected before a trip can run. Pure logic.

export interface Trip {
  id: string
  destination: string
  date: string
  classGroup: string
  strength: number
  consentsReceived: number
  /** Tenant node this trip belongs to — drives per-role data scoping. */
  tenantId: string
}

export interface ExcursionSummary {
  trips: number
  students: number
  consentsReceived: number
  consentPct: number
  readyTrips: number
}

// A trip is cleared to run only when every student has a signed consent form.
export function isTripReady(t: Trip): boolean {
  return t.strength > 0 && t.consentsReceived >= t.strength
}

export function excursionSummary(trips: Trip[]): ExcursionSummary {
  const students = trips.reduce((sum, t) => sum + t.strength, 0)
  const consents = trips.reduce((sum, t) => sum + Math.min(t.consentsReceived, t.strength), 0)
  return {
    trips: trips.length,
    students,
    consentsReceived: consents,
    consentPct: students === 0 ? 0 : Math.round((consents / students) * 100),
    readyTrips: trips.filter(isTripReady).length,
  }
}
