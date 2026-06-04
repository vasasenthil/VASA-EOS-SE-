// VASA-EOS(SE) — DPDP consent ledger persistence (server-only).
// Persists to Supabase when configured; falls back to an in-memory store otherwise.
// Every grant/withdraw is written to the tamper-evident audit ledger.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import type { ConsentPurpose, ConsentRecord } from "./index"

interface ConsentRow {
  id: string
  subject_apaar: string
  purpose: ConsentPurpose
  actor: string
  status: "granted" | "withdrawn"
  ts: string
}

function fromRow(r: ConsentRow): ConsentRecord {
  return { id: r.id, subjectApaar: r.subject_apaar, purpose: r.purpose, actor: r.actor, status: r.status, ts: r.ts }
}

const store: ConsentRecord[] = []
function id(): string {
  return `cns-${Math.random().toString(36).slice(2, 10)}`
}

async function record(
  subjectApaar: string,
  purpose: ConsentPurpose,
  actor: string,
  status: "granted" | "withdrawn",
): Promise<ConsentRecord> {
  const rec: ConsentRecord = { id: id(), subjectApaar, purpose, actor, status, ts: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.from("consent_records").insert({
      id: rec.id,
      subject_apaar: rec.subjectApaar,
      purpose: rec.purpose,
      actor: rec.actor,
      status: rec.status,
      ts: rec.ts,
    })
  } else {
    store.push(rec)
  }
  await appendAudit({ actor, action: `consent.${status}`, resource: subjectApaar, details: { purpose } })
  return rec
}

export async function grantConsent(input: { subjectApaar: string; purpose: ConsentPurpose; actor: string }): Promise<ConsentRecord> {
  return record(input.subjectApaar, input.purpose, input.actor, "granted")
}

export async function withdrawConsent(input: { subjectApaar: string; purpose: ConsentPurpose; actor: string }): Promise<ConsentRecord> {
  return record(input.subjectApaar, input.purpose, input.actor, "withdrawn")
}

export async function listConsents(subjectApaar?: string): Promise<ConsentRecord[]> {
  const db = getDb()
  if (db) {
    let q = db.from("consent_records").select("*").order("ts", { ascending: true })
    if (subjectApaar) q = q.eq("subject_apaar", subjectApaar)
    const { data } = await q
    return ((data as ConsentRow[] | null) ?? []).map(fromRow)
  }
  return store.filter((r) => !subjectApaar || r.subjectApaar === subjectApaar)
}

/** Effective consent for a purpose — the most recent record wins. */
export async function hasConsent(subjectApaar: string, purpose: ConsentPurpose): Promise<boolean> {
  const recs = (await listConsents(subjectApaar)).filter((r) => r.purpose === purpose)
  return recs[recs.length - 1]?.status === "granted"
}
