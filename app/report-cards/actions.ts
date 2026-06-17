"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listReportCards, getReportCard, createReportCard, updateReportCard, deleteReportCard, seedReportCards } from "@/lib/reportcards/store"
import { queryReportCards, validateReportCard, type ReportCard, type ReportCardInput, type ReportCardFilters, type ReportCardPage } from "@/lib/reportcards"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listReportCardsAction(filters: ReportCardFilters = {}): Promise<ReportCardPage> {
  noStore()
  try {
    return queryReportCards(await listReportCards(), filters)
  } catch (e) {
    logger.error("reportcards.list failed", { error: String(e) })
    return { cards: [], total: 0, totalPages: 1, page: 1, pageSize: 10 }
  }
}

export async function getReportCardAction(id: string): Promise<ReportCard | null> {
  noStore()
  try {
    return (await getReportCard(id)) ?? null
  } catch (e) {
    logger.error("reportcards.get failed", { error: String(e) })
    return null
  }
}

export async function createReportCardAction(input: ReportCardInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage report cards." }
  const v = validateReportCard(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createReportCard(input)
    revalidatePath("/report-cards")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("reportcards.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateReportCardAction(id: string, input: ReportCardInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage report cards." }
  const v = validateReportCard(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateReportCard(id, input)
    if (!updated) return { ok: false, reason: "Report card not found." }
    revalidatePath("/report-cards")
    revalidatePath(`/report-cards/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("reportcards.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteReportCardAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage report cards." }
  try {
    const ok = await deleteReportCard(id)
    revalidatePath("/report-cards")
    return { ok }
  } catch (e) {
    logger.error("reportcards.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedReportCardsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed report cards." }
  try {
    const count = await seedReportCards()
    revalidatePath("/report-cards")
    return { ok: true, count }
  } catch (e) {
    logger.error("reportcards.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
