// VASA-EOS(SE) — immutable audit trail primitive (tamper-evident by hash chaining).
// Each entry links to the previous via a hash, so any retroactive edit breaks the
// chain (the in-app analogue of the dossier's blockchain-anchored audit). This is an
// in-memory mock store for demo; production persists to an append-only ledger.

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
const trail: AuditEntry[] = []

export function appendAudit(input: {
  actor: string
  action: string
  resource: string
  details?: Record<string, unknown>
}): AuditEntry {
  const prev = trail[trail.length - 1]
  const prevHash = prev ? prev.hash : GENESIS
  const seq = trail.length + 1
  const ts = new Date().toISOString()
  const body = JSON.stringify({ seq, ts, ...input, prevHash })
  const entry: AuditEntry = { seq, ts, ...input, prevHash, hash: hash(body) }
  trail.push(entry)
  return entry
}

export function getTrail(): AuditEntry[] {
  return [...trail]
}

/** Recompute the chain; returns false if any entry was tampered with. */
export function verifyTrail(): boolean {
  let prevHash = GENESIS
  for (const e of trail) {
    const body = JSON.stringify({
      seq: e.seq,
      ts: e.ts,
      actor: e.actor,
      action: e.action,
      resource: e.resource,
      details: e.details,
      prevHash,
    })
    if (hash(body) !== e.hash || e.prevHash !== prevHash) return false
    prevHash = e.hash
  }
  return true
}
