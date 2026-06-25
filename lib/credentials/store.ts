// In-memory + Supabase issued-credential store and mint logic.
// Persists to Supabase when configured (anchored to the audit ledger); falls back
// to an in-memory store otherwise so demo/CI works without a database.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import {
  canonicalBody,
  credentialHash,
  verifyCredential,
  type CredentialKind,
  type VerifiableCredential,
  type VerificationResult,
} from "./index"

const store: VerifiableCredential[] = []
let counter = 0

export interface MintInput {
  apaarId: string
  kind: CredentialKind
  title: string
  issuer: string
}

interface CredentialRow {
  id: string
  apaar_id: string
  kind: CredentialKind
  title: string
  issuer: string
  issued_at: string
  soulbound: boolean
  content_hash: string
  anchor_seq: number
  revoked?: boolean
  revoked_at?: string | null
  revoke_reason?: string | null
}

function fromRow(r: CredentialRow): VerifiableCredential {
  return {
    id: r.id,
    apaarId: r.apaar_id,
    kind: r.kind,
    title: r.title,
    issuer: r.issuer,
    issuedAt: r.issued_at,
    soulbound: true,
    contentHash: r.content_hash,
    anchorSeq: r.anchor_seq,
    revoked: r.revoked ?? false,
    revokedAt: r.revoked_at ?? "",
    revokeReason: r.revoke_reason ?? "",
  }
}

export async function mintCredential(input: MintInput): Promise<VerifiableCredential> {
  const issuedAt = new Date().toISOString()
  const anchor = await appendAudit({
    actor: input.issuer,
    action: "credential.mint",
    resource: `${input.apaarId}`,
    details: { kind: input.kind, title: input.title },
  })
  const db = getDb()
  const id = db ? `vc-${anchor.seq.toString().padStart(4, "0")}` : `vc-${(++counter).toString().padStart(4, "0")}`
  const base = {
    id,
    apaarId: input.apaarId,
    kind: input.kind,
    title: input.title,
    issuer: input.issuer,
    issuedAt,
    soulbound: true as const,
    anchorSeq: anchor.seq,
  }
  const credential: VerifiableCredential = { ...base, contentHash: credentialHash(canonicalBody(base)) }
  if (db) {
    await db.from("verifiable_credentials").insert({
      id: credential.id,
      apaar_id: credential.apaarId,
      kind: credential.kind,
      title: credential.title,
      issuer: credential.issuer,
      issued_at: credential.issuedAt,
      soulbound: true,
      content_hash: credential.contentHash,
      anchor_seq: credential.anchorSeq,
    })
  } else {
    store.push(credential)
  }
  return credential
}

export async function listCredentials(): Promise<VerifiableCredential[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("verifiable_credentials").select("*").order("anchor_seq", { ascending: false })
      return ((data as CredentialRow[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store].reverse()
}

export async function verifyById(id: string): Promise<VerificationResult> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("verifiable_credentials").select("*").eq("id", id).maybeSingle()
    if (!data) return { valid: false, reason: "Credential not found in registry." }
    return verifyCredential(fromRow(data as CredentialRow))
  }
  const c = store.find((x) => x.id === id)
  if (!c) return { valid: false, reason: "Credential not found in registry." }
  return verifyCredential(c)
}

export async function getCredential(id: string): Promise<VerifiableCredential | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("verifiable_credentials").select("*").eq("id", id).maybeSingle()
    return data ? fromRow(data as CredentialRow) : undefined
  }
  return store.find((x) => x.id === id)
}

/**
 * Revoke an authentically-minted credential (append-only — the mint and its content hash are NEVER
 * altered, so authenticity still verifies; revocation is recorded as a separate, audited fact).
 */
export async function revokeCredential(id: string, reason: string): Promise<VerifiableCredential | undefined> {
  const revokedAt = new Date().toISOString()
  const db = getDb()
  if (db) {
    const { data } = await db.from("verifiable_credentials").select("*").eq("id", id).maybeSingle()
    if (!data) return undefined
    await db.from("verifiable_credentials").update({ revoked: true, revoked_at: revokedAt, revoke_reason: reason }).eq("id", id)
    await appendAudit({ actor: "registrar", action: "credential.revoke", resource: id, details: { reason } })
    return { ...fromRow(data as CredentialRow), revoked: true, revokedAt, revokeReason: reason }
  }
  const c = store.find((x) => x.id === id)
  if (!c) return undefined
  c.revoked = true
  c.revokedAt = revokedAt
  c.revokeReason = reason
  await appendAudit({ actor: "registrar", action: "credential.revoke", resource: id, details: { reason } })
  return c
}

/** Seed a few demo credentials (idempotent) so the registry has data without minting on every load. */
export async function seedCredentials(): Promise<number> {
  const demos: MintInput[] = [
    { apaarId: "100200300401", kind: "transcript", title: "Class X Marksheet — 2025-26", issuer: "Directorate of Government Examinations, TN" },
    { apaarId: "100200300401", kind: "micro-credential", title: "Foundational Numeracy — NIPUN Bharat", issuer: "Directorate of School Education, TN" },
    { apaarId: "100200300402", kind: "certificate", title: "School Leaving Certificate", issuer: "GHSS Egmore" },
    { apaarId: "100200300403", kind: "badge", title: "State Science Fair — Merit", issuer: "DTERT, TN" },
  ]
  const existing = await listCredentials()
  if (existing.length >= demos.length) return 0
  let n = 0
  for (const d of demos) {
    if (!existing.some((c) => c.apaarId === d.apaarId && c.title === d.title)) {
      await mintCredential(d)
      n++
    }
  }
  return n
}
