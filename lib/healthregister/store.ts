// VASA-EOS(SE) — School Health Register persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { HealthRecord, HealthInput, ScreenResult } from "./index"

function id(): string {
  return `HLT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  apaar_id: string
  class_level: string
  section: string
  gender: string
  screening_date: string
  height_cm: number
  weight_kg: number
  vision: string
  hearing: string
  dental: string
  immunisation_up_to_date: boolean
  hemoglobin: number
  remarks: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): HealthRecord {
  return {
    id: r.id, student: r.student, apaarId: r.apaar_id ?? "", classLevel: r.class_level, section: r.section, gender: r.gender,
    screeningDate: r.screening_date, heightCm: r.height_cm, weightKg: r.weight_kg, vision: (r.vision as ScreenResult) ?? "Normal",
    hearing: (r.hearing as ScreenResult) ?? "Normal", dental: (r.dental as ScreenResult) ?? "Normal",
    immunisationUpToDate: !!r.immunisation_up_to_date, hemoglobin: r.hemoglobin ?? 0, remarks: r.remarks ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(h: HealthRecord, tenantId: string): Row {
  return {
    id: h.id, student: h.student, apaar_id: h.apaarId, class_level: h.classLevel, section: h.section, gender: h.gender,
    screening_date: h.screeningDate, height_cm: h.heightCm, weight_kg: h.weightKg, vision: h.vision, hearing: h.hearing, dental: h.dental,
    immunisation_up_to_date: h.immunisationUpToDate, hemoglobin: h.hemoglobin, remarks: h.remarks, tenant_id: tenantId, created_at: h.createdAt, updated_at: h.updatedAt,
  }
}

function seed(): HealthRecord[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, student: string, apaar: string, cls: string, gender: string, h: number, w: number, vision: ScreenResult, hearing: ScreenResult, dental: ScreenResult, imm: boolean, hb: number): HealthRecord => ({
    id: `demo-health-${i}`, student, apaarId: apaar, classLevel: cls, section: "A", gender, screeningDate: "2026-06-15", heightCm: h, weightKg: w,
    vision, hearing, dental, immunisationUpToDate: imm, hemoglobin: hb, remarks: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Aarthi M.", "100200300401", "X", "Female", 158, 50, "Normal", "Normal", "Normal", true, 12.4),
    mk(2, "Bharath K.", "100200300402", "X", "Male", 162, 41, "Normal", "Normal", "Refer", true, 10.8), // underweight + anaemia + dental
    mk(3, "Chithra V.", "100200300403", "IX", "Female", 150, 38, "Refer", "Normal", "Normal", true, 11.0), // underweight + vision + anaemia
    mk(4, "Dinesh R.", "100200300404", "XI", "Male", 170, 92, "Normal", "Normal", "Normal", true, 14.2), // obese
    mk(5, "Fatima B.", "100200300405", "X", "Female", 155, 52, "Normal", "Normal", "Normal", false, 12.0), // immunisation overdue
    mk(6, "Gokul S.", "100200300406", "VIII", "Male", 145, 40, "Normal", "Normal", "Normal", true, 13.0), // normal
  ]
}

const store: HealthRecord[] = seed()

export async function listHealth(): Promise<HealthRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("health_records").select("*").order("screening_date", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getHealth(hid: string): Promise<HealthRecord | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("health_records").select("*").eq("id", hid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((h) => h.id === hid)
  }
  return store.find((h) => h.id === hid)
}

export async function createHealth(input: HealthInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<HealthRecord> {
  const now = new Date().toISOString()
  const h: HealthRecord = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("health_records").insert(toRow(h, tenantId))
  else store.unshift(h)
  await appendAudit({ actor: "health", action: "health.create", resource: h.id, details: { student: h.student } })
  return h
}

export async function updateHealth(hid: string, input: HealthInput): Promise<HealthRecord | undefined> {
  const existing = await getHealth(hid)
  if (!existing) return undefined
  const updated: HealthRecord = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("health_records").update({
      student: updated.student, apaar_id: updated.apaarId, class_level: updated.classLevel, section: updated.section, gender: updated.gender,
      screening_date: updated.screeningDate, height_cm: updated.heightCm, weight_kg: updated.weightKg, vision: updated.vision, hearing: updated.hearing,
      dental: updated.dental, immunisation_up_to_date: updated.immunisationUpToDate, hemoglobin: updated.hemoglobin, remarks: updated.remarks, updated_at: updated.updatedAt,
    }).eq("id", hid)
  } else {
    const i = store.findIndex((h) => h.id === hid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "health", action: "health.update", resource: hid, details: { student: updated.student } })
  return updated
}

export async function deleteHealth(hid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("health_records").delete().eq("id", hid)
  } else {
    const i = store.findIndex((h) => h.id === hid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "health", action: "health.delete", resource: hid })
  return true
}

export async function seedHealth(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const h of rows) await db.from("health_records").upsert(toRow(h, tenantId))
  } else {
    for (const h of rows) if (!store.some((s) => s.id === h.id)) store.push(h)
  }
  await appendAudit({ actor: "health", action: "health.seed", resource: "health_records", details: { count: rows.length } })
  return rows.length
}
