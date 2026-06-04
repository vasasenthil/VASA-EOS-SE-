// VASA-EOS(SE) — Hostel & Residential Management (Sec 36 / welfare).
// Adi Dravidar, BC/MBC, KGBV and Tribal welfare hostels: allocation, mess, occupancy.

export type HostelType = "Adi Dravidar" | "BC/MBC" | "KGBV" | "Tribal"

export interface Hostel {
  id: string
  name: string
  type: HostelType
  district: string
  capacity: number
  occupied: number
}

export const HOSTELS: Hostel[] = [
  { id: "H1", name: "AD Welfare Boys Hostel, Chennai", type: "Adi Dravidar", district: "Chennai", capacity: 120, occupied: 108 },
  { id: "H2", name: "KGBV Residential, Nilgiris", type: "KGBV", district: "Nilgiris", capacity: 100, occupied: 96 },
  { id: "H3", name: "BC/MBC Girls Hostel, Madurai", type: "BC/MBC", district: "Madurai", capacity: 150, occupied: 121 },
  { id: "H4", name: "Tribal Welfare Hostel, Nilgiris", type: "Tribal", district: "Nilgiris", capacity: 80, occupied: 74 },
  { id: "H5", name: "AD Welfare Girls Hostel, Salem", type: "Adi Dravidar", district: "Salem", capacity: 130, occupied: 119 },
]

export interface HostelSummary {
  count: number
  capacity: number
  occupied: number
  occupancyPct: number
}

export function hostelSummary(hostels: Hostel[] = HOSTELS): HostelSummary {
  const capacity = hostels.reduce((s, h) => s + h.capacity, 0)
  const occupied = hostels.reduce((s, h) => s + h.occupied, 0)
  return {
    count: hostels.length,
    capacity,
    occupied,
    occupancyPct: capacity ? Math.round((occupied / capacity) * 100) : 0,
  }
}

export const MESS_CHECKLIST: string[] = [
  "Daily mess menu & nutrition logged",
  "Food-grain stock reconciled",
  "Warden attendance confirmed",
  "Health & safety inspection done",
  "Scholarship/welfare linkage verified",
]
