"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { addComplianceItem, setComplianceStatus, listCompliance, type NewComplianceItem, type ComplianceRecord } from "@/lib/compliance/checklist-store"
import type { ComplianceStatus } from "@/lib/compliance/checklist"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listComplianceAction(udiseCode?: string): Promise<ComplianceRecord[]> {
  noStore()
  try {
    return await listCompliance(udiseCode)
  } catch (e) {
    logger.error("compliance.list failed", { error: String(e) })
    return []
  }
}

export async function addComplianceItemAction(input: NewComplianceItem): Promise<{ ok: boolean; record?: ComplianceRecord; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage compliance items." }
  try {
    const record = await addComplianceItem(input)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok: true, record }
  } catch (e) {
    logger.error("compliance.add failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function setComplianceStatusAction(id: string, status: ComplianceStatus): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to update compliance items." }
  try {
    const ok = await setComplianceStatus(id, status)
    revalidatePath("/(dashboards)/principal/dashboard")
    return { ok }
  } catch (e) {
    logger.error("compliance.status failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
