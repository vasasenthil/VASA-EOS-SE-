"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { issueCertificate, listCertificates, type NewCertificate } from "@/lib/certificates/store"
import type { Certificate } from "@/lib/certificates"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listCertificatesAction(): Promise<Certificate[]> {
  noStore()
  try {
    // Per-role data scoping: certificate issuance rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listCertificates())
  } catch (e) {
    logger.error("certificate.list failed", { error: String(e) })
    return []
  }
}

export async function issueCertificateAction(input: NewCertificate): Promise<Certificate | null> {
  try {
    const c = await issueCertificate(input)
    revalidatePath("/certificates")
    return c
  } catch (e) {
    logger.error("certificate.issue failed", { error: String(e) })
    return null
  }
}
