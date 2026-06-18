// VASA-EOS(SE) — Library Circulation persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { LibraryLoan, LoanInput } from "./index"

function id(): string {
  return `LN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  accession_no: string
  title: string
  author: string
  category: string
  member: string
  member_id: string
  member_type: string
  class_level: string
  issue_date: string
  due_date: string
  return_date: string | null
  renewal_count: number
  fine_per_day: number
  fine_waived: number
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): LibraryLoan {
  return {
    id: r.id, accessionNo: r.accession_no, title: r.title, author: r.author, category: r.category,
    member: r.member, memberId: r.member_id, memberType: r.member_type, classLevel: r.class_level ?? "",
    issueDate: r.issue_date, dueDate: r.due_date, returnDate: r.return_date ?? "", renewalCount: r.renewal_count ?? 0,
    finePerDay: r.fine_per_day ?? 0, fineWaived: r.fine_waived ?? 0, notes: r.notes ?? "", createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(l: LibraryLoan, tenantId: string): Record<string, unknown> {
  return {
    id: l.id, accession_no: l.accessionNo, title: l.title, author: l.author, category: l.category,
    member: l.member, member_id: l.memberId, member_type: l.memberType, class_level: l.classLevel,
    issue_date: l.issueDate, due_date: l.dueDate, return_date: l.returnDate || null, renewal_count: l.renewalCount,
    fine_per_day: l.finePerDay, fine_waived: l.fineWaived, notes: l.notes, tenant_id: tenantId, created_at: l.createdAt, updated_at: l.updatedAt,
  }
}

function seed(): LibraryLoan[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (
    i: number, acc: string, title: string, author: string, category: string,
    member: string, memberId: string, memberType: string, cls: string,
    issue: string, due: string, ret: string,
  ): LibraryLoan => ({
    id: `demo-loan-${i}`, accessionNo: acc, title, author, category, member, memberId, memberType, classLevel: cls,
    issueDate: issue, dueDate: due, returnDate: ret, renewalCount: 0, finePerDay: 2, fineWaived: 0, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "ACC-00101", "Wings of Fire", "A.P.J. Abdul Kalam", "Non-fiction", "Aarthi M.", "100200300401", "Student", "X", "2026-06-10", "2026-06-24", ""),
    mk(2, "ACC-00102", "Ponniyin Selvan", "Kalki", "Fiction", "Bharath K.", "100200300402", "Student", "X", "2026-05-20", "2026-06-03", ""), // overdue, unreturned
    mk(3, "ACC-00103", "NCERT Mathematics X", "NCERT", "Textbook", "Mrs. Selvi", "STF-021", "Teacher", "", "2026-06-01", "2026-06-15", "2026-06-12"), // returned on time
    mk(4, "ACC-00104", "Indian Polity", "M. Laxmikanth", "Competitive Exam", "Mr. Anand", "STF-009", "Staff", "", "2026-05-15", "2026-05-29", "2026-06-05"), // returned late (fine)
    mk(5, "ACC-00105", "Malgudi Days", "R.K. Narayan", "Children", "Chithra V.", "100200300403", "Student", "IX", "2026-06-12", "2026-06-26", ""),
    mk(6, "ACC-00106", "Science Today", "Periodical", "Periodical", "Fatima B.", "100200300405", "Student", "X", "2026-05-25", "2026-06-08", ""), // overdue
  ]
}

const store: LibraryLoan[] = seed()

export async function listLoans(): Promise<LibraryLoan[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("library_loans").select("*").order("due_date", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getLoan(lid: string): Promise<LibraryLoan | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("library_loans").select("*").eq("id", lid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((l) => l.id === lid)
  }
  return store.find((l) => l.id === lid)
}

export async function createLoan(input: LoanInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<LibraryLoan> {
  const now = new Date().toISOString()
  const l: LibraryLoan = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("library_loans").insert(toRow(l, tenantId))
  else store.unshift(l)
  await appendAudit({ actor: "library", action: "loan.create", resource: l.id, details: { accession: l.accessionNo, member: l.member } })
  return l
}

export async function updateLoan(lid: string, input: LoanInput): Promise<LibraryLoan | undefined> {
  const existing = await getLoan(lid)
  if (!existing) return undefined
  const updated: LibraryLoan = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("library_loans").update({
      accession_no: updated.accessionNo, title: updated.title, author: updated.author, category: updated.category,
      member: updated.member, member_id: updated.memberId, member_type: updated.memberType, class_level: updated.classLevel,
      issue_date: updated.issueDate, due_date: updated.dueDate, return_date: updated.returnDate || null,
      renewal_count: updated.renewalCount, fine_per_day: updated.finePerDay, fine_waived: updated.fineWaived,
      notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", lid)
  } else {
    const i = store.findIndex((l) => l.id === lid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "library", action: "loan.update", resource: lid, details: { returned: !!updated.returnDate } })
  return updated
}

export async function deleteLoan(lid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("library_loans").delete().eq("id", lid)
  } else {
    const i = store.findIndex((l) => l.id === lid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "library", action: "loan.delete", resource: lid })
  return true
}

export async function seedLoans(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const l of rows) await db.from("library_loans").upsert(toRow(l, tenantId))
  } else {
    for (const l of rows) if (!store.some((s) => s.id === l.id)) store.push(l)
  }
  await appendAudit({ actor: "library", action: "loan.seed", resource: "library_loans", details: { count: rows.length } })
  return rows.length
}
