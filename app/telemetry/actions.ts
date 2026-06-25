"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listReadings, ingestReading, seedReadings } from "@/lib/iot/store"
import { queryReadings, validateReading, type IotReadingInput, type IotFilters, type IotPage } from "@/lib/iot"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listReadingsAction(filters: IotFilters = {}): Promise<IotPage> {
  noStore()
  try {
    return queryReadings(await listReadings(), filters)
  } catch (e) {
    logger.error("iot.list failed", { error: String(e) })
    return { readings: [], total: 0, totalPages: 1, page: 1, pageSize: 12, summary: { total: 0, devices: 0, normal: 0, warning: 0, critical: 0 } }
  }
}

export async function ingestReadingAction(input: IotReadingInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to ingest telemetry." }
  const v = validateReading(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const r = await ingestReading(input)
    revalidatePath("/telemetry")
    return { ok: true, id: r.id }
  } catch (e) {
    logger.error("iot.ingest failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedReadingsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed telemetry." }
  try {
    const count = await seedReadings()
    revalidatePath("/telemetry")
    return { ok: true, count }
  } catch (e) {
    logger.error("iot.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
