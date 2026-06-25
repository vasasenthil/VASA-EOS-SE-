"use server"

import { revalidatePath } from "next/cache"
import { listCredentials, mintCredential, verifyById, getCredential, revokeCredential, seedCredentials, type MintInput } from "@/lib/credentials/store"
import { verifyDetailed, type VerifiableCredential, type VerificationResult, type DetailedVerification } from "@/lib/credentials"
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
  const credential = await mintCredential(input)
  revalidatePath("/credentials")
  return { ok: true, credential }
}

export async function listAction(): Promise<VerifiableCredential[]> {
  return listCredentials()
}

export async function verifyAction(id: string): Promise<VerificationResult> {
  return verifyById(id)
}

export async function getCredentialAction(id: string): Promise<VerifiableCredential | null> {
  return (await getCredential(id)) ?? null
}

/** Verify a credential by token id with the richer authenticity/anchor/revocation report. */
export async function verifyDetailedAction(id: string): Promise<DetailedVerification | { notFound: true }> {
  const c = await getCredential(id)
  if (!c) return { notFound: true }
  return verifyDetailed(c)
}

export async function revokeAction(id: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  // Revocation is authority-only (deny-wins, fail-closed).
  const decision = can(await resolveSubject(), "issue:credential", { type: "credential", id })
  if (!decision.permitted) return { ok: false, error: `Not allowed: ${decision.reason}` }
  if (!reason.trim()) return { ok: false, error: "A revocation reason is required." }
  const updated = await revokeCredential(id, reason.trim())
  if (!updated) return { ok: false, error: "Credential not found." }
  revalidatePath("/credentials")
  revalidatePath(`/credentials/${id}`)
  return { ok: true }
}

export async function seedCredentialsAction(): Promise<{ ok: boolean; count?: number; error?: string }> {
  const decision = can(await resolveSubject(), "issue:credential", { type: "credential", id: "seed" })
  if (!decision.permitted) return { ok: false, error: `Not allowed: ${decision.reason}` }
  const count = await seedCredentials()
  revalidatePath("/credentials")
  return { ok: true, count }
}
