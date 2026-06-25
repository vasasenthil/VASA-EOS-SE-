// VASA-EOS(SE) — school bus live-tracking (Sec 35 / safety, GPS stub).
// A simulated fleet moving stop-to-stop with progress and ETA. Pure helpers; the UI
// advances stops to mimic GPS pings. Production binds to real device telemetry.

export interface Bus {
  id: string
  route: string
  stopsTotal: number
  stopsDone: number
  delayed: boolean
}

export const BUSES: Bus[] = [
  { id: "TN01-A", route: "Egmore – Triplicane", stopsTotal: 8, stopsDone: 3, delayed: false },
  { id: "TN09-B", route: "Coimbatore Rural Loop", stopsTotal: 12, stopsDone: 7, delayed: true },
  { id: "TN43-C", route: "Nilgiris Hill Route", stopsTotal: 6, stopsDone: 6, delayed: false },
  { id: "TN58-D", route: "Madurai City Circuit", stopsTotal: 10, stopsDone: 0, delayed: false },
]

export const PER_STOP_MIN = 4
export const DELAY_MIN = 10

export function progressPct(bus: Bus): number {
  return bus.stopsTotal === 0 ? 0 : Math.round((bus.stopsDone / bus.stopsTotal) * 100)
}

/** Estimated minutes to complete the route from the current stop. */
export function etaMinutes(bus: Bus, perStopMin: number = PER_STOP_MIN): number {
  const remaining = Math.max(0, bus.stopsTotal - bus.stopsDone)
  return remaining * perStopMin + (bus.delayed ? DELAY_MIN : 0)
}

export function advanceStop(stopsDone: number, stopsTotal: number): number {
  return Math.min(stopsTotal, stopsDone + 1)
}

export type BusStatus = "en-route" | "arrived" | "delayed"

export function busStatus(bus: Bus): BusStatus {
  if (bus.stopsDone >= bus.stopsTotal) return "arrived"
  return bus.delayed ? "delayed" : "en-route"
}

export interface FleetSummary {
  buses: number
  enRoute: number
  arrived: number
  delayed: number
}

export function fleetSummary(buses: Bus[]): FleetSummary {
  return {
    buses: buses.length,
    enRoute: buses.filter((b) => busStatus(b) === "en-route").length,
    arrived: buses.filter((b) => busStatus(b) === "arrived").length,
    delayed: buses.filter((b) => busStatus(b) === "delayed").length,
  }
}
