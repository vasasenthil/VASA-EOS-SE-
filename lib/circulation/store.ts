// VASA-EOS(SE) — Library circulation (loans) persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
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
  }
}

const store: Loan[] = []

export interface NewLoan {
  bookId: string
  bookTitle: string
  borrower: string
  issuedOn: string
}

export async function issueLoan(input: NewLoan): Promise<Loan> {
  const l: Loan = {
    id: id(),
    bookId: input.bookId,
    bookTitle: input.bookTitle,
    borrower: input.borrower,
    issuedOn: input.issuedOn,
    dueOn: dueDate(input.issuedOn),
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
