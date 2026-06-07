// VASA-EOS(SE) — Library circulation (loans) persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { dueDate, type Loan } from "./index"

function id(): string {
  return `LN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  book_id: string
  book_title: string
  borrower: string
  issued_on: string
  due_on: string
  returned_on: string | null
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Loan {
  return {
    id: r.id,
    bookId: r.book_id,
    bookTitle: r.book_title,
    borrower: r.borrower,
    issuedOn: r.issued_on,
    dueOn: r.due_on,
    returnedOn: r.returned_on ?? undefined,
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE,
  }
}

// Seeded across tenant nodes so library circulation rolls up by jurisdiction.
const store: Loan[] = [
  { id: "LN-SEED1", bookId: "B-101", bookTitle: "Thirukkural", borrower: "Class 9 — Asha", issuedOn: "2026-05-25", dueOn: "2026-06-08", tenantId: "TN-CHN-B1-S1" },
  { id: "LN-SEED2", bookId: "B-220", bookTitle: "Wings of Fire", borrower: "Class 10 — Ravi", issuedOn: "2026-05-20", dueOn: "2026-06-03", returnedOn: "2026-06-01", tenantId: "TN-CHN-B2-S1" },
  { id: "LN-SEED3", bookId: "B-330", bookTitle: "Ponniyin Selvan", borrower: "Class 8 — Kavya", issuedOn: "2026-06-01", dueOn: "2026-06-15", tenantId: "TN-CBE-B1-S1" },
]

export interface NewLoan {
  bookId: string
  bookTitle: string
  borrower: string
  issuedOn: string
  /** Tenant node the loan is issued at; defaults to the demo school. */
  tenantId?: string
}

export async function issueLoan(input: NewLoan): Promise<Loan> {
  const l: Loan = {
    id: id(),
    bookId: input.bookId,
    bookTitle: input.bookTitle,
    borrower: input.borrower,
    issuedOn: input.issuedOn,
    dueOn: dueDate(input.issuedOn),
    tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE,
  }
  const db = getDb()
  if (db) {
    await db.from("loans").insert({
      id: l.id,
      book_id: l.bookId,
      book_title: l.bookTitle,
      borrower: l.borrower,
      issued_on: l.issuedOn,
      due_on: l.dueOn,
      returned_on: null,
      tenant_id: l.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(l)
  }
  await appendAudit({ actor: "library", action: "loan.issue", resource: l.id, details: { book: l.bookTitle } })
  return l
}

async function load(lid: string): Promise<Loan | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("loans").select("*").eq("id", lid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === lid)
}

export async function getLoan(lid: string): Promise<Loan | undefined> {
  return load(lid)
}

export async function returnLoan(lid: string, returnedOn: string): Promise<Loan | undefined> {
  const l = await load(lid)
  if (!l || l.returnedOn) return l
  l.returnedOn = returnedOn
  const db = getDb()
  if (db) await db.from("loans").update({ returned_on: returnedOn }).eq("id", lid)
  await appendAudit({ actor: "library", action: "loan.return", resource: lid })
  return l
}

export async function deleteLoan(lid: string): Promise<boolean> {
  const existing = await load(lid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("loans").delete().eq("id", lid)
  } else {
    const i = store.findIndex((x) => x.id === lid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "loan.delete", resource: lid })
  return true
}

export async function listLoans(): Promise<Loan[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("loans").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
