"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { saveSheet, listSheets, type NewSheet, type SavedSheet } from "@/lib/staff-attendance/store"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listSheetsAction(): Promise<SavedSheet[]> {
  noStore()
  try {
    // Per-role data scoping: staff-attendance sheets roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listSheets())
  } catch (e) {
    logger.error("staff-attendance.list failed", { error: String(e) })
    return []
  }
}

export async function saveSheetAction(input: NewSheet): Promise<SavedSheet | null> {
  try {
    const s = await saveSheet(input)
    revalidatePath("/staff-attendance")
    return s
  } catch (e) {
    logger.error("staff-attendance.save failed", { error: String(e) })
    return null
  }
}
