// In-memory issued-credential store + mint logic (demo). Production persists to an
// append-only registry and anchors to chain; here we anchor to the audit ledger.

import { appendAudit } from "@/lib/audit/trail"
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

export function mintCredential(input: MintInput): VerifiableCredential {
  counter += 1
  const id = `vc-${counter.toString().padStart(4, "0")}`
  const issuedAt = new Date().toISOString()
  const anchor = appendAudit({
    actor: input.issuer,
    action: "credential.mint",
    resource: `${id}:${input.apaarId}`,
    details: { kind: input.kind, title: input.title },
  })
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
  store.push(credential)
  return credential
}

export function listCredentials(): VerifiableCredential[] {
  return [...store].reverse()
}

export function verifyById(id: string): VerificationResult {
  const c = store.find((x) => x.id === id)
  if (!c) return { valid: false, reason: "Credential not found in registry." }
  return verifyCredential(c)
}
