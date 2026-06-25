// VASA-EOS(SE) — Scheme Fund-Flow Ledger persistence (server-only). Full CRUD.
// Durable in Supabase when configured; in-memory seeded fallback otherwise. Every mutation audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import type { FundLedgerRecord, FundLedgerInput, FundTier } from "./index"

function id(): string {
  return `FND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  scheme_code: string
  scheme_name: string
  financial_year: string
  tier: string
  allocated: number
  released: number
  utilised: number
  as_of: string
  notes: string
  tenant_id: string
  created_at: string
  updated_at: string
}

function fromRow(r: Row): FundLedgerRecord {
  return {
    id: r.id, schemeCode: r.scheme_code, schemeName: r.scheme_name, financialYear: r.financial_year, tier: (r.tier as FundTier) ?? "State",
    allocated: Number(r.allocated), released: Number(r.released), utilised: Number(r.utilised), asOf: r.as_of, notes: r.notes ?? "",
    tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE, createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function toRow(c: FundLedgerRecord): Row {
  return {
    id: c.id, scheme_code: c.schemeCode, scheme_name: c.schemeName, financial_year: c.financialYear, tier: c.tier,
    allocated: c.allocated, released: c.released, utilised: c.utilised, as_of: c.asOf, notes: c.notes,
    tenant_id: c.tenantId, created_at: c.createdAt, updated_at: c.updatedAt,
  }
}

function seed(): FundLedgerRecord[] {
  const now = "2026-06-10T00:00:00.000Z"
  const mk = (i: number, code: string, name: string, tier: FundTier, allocated: number, released: number, utilised: number): FundLedgerRecord => ({
    id: `demo-fund-${i}`, schemeCode: code, schemeName: name, financialYear: "2025-26", tier, allocated, released, utilised, asOf: "2026-06-10", notes: "", tenantId: DEFAULT_SCHOOL_NODE, createdAt: now, updatedAt: now,
  })
  return [
    // Whole rupees, aligned to the PFMS figures for each scheme code so reconciliation is meaningful:
    // four schemes agree within the 1% money tolerance; PUDHUMAI-PENN's local books show ~₹1.34 Cr
    // less released than PFMS (a ~4% drift), so the federation reconciliation surfaces a realistic
    // released-fund discrepancy to investigate.
    mk(1, "SAMAGRA-SHIKSHA", "Samagra Shiksha", "State", 390000000, 288600000, 199134000),
    mk(2, "PM-POSHAN", "PM POSHAN (Mid-Day Meal)", "State", 100000000, 65000000, 42250000),
    mk(3, "PUDHUMAI-PENN", "Pudhumai Penn Scheme", "State", 420000000, 310000000, 232848000),
    mk(4, "CM-BREAKFAST", "CM Breakfast Scheme", "State", 410000000, 311600000, 221236000),
    mk(5, "PM-SHRI", "PM SHRI Schools", "District", 350000000, 210000000, 136500000),
  ]
}

const store: FundLedgerRecord[] = seed()

export async function listFunds(): Promise<FundLedgerRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("scheme_fund_ledger").select("*").order("allocated", { ascending: false })
      const rows = ((data as Row[] | null) ?? []).map(fromRow)
      return rows.length > 0 ? rows : seed()
    } catch {
      return seed()
    }
  }
  return [...store]
}

export async function getFund(fid: string): Promise<FundLedgerRecord | undefined> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("scheme_fund_ledger").select("*").eq("id", fid).maybeSingle()
      if (data) return fromRow(data as Row)
    } catch {
      /* fall through */
    }
    return seed().find((c) => c.id === fid)
  }
  return store.find((c) => c.id === fid)
}

/** Latest local ledger row for a scheme code (the figure reconciliation compares to PFMS). */
export async function latestFundForScheme(schemeCode: string): Promise<FundLedgerRecord | undefined> {
  const all = await listFunds()
  return all
    .filter((r) => r.schemeCode.trim().toLowerCase() === schemeCode.trim().toLowerCase())
    .sort((a, b) => (a.asOf < b.asOf ? 1 : -1))[0]
}

export async function createFund(input: FundLedgerInput, tenantId = DEFAULT_SCHOOL_NODE): Promise<FundLedgerRecord> {
  const now = new Date().toISOString()
  const c: FundLedgerRecord = { id: id(), ...input, tenantId, createdAt: now, updatedAt: now }
  const db = getDb()
  if (db) await db.from("scheme_fund_ledger").insert(toRow(c))
  else store.unshift(c)
  await appendAudit({ actor: "finance", action: "fund.create", resource: c.id, details: { scheme: c.schemeCode, allocated: c.allocated } })
  return c
}

export async function updateFund(fid: string, input: FundLedgerInput): Promise<FundLedgerRecord | undefined> {
  const existing = await getFund(fid)
  if (!existing) return undefined
  const updated: FundLedgerRecord = { ...existing, ...input, updatedAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("scheme_fund_ledger").update({
      scheme_code: updated.schemeCode, scheme_name: updated.schemeName, financial_year: updated.financialYear, tier: updated.tier,
      allocated: updated.allocated, released: updated.released, utilised: updated.utilised, as_of: updated.asOf, notes: updated.notes, updated_at: updated.updatedAt,
    }).eq("id", fid)
  } else {
    const i = store.findIndex((c) => c.id === fid)
    if (i >= 0) store[i] = updated
  }
  await appendAudit({ actor: "finance", action: "fund.update", resource: fid, details: { utilised: updated.utilised } })
  return updated
}

export async function deleteFund(fid: string): Promise<boolean> {
  const db = getDb()
  if (db) {
    await db.from("scheme_fund_ledger").delete().eq("id", fid)
  } else {
    const i = store.findIndex((c) => c.id === fid)
    if (i < 0) return false
    store.splice(i, 1)
  }
  await appendAudit({ actor: "finance", action: "fund.delete", resource: fid })
  return true
}

export async function seedFunds(): Promise<number> {
  const rows = seed()
  const db = getDb()
  if (db) {
    for (const c of rows) await db.from("scheme_fund_ledger").upsert(toRow(c))
  } else {
    for (const c of rows) if (!store.some((s) => s.id === c.id)) store.push(c)
  }
  await appendAudit({ actor: "finance", action: "fund.seed", resource: "scheme_fund_ledger", details: { count: rows.length } })
  return rows.length
}
