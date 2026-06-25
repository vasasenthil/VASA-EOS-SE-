// VASA-EOS(SE) — Knowledge Base persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded TN canon otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { Article, ArticleInput } from "./index"

function id(): string {
  return `KB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  title: string
  category: string
  content: string
  source: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): Article {
  return { id: r.id, title: r.title, category: r.category, content: r.content, source: r.source ?? "", createdAt: r.created_at, updatedAt: r.updated_at }
}

function toRow(a: Article, tenantId: string): Row {
  return { id: a.id, title: a.title, category: a.category, content: a.content, source: a.source, tenant_id: tenantId, created_at: a.createdAt, updated_at: a.updatedAt }
}

function seed(): Article[] {
  const now = "2026-04-01T00:00:00.000Z"
  const mk = (i: number, title: string, category: string, content: string, source: string): Article => ({ id: `demo-kb-${i}`, title, category, content, source, createdAt: now, updatedAt: now })
  return [
    mk(1, "Pudhumai Penn eligibility", "Schemes", "Pudhumai Penn provides ₹1,000 per month to girl students who studied Classes 6 to 12 in government schools and are pursuing higher education, credited via DBT to the student's bank account.", "TN Scheme Guidelines · Pudhumai Penn"),
    mk(2, "RTE 25% free seats", "RTE & Admissions", "Under RTE Section 12(1)(c), private unaided schools reserve 25% of entry-class seats for children from economically weaker and disadvantaged groups, admitted free; eligibility is income-based within the 6–14 age band.", "RTE Act 2009 · Sec 12(1)(c)"),
    mk(3, "Attendance norm", "Attendance", "Schools mark daily attendance; a student with attendance below 75% is flagged for follow-up. Present and late both count as attended for the day's rate.", "TN School Operations Manual"),
    mk(4, "Fee concession & DBT", "Fees & DBT", "Fee concessions include RTE-free, scholarship and DBT-credit adjustments. A DBT credit requires a valid DBT reference, and the net demand is the gross fee minus the concession.", "TN Finance Circular · Fees"),
    mk(5, "Grievance process", "Grievance", "A grievance is logged with a category and routed to the responsible office; it moves through Acknowledged and Resolved with an assignee. Citizens can track status; unresolved cases escalate up the tier.", "TN Grievance Redress SOP"),
    mk(6, "NEP 5+3+3+4 structure", "Policy (NEP/SEP)", "NEP 2020 restructures schooling into 5+3+3+4: Foundational (ages 3–8), Preparatory (8–11), Middle (11–14) and Secondary (14–18) stages, with foundational literacy and numeracy as the priority.", "NEP 2020 · School Education"),
    mk(7, "Post-matric scholarship", "Schemes", "SC and ST students below the family income ceiling of ₹2.5 lakh per annum are eligible for the post-matric scholarship, disbursed via DBT on verification of category and income certificates.", "Adi Dravidar Welfare · Scholarship"),
    mk(8, "School compliance — PTR & WASH", "Policy (NEP/SEP)", "RTE infrastructure norms require a pupil–teacher ratio not exceeding 30:1, separate functional toilets for girls, and safe drinking water. Shortfalls are recorded as compliance gaps for rectification.", "RTE Act 2009 · Schedule (Norms)"),
  ]
}

const store: Article[] = seed()

export async function listArticles(): Promise<Article[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("kb_articles").select("*").order("title", { ascending: true })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getArticle(aid: string): Promise<Article | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("kb_articles").select("*").eq("id", aid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((a) => a.id === aid)
  }
  return store.find((a) => a.id === aid)
}

export async function createArticle(input: ArticleInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<Article> {
  const now = new Date().toISOString()
  const a: Article = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("kb_articles").insert(toRow(a, tenantId))
  else store.unshift(a)
  await appendAudit({ actor: "knowledge", action: "kb.create", resource: a.id, details: { title: a.title, category: a.category } })
  return a
}

export async function updateArticle(aid: string, input: ArticleInput): Promise<Article | undefined> {
  const existing = await getArticle(aid)
  if (!existing) return undefined
  const updated: Article = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("kb_articles").update({ title: updated.title, category: updated.category, content: updated.content, source: updated.source, updated_at: updated.updatedAt }).eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "knowledge", action: "kb.update", resource: aid, details: { title: updated.title } })
  return updated
}

export async function deleteArticle(aid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("kb_articles").delete().eq("id", aid)
  } else {
    const i = store.findIndex((a) => a.id === aid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "knowledge", action: "kb.delete", resource: aid })
  return true
}

export async function seedArticles(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const a of rows) await db.from("kb_articles").upsert(toRow(a, tenantId))
  } else {
    for (const a of rows) if (!store.some((s) => s.id === a.id)) store.push(a)
  }
  await appendAudit({ actor: "knowledge", action: "kb.seed", resource: "kb_articles", details: { count: rows.length } })
  return rows.length
}
