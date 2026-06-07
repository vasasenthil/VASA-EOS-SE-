"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { logIncident, resolveIncident, deleteIncident, listIncidents, type NewIncident } from "@/lib/discipline/store"
import type { Incident } from "@/lib/discipline"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listIncidentsAction(): Promise<Incident[]> {
  noStore()
  try {
    return await listIncidents()
  } catch (e) {
    logger.error("incident.list failed", { error: String(e) })
    return []
  }
}

export async function logIncidentAction(input: NewIncident): Promise<Incident | null> {
  if (!(await canDo("manage:school"))) return null
  try {
    const inc = await logIncident(input)
    revalidatePath("/discipline")
    return inc
  } catch (e) {
    logger.error("incident.log failed", { error: String(e) })
    return null
  }
}

export async function resolveIncidentAction(id: string): Promise<Incident | null> {
  if (!(await canDo("manage:school"))) return null
  try {
    const inc = await resolveIncident(id)
    revalidatePath("/discipline")
    return inc ?? null
  } catch (e) {
    logger.error("incident.resolve failed", { error: String(e) })
    return null
  }
}

export async function deleteIncidentAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteIncident(id)
    revalidatePath("/discipline")
    return ok
  } catch (e) {
    logger.error("incident.delete failed", { error: String(e) })
    return false
  }
}
