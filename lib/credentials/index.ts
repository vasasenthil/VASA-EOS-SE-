// VASA-EOS(SE) — Verifiable Credentials (NFT / Soulbound Token) (Flagship 11 / Sec 24).
// Learner achievements minted as non-transferable (soulbound) tokens, anchored to
// the tamper-evident audit ledger. A credential carries a content hash; verification
// recomputes the hash and confirms the anchor, detecting any field tampering.
// Pure logic here — the production mint sits behind a chain/registry seam.

export type CredentialKind = "certificate" | "badge" | "micro-credential" | "transcript"
export const CREDENTIAL_KINDS = ["certificate", "badge", "micro-credential", "transcript"] as const

export interface VerifiableCredential {
  id: string
  apaarId: string // holder (soulbound to this learner)
  kind: CredentialKind
  title: string
  issuer: string
  issuedAt: string
  soulbound: true // non-transferable by construction
  contentHash: string
  anchorSeq: number // sequence in the audit ledger this mint anchored to
  // Revocation is an APPEND-ONLY overlay: it never changes the minted content (so contentHash still
  // verifies as authentic) — it records that an authentically-minted credential is no longer valid.
  revoked?: boolean
  revokedAt?: string
  revokeReason?: string
}

export interface VerificationResult {
  valid: boolean
  reason: string
}

export type CredentialStatus = "Issued" | "Revoked"

export function isRevoked(c: VerifiableCredential): boolean {
  return c.revoked === true
}

export function credentialStatus(c: VerifiableCredential): CredentialStatus {
  return isRevoked(c) ? "Revoked" : "Issued"
}

// FNV-1a 32-bit hex — same primitive as the audit ledger, dependency-free.
export function credentialHash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

/** Canonical body hashed at mint time (excludes the hash itself). */
export function canonicalBody(c: Omit<VerifiableCredential, "contentHash">): string {
  return JSON.stringify({
    id: c.id,
    apaarId: c.apaarId,
    kind: c.kind,
    title: c.title,
    issuer: c.issuer,
    issuedAt: c.issuedAt,
    soulbound: c.soulbound,
    anchorSeq: c.anchorSeq,
  })
}

/** Recompute the content hash and confirm it matches — detects any tampering. */
export function verifyCredential(c: VerifiableCredential): VerificationResult {
  const recomputed = credentialHash(canonicalBody(c))
  if (recomputed !== c.contentHash) {
    return { valid: false, reason: "Content hash mismatch — credential was altered after minting." }
  }
  if (c.anchorSeq <= 0) {
    return { valid: false, reason: "Missing audit-ledger anchor." }
  }
  return { valid: true, reason: "Hash matches mint and anchor is present." }
}

export interface DetailedVerification {
  tokenId: string
  /** The content hash recomputed from the record matches the stored hash (mint is untampered). */
  authentic: boolean
  /** The minted credential is anchored to the tamper-evident audit ledger. */
  anchored: boolean
  revoked: boolean
  /** Authentic, anchored AND not revoked → currently valid for use. */
  valid: boolean
  contentHash: string
  recomputed: string
  anchorSeq: number
  reasons: string[]
}

/**
 * Richer verification for the holder/relying-party surface: separates authenticity (the mint is
 * untampered and anchored) from validity (it is also not revoked). A revoked credential is still
 * authentic — that fact is reported, not hidden.
 */
export function verifyDetailed(c: VerifiableCredential): DetailedVerification {
  const recomputed = credentialHash(canonicalBody(c))
  const authentic = recomputed === c.contentHash
  const anchored = c.anchorSeq > 0
  const revoked = isRevoked(c)
  const reasons: string[] = []
  if (!authentic) reasons.push("Content hash mismatch — the credential was altered after minting.")
  if (!anchored) reasons.push("Missing audit-ledger anchor.")
  if (revoked) reasons.push(`Revoked${c.revokeReason ? `: ${c.revokeReason}` : ""}.`)
  if (authentic && anchored && !revoked) reasons.push("Authentic, anchored and active — verifies against the mint record.")
  return { tokenId: c.id, authentic, anchored, revoked, valid: authentic && anchored && !revoked, contentHash: c.contentHash, recomputed, anchorSeq: c.anchorSeq, reasons }
}

export interface CredentialSummary {
  total: number
  issued: number
  revoked: number
  /** Distinct learners holding at least one credential. */
  holders: number
}

export function credentialSummary(all: VerifiableCredential[]): CredentialSummary {
  return {
    total: all.length,
    issued: all.filter((c) => !isRevoked(c)).length,
    revoked: all.filter((c) => isRevoked(c)).length,
    holders: new Set(all.map((c) => c.apaarId)).size,
  }
}

export interface CredentialFilters {
  query?: string
  kind?: string
  status?: string
}

export function queryCredentials(all: VerifiableCredential[], f: CredentialFilters = {}): VerifiableCredential[] {
  const q = (f.query ?? "").trim().toLowerCase()
  return all.filter((c) => {
    if (q && !(`${c.title} ${c.apaarId} ${c.id} ${c.issuer}`.toLowerCase().includes(q))) return false
    if (f.kind && c.kind !== f.kind) return false
    if (f.status && credentialStatus(c) !== f.status) return false
    return true
  })
}
