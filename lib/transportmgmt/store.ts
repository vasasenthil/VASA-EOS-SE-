// VASA-EOS(SE) — Transport Management persistence (server-only). Full CRUD.
// Durable in Supabase when configured (stops as JSONB); in-memory seeded fallback otherwise.
// Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { TransportRoute, TransportInput, RouteStop } from "./index"

function id(): string {
  return `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  route_name: string
  route_code: string
  vehicle_no: string
  vehicle_type: string
  driver_name: string
  driver_phone: string
  capacity: number
  assigned_count: number
  stops: unknown
  fare_per_term: number
  shift: string
  status: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function stopsOf(v: unknown): RouteStop[] {
  if (Array.isArray(v)) return v as RouteStop[]
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? (p as RouteStop[]) : [] } catch { return [] } }
  return []
}

function fromRow(r: Row): TransportRoute {
  return {
    id: r.id, routeName: r.route_name, routeCode: r.route_code, vehicleNo: r.vehicle_no, vehicleType: r.vehicle_type,
    driverName: r.driver_name, driverPhone: r.driver_phone, capacity: r.capacity, assignedCount: r.assigned_count,
    stops: stopsOf(r.stops), farePerTerm: r.fare_per_term, shift: r.shift, status: (r.status as TransportRoute["status"]) ?? "Active",
    notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(t: TransportRoute, tenantId: string): Record<string, unknown> {
  return {
    id: t.id, route_name: t.routeName, route_code: t.routeCode, vehicle_no: t.vehicleNo, vehicle_type: t.vehicleType,
    driver_name: t.driverName, driver_phone: t.driverPhone, capacity: t.capacity, assigned_count: t.assignedCount,
    stops: t.stops, fare_per_term: t.farePerTerm, shift: t.shift, status: t.status, notes: t.notes,
    tenant_id: tenantId, created_at: t.createdAt, updated_at: t.updatedAt,
  }
}

function seed(): TransportRoute[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (
    i: number, name: string, code: string, vno: string, vtype: string, driver: string, phone: string,
    capacity: number, assigned: number, stops: RouteStop[], fare: number, shift: string, status: TransportRoute["status"] = "Active",
  ): TransportRoute => ({
    id: `demo-route-${i}`, routeName: name, routeCode: code, vehicleNo: vno, vehicleType: vtype, driverName: driver, driverPhone: phone,
    capacity, assignedCount: assigned, stops, farePerTerm: fare, shift, status, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Anna Nagar – School", "RT-01", "TN-01-AB-1234", "Bus", "Murugan", "9840011001", 45, 42,
      [{ name: "Anna Nagar", pickupTime: "07:20", dropTime: "16:40" }, { name: "Shanthi Colony", pickupTime: "07:30", dropTime: "16:30" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }], 3000, "Both"),
    mk(2, "T. Nagar – School", "RT-02", "TN-09-CD-5678", "Bus", "Selvam", "9840011002", 45, 48,
      [{ name: "T. Nagar", pickupTime: "07:15", dropTime: "16:45" }, { name: "Pondy Bazaar", pickupTime: "07:25", dropTime: "16:35" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }], 3000, "Both"), // overloaded
    mk(3, "Velachery – School", "RT-03", "TN-22-EF-9012", "Mini Bus", "Kannan", "9840011003", 28, 20,
      [{ name: "Velachery", pickupTime: "07:10", dropTime: "16:50" }, { name: "Guindy", pickupTime: "07:30", dropTime: "16:30" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }], 3500, "Both"),
    mk(4, "Adyar Van", "RT-04", "TN-07-GH-3456", "Van", "Raja", "9840011004", 12, 9,
      [{ name: "Adyar", pickupTime: "07:35", dropTime: "16:25" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }], 4000, "Both"),
    mk(5, "Tambaram – School", "RT-05", "TN-11-IJ-7890", "Bus", "Anbu", "9840011005", 50, 0,
      [{ name: "Tambaram", pickupTime: "06:55", dropTime: "17:05" }, { name: "Chromepet", pickupTime: "07:10", dropTime: "16:50" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }], 4500, "Both", "Planned"),
  ]
}

const store: TransportRoute[] = seed()

export async function listRoutes(): Promise<TransportRoute[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("transport_routes").select("*").order("route_code", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getRoute(rid: string): Promise<TransportRoute | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("transport_routes").select("*").eq("id", rid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((r) => r.id === rid)
  }
  return store.find((r) => r.id === rid)
}

export async function createRoute(input: TransportInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<TransportRoute> {
  const now = new Date().toISOString()
  const t: TransportRoute = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("transport_routes").insert(toRow(t, tenantId))
  else store.unshift(t)
  await appendAudit({ actor: "transport", action: "route.create", resource: t.id, details: { code: t.routeCode, vehicle: t.vehicleNo } })
  return t
}

export async function updateRoute(rid: string, input: TransportInput): Promise<TransportRoute | undefined> {
  const existing = await getRoute(rid)
  if (!existing) return undefined
  const updated: TransportRoute = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("transport_routes").update({
      route_name: updated.routeName, route_code: updated.routeCode, vehicle_no: updated.vehicleNo, vehicle_type: updated.vehicleType,
      driver_name: updated.driverName, driver_phone: updated.driverPhone, capacity: updated.capacity, assigned_count: updated.assignedCount,
      stops: updated.stops, fare_per_term: updated.farePerTerm, shift: updated.shift, status: updated.status, notes: updated.notes,
      updated_at: updated.updatedAt,
    }).eq("id", rid)
  } else {
    const i = store.findIndex((r) => r.id === rid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "transport", action: "route.update", resource: rid, details: { status: updated.status } })
  return updated
}

export async function deleteRoute(rid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("transport_routes").delete().eq("id", rid)
  } else {
    const i = store.findIndex((r) => r.id === rid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "transport", action: "route.delete", resource: rid })
  return true
}

export async function seedRoutes(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const r of rows) await db.from("transport_routes").upsert(toRow(r, tenantId))
  } else {
    for (const r of rows) if (!store.some((s) => s.id === r.id)) store.push(r)
  }
  await appendAudit({ actor: "transport", action: "route.seed", resource: "transport_routes", details: { count: rows.length } })
  return rows.length
}
