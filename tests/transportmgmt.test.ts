import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  emptyRoute, validateRoute, freeSeats, occupancyPct, isOverloaded, transportSummary, queryRoutes,
  type TransportRoute, type TransportInput, type RouteStop,
} from "@/lib/transportmgmt"
import { listRoutes, getRoute, createRoute, updateRoute, deleteRoute, seedRoutes } from "@/lib/transportmgmt/store"

const stops: RouteStop[] = [{ name: "Anna Nagar", pickupTime: "07:20", dropTime: "16:40" }, { name: "School", pickupTime: "08:00", dropTime: "16:00" }]
function valid(over: Partial<TransportInput> = {}): TransportInput {
  return {
    routeName: "Anna Nagar – School", routeCode: "RT-01", vehicleNo: "TN-01-AB-1234", vehicleType: "Bus", driverName: "Murugan",
    driverPhone: "9840011001", capacity: 45, assignedCount: 42, stops, farePerTerm: 3000, shift: "Both", status: "Active", notes: "", ...over,
  }
}

test("occupancy maths: free seats, occupancy %, overloaded", () => {
  assert.equal(freeSeats(valid()), 3)
  assert.equal(occupancyPct(valid()), 93.3)
  assert.equal(isOverloaded(valid()), false)
  assert.equal(isOverloaded(valid({ assignedCount: 48 })), true)
  assert.equal(freeSeats(valid({ assignedCount: 48 })), -3)
})

test("validation: code/vehicle patterns, phone, capacity, stops", () => {
  assert.equal(validateRoute(valid()).ok, true)
  assert.ok(validateRoute(valid({ routeCode: "01" })).errors.routeCode)
  assert.ok(validateRoute(valid({ vehicleNo: "1234" })).errors.vehicleNo)
  assert.equal(validateRoute(valid({ vehicleNo: "TN09CD5678" })).ok, true) // no-hyphen accepted
  assert.ok(validateRoute(valid({ driverPhone: "123" })).errors.driverPhone)
  assert.ok(validateRoute(valid({ capacity: 0 })).errors.capacity)
  assert.ok(validateRoute(valid({ stops: [{ name: "", pickupTime: "07:20", dropTime: "16:40" }] })).errors.stops)
  assert.ok(validateRoute(emptyRoute()).errors.routeName)
})

function bulk(n: number): TransportRoute[] {
  return Array.from({ length: n }, (_, i) => ({
    ...valid({ routeCode: `RT-${i + 1}`, capacity: 40, assignedCount: i % 4 === 0 ? 44 : 30, status: i % 3 === 0 ? "Planned" : "Active", vehicleType: i % 2 ? "Van" : "Bus" }),
    id: `r${i}`, createdAt: "", updatedAt: "",
  })) as TransportRoute[]
}

test("transportSummary aggregates capacity/assigned/overloaded; queryRoutes filters + paginates", () => {
  const all = bulk(12)
  const s = transportSummary(all)
  assert.equal(s.routes, 12)
  assert.equal(s.capacity, 480) // 12 * 40
  assert.ok(s.overloaded >= 3) // every 4th overloaded (44 > 40)
  assert.ok(queryRoutes(all, { status: "Active" }).routes.every((r) => r.status === "Active"))
  assert.ok(queryRoutes(all, { vehicleType: "Van" }).routes.every((r) => r.vehicleType === "Van"))
  const p = queryRoutes(all, { pageSize: 5 })
  assert.equal(p.routes.length, 5)
  assert.equal(p.totalPages, 3)
})

test("store CRUD: create → read → update → delete (DB path, stops JSONB round-trip)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const created = await createRoute(valid())
  assert.match(created.id, /^TR-/)
  const got = await getRoute(created.id)
  assert.equal(got?.stops.length, 2)
  const updated = await updateRoute(created.id, valid({ assignedCount: 45, status: "Suspended" }))
  assert.equal(updated?.assignedCount, 45)
  assert.equal(updated?.status, "Suspended")
  assert.equal(await deleteRoute(created.id), true)
  __setTestDb(undefined)
})

test("in-memory fallback seeded; seedRoutes idempotent", async () => {
  __setTestDb(null)
  const before = await listRoutes()
  assert.ok(before.length >= 5)
  assert.equal(await seedRoutes(), 5)
  assert.equal((await listRoutes()).length, before.length)
})
