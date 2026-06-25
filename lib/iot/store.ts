// VASA-EOS(SE) — IoT telemetry persistence (server-only). Ingest + query.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every ingest audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { IotReading, IotReadingInput } from "./index"

function id(): string {
  return `IOT-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
}

interface Row {
  id: string
  device_id: string
  device_label: string
  school_udise: string
  metric_key: string
  value: number
  captured_at: string
  tenant_id: string
}

function fromRow(r: Row): IotReading {
  return {
    id: r.id, deviceId: r.device_id, deviceLabel: r.device_label, schoolUdise: r.school_udise,
    metricKey: r.metric_key, value: Number(r.value), capturedAt: r.captured_at, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

function toRow(r: IotReading): Row {
  return {
    id: r.id, device_id: r.deviceId, device_label: r.deviceLabel, school_udise: r.schoolUdise,
    metric_key: r.metricKey, value: r.value, captured_at: r.capturedAt, tenant_id: r.tenantId,
  }
}

const DEMO_UDISE = "33010100101"

function seed(): IotReading[] {
  const mk = (i: number, deviceId: string, deviceLabel: string, metricKey: string, value: number, mins: number): IotReading => ({
    id: `demo-iot-${i}`, deviceId, deviceLabel, schoolUdise: DEMO_UDISE, metricKey, value,
    capturedAt: new Date(Date.UTC(2026, 5, 15, 9, 0) - mins * 60000).toISOString(), tenantId: DEFAULT_SCHOOL_NODE,
  })
  return [
    mk(1, "ENV-101", "Class X-A sensor", "classroom_temp", 29, 5),         // Normal
    mk(2, "ENV-101", "Class X-A sensor", "air_co2", 1320, 5),              // Warning (>1000)
    mk(3, "ENV-LAB", "Science Lab sensor", "classroom_temp", 39, 8),       // Critical (>38)
    mk(4, "NUT-KIT", "MDM cold store", "mdm_storage_temp", 14, 12),        // Critical (>12 spoilage)
    mk(5, "NUT-KIT", "MDM cold store", "mdm_storage_temp", 6, 60),         // Normal
    mk(6, "INF-TANK", "Overhead water tank", "water_tank_level", 12, 15),  // Critical (<15)
    mk(7, "INF-PWR", "Main power line", "power_voltage", 233, 3),          // Normal
    mk(8, "INF-PWR", "Main power line", "power_voltage", 198, 30),         // Critical (<200)
    mk(9, "ENV-WTR", "Drinking water point", "water_ph", 7.2, 20),         // Normal
    mk(10, "BIO-GATE", "Entrance biometric", "attendance_count", 612, 30), // Informational
  ]
}

const store: IotReading[] = seed()

export async function listReadings(): Promise<IotReading[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("iot_readings").select("*").order("captured_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getReading(rid: string): Promise<IotReading | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("iot_readings").select("*").eq("id", rid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((r) => r.id === rid)
  }
  return store.find((r) => r.id === rid)
}

export async function ingestReading(input: IotReadingInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<IotReading> {
  const r: IotReading = { id: id(), ...input, tenantId }
  const db = getDb()
  if (db) await db.from("iot_readings").insert(toRow(r))
  else store.unshift(r)
  await appendAudit({ actor: r.deviceId, action: "iot.ingest", resource: r.id, details: { metric: r.metricKey, value: r.value } })
  return r
}

export async function seedReadings(): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const r of rows) await db.from("iot_readings").upsert(toRow(r))
  } else {
    for (const r of rows) if (!store.some((s) => s.id === r.id)) store.push(r)
  }
  await appendAudit({ actor: "operations", action: "iot.seed", resource: "iot_readings", details: { count: rows.length } })
  return rows.length
}
