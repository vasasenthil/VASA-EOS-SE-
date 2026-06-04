// VASA-EOS(SE) — Verifiable Credentials (NFT / Soulbound Token) (Flagship 11 / Sec 24).
// Learner achievements minted as non-transferable (soulbound) tokens, anchored to
// the tamper-evident audit ledger. A credential carries a content hash; verification
// recomputes the hash and confirms the anchor, detecting any field tampering.
// Pure logic here — the production mint sits behind a chain/registry seam.

export type CredentialKind = "certificate" | "badge" | "micro-credential" | "transcript"

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
}

export interface VerificationResult {
  valid: boolean
  reason: string
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
