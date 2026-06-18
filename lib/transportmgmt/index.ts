// VASA-EOS(SE) — Transport Management model + validation (school operations).
//
// One record per transport route: the route (name/code, shift), the vehicle (number, type,
// capacity), the driver (name, phone), the ordered list of stops (name + pickup/drop times), the
// number of students assigned, and the term transport fare. Pure, client-safe model shared by the
// form, the list filters and the store. Derived occupancy, free seats and overloaded flag. Full-CRUD
// module at Policies-grade depth. Distinct from lib/transport (the static routes board).

export const VEHICLE_TYPES = ["Bus", "Mini Bus", "Van", "Auto"] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const SHIFTS = ["Morning", "Afternoon", "Both"] as const
export type Shift = (typeof SHIFTS)[number]

export const ROUTE_STATUSES = ["Active", "Planned", "Suspended"] as const
export type RouteStatus = (typeof ROUTE_STATUSES)[number]

export interface RouteStop {
  name: string
  pickupTime: string
  dropTime: string
}

export interface TransportRoute {
  id: string
  routeName: string
  routeCode: string
  vehicleNo: string
  vehicleType: string
  driverName: string
  driverPhone: string
  capacity: number
  assignedCount: number
  stops: RouteStop[]
  farePerTerm: number
  shift: string
  status: RouteStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface TransportInput {
  routeName: string
  routeCode: string
  vehicleNo: string
  vehicleType: string
  driverName: string
  driverPhone: string
  capacity: number
  assignedCount: number
  stops: RouteStop[]
  farePerTerm: number
  shift: string
  status: RouteStatus
  notes: string
}

export function emptyRoute(): TransportInput {
  return {
    routeName: "", routeCode: "", vehicleNo: "", vehicleType: "Bus", driverName: "", driverPhone: "",
    capacity: 40, assignedCount: 0, stops: [{ name: "", pickupTime: "07:30", dropTime: "16:30" }],
    farePerTerm: 3000, shift: "Both", status: "Active", notes: "",
  }
}

export function freeSeats(r: Pick<TransportRoute, "capacity" | "assignedCount">): number {
  return r.capacity - r.assignedCount
}
export function occupancyPct(r: Pick<TransportRoute, "capacity" | "assignedCount">): number {
  return r.capacity > 0 ? Math.round((r.assignedCount / r.capacity) * 1000) / 10 : 0
}
export function isOverloaded(r: Pick<TransportRoute, "capacity" | "assignedCount">): boolean {
  return r.assignedCount > r.capacity
}

export type TransportErrors = Partial<Record<keyof TransportInput, string>>

const CODE_RE = /^RT-\d{1,3}$/
const PHONE_RE = /^\d{10}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
// Indian vehicle registration, e.g. TN-01-AB-1234 (hyphens optional in input)
const VEHICLE_RE = /^[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,2}[- ]?\d{1,4}$/

export function validateRoute(f: TransportInput): { ok: boolean; errors: TransportErrors } {
  const e: TransportErrors = {}
  if (!f.routeName.trim()) e.routeName = "Route name is required"
  if (!CODE_RE.test(f.routeCode.trim())) e.routeCode = "Route code like RT-01"
  if (!VEHICLE_RE.test(f.vehicleNo.trim().toUpperCase())) e.vehicleNo = "Vehicle no like TN-01-AB-1234"
  if (!(VEHICLE_TYPES as readonly string[]).includes(f.vehicleType)) e.vehicleType = "Select the vehicle type"
  if (!f.driverName.trim()) e.driverName = "Driver name is required"
  if (!PHONE_RE.test(f.driverPhone.trim())) e.driverPhone = "Driver phone must be 10 digits"
  if (!Number.isInteger(f.capacity) || f.capacity <= 0) e.capacity = "Capacity must be greater than 0"
  if (!Number.isInteger(f.assignedCount) || f.assignedCount < 0) e.assignedCount = "Assigned count cannot be negative"
  if (!Number.isFinite(f.farePerTerm) || f.farePerTerm < 0) e.farePerTerm = "Fare cannot be negative"
  if (!(SHIFTS as readonly string[]).includes(f.shift)) e.shift = "Select the shift"
  if (!(ROUTE_STATUSES as readonly string[]).includes(f.status)) e.status = "Select a status"
  if (!Array.isArray(f.stops) || f.stops.length === 0) e.stops = "Add at least one stop"
  else if (f.stops.some((s) => !s.name.trim() || !TIME_RE.test(s.pickupTime) || !TIME_RE.test(s.dropTime))) e.stops = "Each stop needs a name and valid pickup/drop times"
  return { ok: Object.keys(e).length === 0, errors: e }
}

export function inr(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`
}

export interface TransportFilters {
  query?: string
  status?: string
  vehicleType?: string
  shift?: string
  sortBy?: "routeCode" | "routeName" | "occupancy"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface TransportSummary {
  routes: number
  active: number
  capacity: number
  assigned: number
  freeSeats: number
  avgOccupancy: number
  overloaded: number
}

export interface TransportPage {
  routes: TransportRoute[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  summary: TransportSummary
}

const DEFAULT_PAGE_SIZE = 9

export function transportSummary(routes: TransportRoute[]): TransportSummary {
  let capacity = 0, assigned = 0, active = 0, overloaded = 0
  for (const r of routes) {
    capacity += r.capacity
    assigned += r.assignedCount
    if (r.status === "Active") active++
    if (isOverloaded(r)) overloaded++
  }
  const avgOccupancy = capacity > 0 ? Math.round((assigned / capacity) * 1000) / 10 : 0
  return { routes: routes.length, active, capacity, assigned, freeSeats: Math.max(0, capacity - assigned), avgOccupancy, overloaded }
}

export function queryRoutes(all: TransportRoute[], f: TransportFilters = {}): TransportPage {
  const q = (f.query ?? "").trim().toLowerCase()
  let rows = all.filter((r) => {
    if (q && !(`${r.routeName} ${r.routeCode} ${r.driverName} ${r.vehicleNo}`.toLowerCase().includes(q))) return false
    if (f.status && r.status !== f.status) return false
    if (f.vehicleType && r.vehicleType !== f.vehicleType) return false
    if (f.shift && r.shift !== f.shift) return false
    return true
  })
  const summary = transportSummary(rows)
  const dir = f.sortDir === "asc" ? 1 : -1
  const by = f.sortBy ?? "routeCode"
  rows = [...rows].sort((a, b) => {
    if (by === "occupancy") return (occupancyPct(a) - occupancyPct(b)) * dir
    const av = by === "routeName" ? a.routeName : a.routeCode
    const bv = by === "routeName" ? b.routeName : b.routeCode
    return av < bv ? -dir : av > bv ? dir : 0
  })
  const pageSize = f.pageSize && f.pageSize > 0 ? f.pageSize : DEFAULT_PAGE_SIZE
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { routes: rows.slice(start, start + pageSize), total, totalPages, page, pageSize, summary }
}
