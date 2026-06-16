"use server"

import { unstable_noStore as noStore } from "next/cache"
import { integrations, integrationModes } from "@/lib/integrations"
import type { PfmsSanction } from "@/lib/integrations/types"
import { logger } from "@/lib/logger"

export interface SanctionLookupResult {
  ok: boolean
  sanction?: PfmsSanction
  mode: "mock" | "live"
  traceId?: string
  error?: string
}

/** Look up a single PFMS sanction by id through the federation port (read-only). */
export async function lookupSanctionAction(sanctionId: string): Promise<SanctionLookupResult> {
  noStore()
  const id = sanctionId.trim()
  if (!id) return { ok: false, mode: integrationModes.pfms, error: "Enter a sanction id." }
  try {
    const r = await integrations.pfms.getSanction(id)
    if (!r.ok) return { ok: false, mode: r.mode, traceId: r.traceId, error: r.error ?? "Lookup failed." }
    return { ok: true, sanction: r.data, mode: r.mode, traceId: r.traceId }
  } catch (e) {
    logger.error("pfms.sanction-lookup failed", { error: String(e) })
    return { ok: false, mode: integrationModes.pfms, error: "Server error." }
  }
}
