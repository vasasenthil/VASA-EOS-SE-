import { test } from "node:test"
import assert from "node:assert/strict"
import type { SupabaseClient } from "@supabase/supabase-js"
import { __setTestDb } from "@/lib/persistence"
import { makeFakeDb } from "./helpers/fake-db"
import {
  classify, metricFor, view, readingSeverity, telemetrySummary, alerts, queryReadings, validateReading,
  SENSOR_METRICS, type IotReading, type IotReadingInput,
} from "@/lib/iot"
import { listReadings, getReading, ingestReading, seedReadings } from "@/lib/iot/store"

function rd(over: Partial<IotReading> = {}): IotReading {
  return { id: "r", deviceId: "ENV-101", deviceLabel: "Class X-A sensor", schoolUdise: "33010100101", metricKey: "classroom_temp", value: 29, capturedAt: "2026-06-15T09:00:00.000Z", tenantId: "TN-CHN-B1-S1", ...over }
}

test("classify: Critical (outermost) beats Warning beats Normal", () => {
  const temp = metricFor("classroom_temp")!
  assert.equal(classify(29, temp), "Normal")
  assert.equal(classify(35, temp), "Warning") // >34 warnHigh, <38 critHigh
  assert.equal(classify(39, temp), "Critical") // >38 critHigh
  assert.equal(classify(11, temp), "Critical") // <12 critLow
  // one-sided metric (CO2): only high bounds
  const co2 = metricFor("air_co2")!
  assert.equal(classify(800, co2), "Normal")
  assert.equal(classify(1200, co2), "Warning")
  assert.equal(classify(1600, co2), "Critical")
})

test("informational metrics never alert (attendance count)", () => {
  const att = metricFor("attendance_count")!
  assert.equal(att.informational, true)
  assert.equal(classify(999999, att), "Normal")
})

test("view + readingSeverity derive label/unit/category/severity", () => {
  const v = view(rd({ metricKey: "mdm_storage_temp", value: 14 }))
  assert.equal(v.severity, "Critical") // >12 spoilage
  assert.equal(v.category, "Nutrition")
  assert.equal(v.unit, "°C")
  assert.equal(readingSeverity(rd({ metricKey: "water_tank_level", value: 10 })), "Critical") // <15
})

test("validateReading enforces device, metric and numeric value", () => {
  const ok: IotReadingInput = { deviceId: "ENV-101", deviceLabel: "s", schoolUdise: "33010100101", metricKey: "classroom_temp", value: 30, capturedAt: "2026-06-15T09:00" }
  assert.equal(validateReading(ok).ok, true)
  assert.ok(validateReading({ ...ok, deviceId: "" }).errors.deviceId)
  assert.ok(validateReading({ ...ok, metricKey: "nope" }).errors.metricKey)
  assert.ok(validateReading({ ...ok, value: Number.NaN }).errors.value)
})

function bulk(): IotReading[] {
  return [
    rd({ id: "a", metricKey: "classroom_temp", value: 29 }), // Normal
    rd({ id: "b", metricKey: "air_co2", value: 1300 }), // Warning
    rd({ id: "c", metricKey: "classroom_temp", value: 39, deviceId: "ENV-LAB" }), // Critical
    rd({ id: "d", metricKey: "water_tank_level", value: 12, deviceId: "INF-TANK" }), // Critical
    rd({ id: "e", metricKey: "attendance_count", value: 600, deviceId: "BIO" }), // Normal (info)
  ]
}

test("summary + alerts + query (severity sort, filter, paginate)", () => {
  const all = bulk()
  const s = telemetrySummary(all)
  assert.equal(s.total, 5)
  assert.equal(s.devices, 4) // ENV-101, ENV-LAB, INF-TANK, BIO
  assert.equal(s.critical, 2)
  assert.equal(s.warning, 1)
  // alerts: critical first, normals excluded
  const al = alerts(all)
  assert.equal(al.length, 3)
  assert.equal(al[0].severity, "Critical")
  // query: critical-first ordering and filters
  const page = queryReadings(all)
  assert.equal(page.readings[0].severity, "Critical")
  assert.ok(queryReadings(all, { severity: "Critical" }).readings.every((r) => r.severity === "Critical"))
  assert.ok(queryReadings(all, { category: "Nutrition" }).readings.every((r) => r.category === "Nutrition"))
  assert.equal(queryReadings(all, { pageSize: 2 }).totalPages, 3)
})

test("metric catalogue is well-formed", () => {
  assert.ok(SENSOR_METRICS.length >= 6)
  for (const m of SENSOR_METRICS) assert.ok(m.key && m.label && m.unit && m.category)
})

test("store: ingest → list → get (DB path); seed idempotent (in-memory)", async () => {
  __setTestDb(makeFakeDb() as unknown as SupabaseClient)
  const r = await ingestReading({ deviceId: "ENV-9", deviceLabel: "Test", schoolUdise: "33010100101", metricKey: "classroom_temp", value: 40, capturedAt: "2026-06-15T10:00:00.000Z" })
  assert.match(r.id, /^IOT-/)
  assert.equal((await getReading(r.id))?.deviceId, "ENV-9")
  __setTestDb(undefined)

  __setTestDb(null)
  const before = await listReadings()
  assert.ok(before.length >= 6)
  assert.equal(await seedReadings(), 10)
  assert.equal((await listReadings()).length, before.length)
  __setTestDb(undefined)
})
