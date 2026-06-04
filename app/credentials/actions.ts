"use server"

import { listCredentials, mintCredential, verifyById, type MintInput } from "@/lib/credentials/store"
import type { VerifiableCredential, VerificationResult } from "@/lib/credentials"

export async function mintAction(input: MintInput): Promise<VerifiableCredential> {
  return mintCredential(input)
}

export async function listAction(): Promise<VerifiableCredential[]> {
  return listCredentials()
}

export async function verifyAction(id: string): Promise<VerificationResult> {
  return verifyById(id)
}
