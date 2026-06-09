// VASA-EOS(SE) — Teacher posting / transfer register persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextTransferStatus, type TransferRequest } from "./index"

function id(): string {
  return `TR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  teacher: string
  from_school: string
  to_school: string
  reason: string
  status: TransferRequest["status"]
  created_at: string
}

function fromRow(r: Row): TransferRequest {
  return { id: r.id, teacher: r.teacher, fromSchool: r.from_school, toSchool: r.to_school, reason: r.reason, status: r.status }
}

const store: TransferRequest[] = []

export interface NewTransfer {
  teacher: string
  fromSchool: string
  toSchool: string
  reason: string
}

export async function fileTransfer(input: NewTransfer): Promise<TransferRequest> {
  const t: TransferRequest = { id: id(), ...input, status: "requested" }
  const db = getDb()
  if (db) {
    await db.from("transfers").insert({
      id: t.id,
      teacher: t.teacher,
      from_school: t.fromSchool,
      to_school: t.toSchool,
      reason: t.reason,
      status: t.status,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(t)
  }
  await appendAudit({ actor: t.teacher, action: "transfer.file", resource: t.id })
  return t
}

async function load(tid: string): Promise<TransferRequest | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("transfers").select("*").eq("id", tid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === tid)
}

export async function getTransfer(tid: string): Promise<TransferRequest | undefined> {
  return load(tid)
}

export async function advanceTransfer(tid: string): Promise<TransferRequest | undefined> {
  const t = await load(tid)
  if (!t) return undefined
  t.status = nextTransferStatus(t.status)
  const db = getDb()
  if (db) await db.from("transfers").update({ status: t.status }).eq("id", tid)
  await appendAudit({ actor: "counselling", action: "transfer.advance", resource: tid, details: { status: t.status } })
  return t
}

export async function rejectTransfer(tid: string): Promise<TransferRequest | undefined> {
  const t = await load(tid)
  if (!t) return undefined
  t.status = "rejected"
  const db = getDb()
  if (db) await db.from("transfers").update({ status: t.status }).eq("id", tid)
  await appendAudit({ actor: "counselling", action: "transfer.reject", resource: tid })
  return t
}

export async function deleteTransfer(tid: string): Promise<boolean> {
  const existing = await load(tid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("transfers").delete().eq("id", tid)
  } else {
    const i = store.findIndex((x) => x.id === tid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "transfer.delete", resource: tid })
  return true
}

export async function listTransfers(): Promise<TransferRequest[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("transfers").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
