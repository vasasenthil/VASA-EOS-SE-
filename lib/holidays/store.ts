// VASA-EOS(SE) — Holiday Calendar persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Holiday, HolidayInput } from "./index"

function id(): string {
  return `HOL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  name: string
  category: string
  start_date: string
  end_date: string
  recurring: boolean
  academic_year: string
  description: string
  status: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): Holiday {
  return {
    id: r.id, name: r.name, category: (r.category as Holiday["category"]) ?? "Special", startDate: r.start_date, endDate: r.end_date,
    recurring: !!r.recurring, academicYear: r.academic_year, description: r.description ?? "",
    status: (r.status as Holiday["status"]) ?? "Confirmed", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(h: Holiday, tenantId: string): Row {
  return {
    id: h.id, name: h.name, category: h.category, start_date: h.startDate, end_date: h.endDate, recurring: h.recurring,
    academic_year: h.academicYear, description: h.description, status: h.status, tenant_id: tenantId,
    created_at: h.createdAt, updated_at: h.updatedAt,
  }
}

function seed(): Holiday[] {
  const now = "2026-04-01T00:00:00.000Z"
  const ay = "2026-2027"
  const mk = (i: number, name: string, category: Holiday["category"], start: string, end: string, recurring: boolean, status: Holiday["status"] = "Confirmed"): Holiday => ({
    id: `demo-hol-${i}`, name, category, startDate: start, endDate: end, recurring, academicYear: ay,
    description: `${category} holiday — ${name}.`, status, createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Independence Day", "National", "2026-08-15", "2026-08-15", true),
    mk(2, "Gandhi Jayanti", "National", "2026-10-02", "2026-10-02", true),
    mk(3, "Vinayagar Chaturthi", "State", "2026-08-27", "2026-08-27", false),
    mk(4, "Deepavali holidays", "Vacation", "2026-11-07", "2026-11-12", false),
    mk(5, "Pongal holidays", "State", "2027-01-14", "2027-01-17", false),
    mk(6, "Republic Day", "National", "2027-01-26", "2027-01-26", true),
    mk(7, "Quarterly exam break", "Exam Break", "2026-09-28", "2026-10-03", false, "Tentative"),
    mk(8, "Milad-un-Nabi", "Restricted", "2026-09-04", "2026-09-04", false, "Tentative"),
  ]
}

const store: Holiday[] = seed()

export async function listHolidays(): Promise<Holiday[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("holidays").select("*").order("start_date", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getHoliday(hid: string): Promise<Holiday | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("holidays").select("*").eq("id", hid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((h) => h.id === hid)
  }
  return store.find((h) => h.id === hid)
}

export async function createHoliday(input: HolidayInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Holiday> {
  const now = new Date().toISOString()
  const h: Holiday = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("holidays").insert(toRow(h, tenantId))
  else store.unshift(h)
  await appendAudit({ actor: "calendar", action: "holiday.create", resource: h.id, details: { name: h.name, category: h.category } })
  return h
}

export async function updateHoliday(hid: string, input: HolidayInput): Promise<Holiday | undefined> {
  const existing = await getHoliday(hid)
  if (!existing) return undefined
  const updated: Holiday = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("holidays").update({
      name: updated.name, category: updated.category, start_date: updated.startDate, end_date: updated.endDate,
      recurring: updated.recurring, academic_year: updated.academicYear, description: updated.description,
      status: updated.status, updated_at: updated.updatedAt,
    }).eq("id", hid)
  } else {
    const i = store.findIndex((h) => h.id === hid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "calendar", action: "holiday.update", resource: hid, details: { status: updated.status } })
  return updated
}

export async function deleteHoliday(hid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("holidays").delete().eq("id", hid)
  } else {
    const i = store.findIndex((h) => h.id === hid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "calendar", action: "holiday.delete", resource: hid })
  return true
}

export async function seedHolidays(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const h of rows) await db.from("holidays").upsert(toRow(h, tenantId))
  } else {
    for (const h of rows) if (!store.some((s) => s.id === h.id)) store.push(h)
  }
  await appendAudit({ actor: "calendar", action: "holiday.seed", resource: "holidays", details: { count: rows.length } })
  return rows.length
}
