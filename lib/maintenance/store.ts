// VASA-EOS(SE) — Infrastructure maintenance ticket persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { nextTicketStatus, type Priority, type Ticket } from "./index"

function id(): string {
  return `T-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  category: string
  description: string
  priority: Priority
  status: Ticket["status"]
  raised_on: string
  created_at: string
}

function fromRow(r: Row): Ticket {
  return {
    id: r.id,
    category: r.category,
    description: r.description,
    priority: r.priority,
    status: r.status,
    raisedOn: r.raised_on,
  }
}

const store: Ticket[] = []

export interface NewTicket {
  category: string
  description: string
  priority: Priority
}

export async function raiseTicket(input: NewTicket): Promise<Ticket> {
  const t: Ticket = {
    id: id(),
    category: input.category,
    description: input.description,
    priority: input.priority,
    status: "open",
    raisedOn: new Date().toISOString().slice(0, 10),
  }
  const db = getDb()
  if (db) {
    await db.from("maintenance_tickets").insert({
      id: t.id,
      category: t.category,
      description: t.description,
      priority: t.priority,
      status: t.status,
      raised_on: t.raisedOn,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(t)
  }
  await appendAudit({ actor: "facilities", action: "ticket.raise", resource: t.id, details: { priority: t.priority } })
  return t
}

async function load(tid: string): Promise<Ticket | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("maintenance_tickets").select("*").eq("id", tid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === tid)
}

export async function getTicket(tid: string): Promise<Ticket | undefined> {
  return load(tid)
}

export async function advanceTicket(tid: string): Promise<Ticket | undefined> {
  const t = await load(tid)
  if (!t) return undefined
  t.status = nextTicketStatus(t.status)
  const db = getDb()
  if (db) await db.from("maintenance_tickets").update({ status: t.status }).eq("id", tid)
  await appendAudit({ actor: "facilities", action: "ticket.advance", resource: tid, details: { status: t.status } })
  return t
}

export async function deleteTicket(tid: string): Promise<boolean> {
  const existing = await load(tid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("maintenance_tickets").delete().eq("id", tid)
  } else {
    const i = store.findIndex((x) => x.id === tid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "ticket.delete", resource: tid })
  return true
}

export async function listTickets(): Promise<Ticket[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("maintenance_tickets").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
