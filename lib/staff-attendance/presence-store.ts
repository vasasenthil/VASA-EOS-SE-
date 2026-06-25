// VASA-EOS(SE) — daily teacher-presence snapshot persistence (server-only).
//
// Backs the Principal dashboard's "Teachers Present" KPI with live, durable data. A snapshot is
// one school-day: how many teaching staff are present out of the sanctioned/working strength. This
// is intentionally separate from the full per-staff saved sheets (lib/staff-attendance/store) — the
// dashboard KPI only needs the present/total headline, and a dedicated seeded store keeps it live
// without coupling to (or reseeding) the sheet store. Durable in Supabase when configured;
// in-memory seeded fallback otherwise. Every snapshot is audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"

/** The demo school's UDISE code — the in-memory seed and dashboard default. */
export const DEMO_UDISE = "33010100101"

/** Attended percentage for a present/total pair (0 when no staff on roll). */
export function presencePct(present: number, total: number): number {
  return total === 0 ? 0 : Math.round((present / total) * 100)
}

export interface TeacherPresenceRecord {
  id: string
  udiseCode: string
  date: string
  present: number
  total: number
  tenantId: string
}

interface Row {
  id: string
  udise_code: string
  on_date: string
  present: number
  total: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): TeacherPresenceRecord {
  return { id: r.id, udiseCode: r.udise_code, date: r.on_date, present: r.present, total: r.total, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

function newId(): string {
  return `TP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Seed mirrors the dashboard's historical headline: 38 of 42 teaching staff present.
const SEED: TeacherPresenceRecord = {
  id: newId(),
  udiseCode: DEMO_UDISE,
  date: "2026-04-01",
  present: 38,
  total: 42,
  tenantId: DEFAULT_SCHOOL_NODE,
}

const store: TeacherPresenceRecord[] = [SEED]

export interface NewTeacherPresence {
  udiseCode?: string
  date: string
  present: number
  total: number
  tenantId?: string
}

export async function recordTeacherPresence(input: NewTeacherPresence): Promise<TeacherPresenceRecord> {
  const rec: TeacherPresenceRecord = {
    id: newId(),
    udiseCode: input.udiseCode ?? DEMO_UDISE,
    date: input.date,
    present: input.present,
    total: input.total,
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("teacher_presence").insert({
      id: rec.id,
      udise_code: rec.udiseCode,
      on_date: rec.date,
      present: rec.present,
      total: rec.total,
      tenant_id: rec.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "office",
    action: "teacher-presence.record",
    resource: `${rec.udiseCode}/${rec.date}`,
    details: { present: rec.present, total: rec.total },
  })
  return rec
}

async function listPresence(udiseCode: string): Promise<TeacherPresenceRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db
        .from("teacher_presence")
        .select("*")
        .eq("udise_code", udiseCode)
        .order("on_date", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return store.filter((r) => r.udiseCode === udiseCode).sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** The most recent teacher-presence snapshot for a school, or undefined if none. */
export async function latestTeacherPresence(udiseCode: string = DEMO_UDISE): Promise<TeacherPresenceRecord | undefined> {
  const rows = await listPresence(udiseCode)
  return rows[0]
}
