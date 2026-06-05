"use server"

import { listCredentials, mintCredential, verifyById, type MintInput } from "@/lib/credentials/store"
import type { VerifiableCredential, VerificationResult } from "@/lib/credentials"
import { can } from "@/lib/access/policy"
import { resolveSubject } from "@/lib/access/resolve"

export interface MintResult {
  ok: boolean
  credential?: VerifiableCredential
  error?: string
}

export async function mintAction(input: MintInput): Promise<MintResult> {
  // Issuing a verifiable credential is authority-only (deny-wins, fail-closed).
  const decision = can(await resolveSubject(), "issue:credential", { type: "credential", id: input.apaarId })
  if (!decision.permitted) return { ok: false, error: `Not allowed: ${decision.reason}` }
  return { ok: true, credential: await mintCredential(input) }
}

export async function listAction(): Promise<VerifiableCredential[]> {
  return listCredentials()
}

export async function verifyAction(id: string): Promise<VerificationResult> {
  return verifyById(id)
}
