// VASA-EOS(SE) — immutable audit trail primitive (tamper-evident by hash chaining).
// Each entry links to the previous via a hash, so any retroactive edit breaks the
// chain (the in-app analogue of the dossier's blockchain-anchored audit).
//
// Persistence: when a service-role Supabase client is configured the chain is
// stored in the `audit_trail` table and survives across requests; otherwise it
// uses an in-memory store (per server instance) so demo/CI works without a DB.

import { getDb } from "@/lib/persistence"
import { incr } from "@/lib/metrics"

export interface AuditEntry {
  seq: number
  ts: string
  actor: string
  action: string
  resource: string
  details?: Record<string, unknown>
  prevHash: string
  hash: string
}

// Pure, dependency-free string hash (FNV-1a, 32-bit hex) — safe in any runtime.
function hash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

const GENESIS = "00000000"

// Canonical body hashed for an entry — identical at append and verify time.
function bodyFor(e: {
  seq: number
  ts: string
  actor: string
  action: string
  resource: string
  details?: Record<string, unknown>
  prevHash: string
}): string {
  return JSON.stringify({
    seq: e.seq,
    ts: e.ts,
    actor: e.actor,
    action: e.action,
    resource: e.resource,
    details: e.details,
    prevHash: e.prevHash,
  })
}

// ---- in-memory fallback store ----
const trail: AuditEntry[] = []

interface AuditRow {
  seq: number
  ts: string
  actor: string
  action: string
  resource: string
  details: Record<string, unknown> | null
  prev_hash: string
  hash: string
}

function fromRow(r: AuditRow): AuditEntry {
  return {
    seq: r.seq,
    ts: r.ts,
    actor: r.actor,
    action: r.action,
    resource: r.resource,
    details: r.details ?? undefined,
    prevHash: r.prev_hash,
    hash: r.hash,
  }
}

export async function appendAudit(input: {
  actor: string
  action: string
  resource: string
  details?: Record<string, unknown>
}): Promise<AuditEntry> {
  // Observability: every audited mutation increments a metric (scraped at /api/metrics).
  incr("vasa_audit_events_total", { action: input.action })
  const db = getDb()
  const ts = new Date().toISOString()

  if (db) {
    const { data: last } = await db
      .from("audit_trail")
      .select("seq, hash")
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle()
    const seq = (last?.seq ?? 0) + 1
    const prevHash = last?.hash ?? GENESIS
    const entry: AuditEntry = { seq, ts, ...input, prevHash, hash: hash(bodyFor({ seq, ts, ...input, prevHash })) }
    await db.from("audit_trail").insert({
      seq: entry.seq,
      ts: entry.ts,
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource,
      details: entry.details ?? null,
      prev_hash: entry.prevHash,
      hash: entry.hash,
    })
    return entry
  }

  const prev = trail[trail.length - 1]
  const prevHash = prev ? prev.hash : GENESIS
  const seq = trail.length + 1
  const entry: AuditEntry = { seq, ts, ...input, prevHash, hash: hash(bodyFor({ seq, ts, ...input, prevHash })) }
  trail.push(entry)
  return entry
}

export async function getTrail(): Promise<AuditEntry[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("audit_trail").select("*").order("seq", { ascending: true })
    return ((data as AuditRow[] | null) ?? []).map(fromRow)
  }
  return [...trail]
}

/** Recompute the chain; returns false if any entry was tampered with. */
export async function verifyTrail(): Promise<boolean> {
  const entries = await getTrail()
  let prevHash = GENESIS
  for (const e of entries) {
    const recomputed = hash(bodyFor({ ...e, prevHash }))
    if (recomputed !== e.hash || e.prevHash !== prevHash) return false
    prevHash = e.hash
  }
  return true
}
