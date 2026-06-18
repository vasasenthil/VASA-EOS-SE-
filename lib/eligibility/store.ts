// VASA-EOS(SE) — Eligibility & Compliance case persistence (server-only). Full CRUD.
// Durable in Supabase when configured (facts as JSONB); in-memory seeded fallback otherwise.
// The engine derivation is never stored — only the facts + the human decision. Audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { EligibilityCase, CaseInput, FactEntry } from "./index"

function id(): string {
  return `ELG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  subject: string
  reference: string
  category: string
  facts: unknown
  decision: string
  decided_by: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function factsOf(v: unknown): FactEntry[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? safe(v) : []
  return (arr as any[]).filter((f) => f && typeof f.key === "string").map((f) => ({ key: f.key, value: String(f.value ?? "") }))
}
function safe(s: string): unknown[] { try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [] } }

function fromRow(r: Row): EligibilityCase {
  return {
    id: r.id, subject: r.subject, reference: r.reference ?? "", category: r.category, facts: factsOf(r.facts),
    decision: (r.decision as EligibilityCase["decision"]) ?? "AI Draft", decidedBy: r.decided_by ?? "", notes: r.notes ?? "",
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(c: EligibilityCase, tenantId: string): Record<string, unknown> {
  return {
    id: c.id, subject: c.subject, reference: c.reference, category: c.category, facts: c.facts, decision: c.decision,
    decided_by: c.decidedBy, notes: c.notes, tenant_id: tenantId, created_at: c.createdAt, updated_at: c.updatedAt,
  }
}

function seed(): EligibilityCase[] {
  const now = "2026-06-20T00:00:00.000Z"
  const mk = (i: number, subject: string, ref: string, category: string, facts: FactEntry[], decision: EligibilityCase["decision"], decidedBy: string): EligibilityCase => ({
    id: `demo-elig-${i}`, subject, reference: ref, category, facts, decision, decidedBy, notes: "", createdAt: now, updatedAt: now,
  })
  return [
    mk(1, "Aarthi M.", "100200300401", "Pudhumai Penn", [{ key: "gender", value: "Female" }, { key: "schoolType", value: "Government" }, { key: "pursuingHigherEd", value: "true" }], "Approved", "BEO Egmore"),
    mk(2, "Raju P.", "100200300406", "RTE 25%", [{ key: "annualIncome", value: "150000" }, { key: "age", value: "9" }], "AI Draft", ""),
    mk(3, "Chithra V.", "100200300403", "Post-Matric Scholarship", [{ key: "socialCategory", value: "SC" }, { key: "annualIncome", value: "180000" }], "Approved", "DEO Chennai"),
    mk(4, "GHSS Egmore", "33010100101", "School Compliance", [{ key: "pupilTeacherRatio", value: "34" }, { key: "hasGirlsToilet", value: "true" }, { key: "hasDrinkingWater", value: "false" }], "AI Draft", ""),
  ]
}

const store: EligibilityCase[] = seed()

export async function listCases(): Promise<EligibilityCase[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("eligibility_cases").select("*").order("created_at", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getCase(cid: string): Promise<EligibilityCase | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("eligibility_cases").select("*").eq("id", cid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((c) => c.id === cid)
  }
  return store.find((c) => c.id === cid)
}

export async function createCase(input: CaseInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<EligibilityCase> {
  const now = new Date().toISOString()
  const c: EligibilityCase = { id: id(), ...input, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("eligibility_cases").insert(toRow(c, tenantId))
  else store.unshift(c)
  await appendAudit({ actor: "eligibility", action: "eligibility.create", resource: c.id, details: { subject: c.subject, category: c.category } })
  return c
}

export async function updateCase(cid: string, input: CaseInput): Promise<EligibilityCase | undefined> {
  const existing = await getCase(cid)
  if (!existing) return undefined
  const updated: EligibilityCase = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("eligibility_cases").update({
      subject: updated.subject, reference: updated.reference, category: updated.category, facts: updated.facts,
      decision: updated.decision, decided_by: updated.decidedBy, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "eligibility", action: "eligibility.update", resource: cid, details: { decision: updated.decision } })
  return updated
}

export async function deleteCase(cid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("eligibility_cases").delete().eq("id", cid)
  } else {
    const i = store.findIndex((c) => c.id === cid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "eligibility", action: "eligibility.delete", resource: cid })
  return true
}

export async function seedCases(tenantId = DEFAULT_SCHOOL_NODE): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const c of rows) await db.from("eligibility_cases").upsert(toRow(c, tenantId))
  } else {
    for (const c of rows) if (!store.some((s) => s.id === c.id)) store.push(c)
  }
  await appendAudit({ actor: "eligibility", action: "eligibility.seed", resource: "eligibility_cases", details: { count: rows.length } })
  return rows.length
}
