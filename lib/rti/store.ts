// VASA-EOS(SE) — RTI application register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextRtiStatus, type RtiRequest } from "./index"

function id(): string {
  return `RTI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  applicant: string
  subject: string
  received_date: string
  status: RtiRequest["status"]
  created_at: string
}

function fromRow(r: Row): RtiRequest {
  return { id: r.id, applicant: r.applicant, subject: r.subject, receivedDate: r.received_date, status: r.status }
}

const store: RtiRequest[] = []

export interface NewRti {
  applicant: string
  subject: string
  receivedDate: string
}

export async function createRti(input: NewRti): Promise<RtiRequest> {
  const r: RtiRequest = {
    id: id(),
    applicant: input.applicant,
    subject: input.subject,
    receivedDate: input.receivedDate,
    status: "received",
  }
  const db = getDb()
  if (db) {
    await db.from("rti_requests").insert({
      id: r.id,
      applicant: r.applicant,
      subject: r.subject,
      received_date: r.receivedDate,
      status: r.status,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(r)
  }
  await appendAudit({ actor: "pio", action: "rti.log", resource: r.id })
  return r
}

async function load(rid: string): Promise<RtiRequest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("rti_requests").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getRti(rid: string): Promise<RtiRequest | undefined> {
  return load(rid)
}

export async function advanceRti(rid: string): Promise<RtiRequest | undefined> {
  const r = await load(rid)
  if (!r) return undefined
  r.status = nextRtiStatus(r.status)
  const db = getDb()
  if (db) await db.from("rti_requests").update({ status: r.status }).eq("id", rid)
  await appendAudit({ actor: "pio", action: "rti.advance", resource: rid, details: { status: r.status } })
  return r
}

export async function deleteRti(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("rti_requests").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "rti.delete", resource: rid })
  return true
}

export async function listRti(): Promise<RtiRequest[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("rti_requests").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
