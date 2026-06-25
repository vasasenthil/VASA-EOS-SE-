"use server"

import {
  platformConfigured,
  platformReachable,
  platformAuditTrail,
  type PlatformAuditTrail,
} from "@/lib/platform-client"
import { logger } from "@/lib/logger"

export interface AuditQuery {
  actor?: string
  action?: string
  resource?: string
  effect?: string
  limit?: number
}

export async function backboneConnected(): Promise<boolean> {
  return platformReachable()
}

/** Read the durable hash-chained audit trail with a live integrity check. */
export async function getAuditTrail(filter: AuditQuery = {}): Promise<PlatformAuditTrail | null> {
  try {
    return await platformAuditTrail({ ...filter, limit: filter.limit ?? 100 })
  } catch (e) {
    logger.error("audit.trail failed", { error: String(e) })
    return null
  }
}
