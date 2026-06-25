"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listCases, getCase, createCase, updateCase, deleteCase, seedCases } from "@/lib/eligibility/store"
import { queryCases, validateCase, type EligibilityCase, type CaseInput, type CaseFilters, type CasePage } from "@/lib/eligibility"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listCasesAction(filters: CaseFilters = {}): Promise<CasePage> {
  noStore()
  try {
    return queryCases(await listCases(), filters)
  } catch (e) {
    logger.error("eligibility.list failed", { error: String(e) })
    return { cases: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, withConclusion: 0, approved: 0, pending: 0 } }
  }
}

export async function getCaseAction(id: string): Promise<EligibilityCase | null> {
  noStore()
  try {
    return (await getCase(id)) ?? null
  } catch (e) {
    logger.error("eligibility.get failed", { error: String(e) })
    return null
  }
}

export async function createCaseAction(input: CaseInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage eligibility cases." }
  const v = validateCase(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createCase(input)
    revalidatePath("/eligibility")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("eligibility.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateCaseAction(id: string, input: CaseInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage eligibility cases." }
  const v = validateCase(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateCase(id, input)
    if (!updated) return { ok: false, reason: "Case not found." }
    revalidatePath("/eligibility")
    revalidatePath(`/eligibility/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("eligibility.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteCaseAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage eligibility cases." }
  try {
    const ok = await deleteCase(id)
    revalidatePath("/eligibility")
    return { ok }
  } catch (e) {
    logger.error("eligibility.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedCasesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed eligibility cases." }
  try {
    const count = await seedCases()
    revalidatePath("/eligibility")
    return { ok: true, count }
  } catch (e) {
    logger.error("eligibility.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
