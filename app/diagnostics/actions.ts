"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listDiagnostics, getDiagnostic, createDiagnostic, updateDiagnostic, deleteDiagnostic, seedDiagnostics } from "@/lib/diagnostics/store"
import { queryDiagnostics, validateDiagnostic, type Diagnostic, type DiagnosticInput, type DiagnosticFilters, type DiagnosticPage } from "@/lib/diagnostics"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listDiagnosticsAction(filters: DiagnosticFilters = {}): Promise<DiagnosticPage> {
  noStore()
  try {
    return queryDiagnostics(await listDiagnostics(), filters)
  } catch (e) {
    logger.error("diagnostics.list failed", { error: String(e) })
    return { diagnostics: [], total: 0, totalPages: 1, page: 1, pageSize: 9, summary: { total: 0, needingRemediation: 0, approved: 0, completed: 0 } }
  }
}

export async function getDiagnosticAction(id: string): Promise<Diagnostic | null> {
  noStore()
  try {
    return (await getDiagnostic(id)) ?? null
  } catch (e) {
    logger.error("diagnostics.get failed", { error: String(e) })
    return null
  }
}

export async function createDiagnosticAction(input: DiagnosticInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage diagnostics." }
  const v = validateDiagnostic(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const d = await createDiagnostic(input)
    revalidatePath("/diagnostics")
    return { ok: true, id: d.id }
  } catch (e) {
    logger.error("diagnostics.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateDiagnosticAction(id: string, input: DiagnosticInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage diagnostics." }
  const v = validateDiagnostic(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateDiagnostic(id, input)
    if (!updated) return { ok: false, reason: "Diagnostic not found." }
    revalidatePath("/diagnostics")
    revalidatePath(`/diagnostics/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("diagnostics.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteDiagnosticAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage diagnostics." }
  try {
    const ok = await deleteDiagnostic(id)
    revalidatePath("/diagnostics")
    return { ok }
  } catch (e) {
    logger.error("diagnostics.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedDiagnosticsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed diagnostics." }
  try {
    const count = await seedDiagnostics()
    revalidatePath("/diagnostics")
    return { ok: true, count }
  } catch (e) {
    logger.error("diagnostics.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
