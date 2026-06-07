"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { publishNotice, setPinned, deleteNotice, listNotices, type NewNotice } from "@/lib/notices/store"
import type { Notice } from "@/lib/notices"
import { logger } from "@/lib/logger"

export async function listNoticesAction(): Promise<Notice[]> {
  noStore()
  try {
    return await listNotices()
  } catch (e) {
    logger.error("notice.list failed", { error: String(e) })
    return []
  }
}

export async function publishNoticeAction(input: NewNotice): Promise<Notice | null> {
  try {
    const n = await publishNotice(input)
    revalidatePath("/notices")
    return n
  } catch (e) {
    logger.error("notice.publish failed", { error: String(e) })
    return null
  }
}

export async function setPinnedAction(id: string, pinned: boolean): Promise<Notice | null> {
  try {
    const n = await setPinned(id, pinned)
    revalidatePath("/notices")
    return n ?? null
  } catch (e) {
    logger.error("notice.pin failed", { error: String(e) })
    return null
  }
}

export async function deleteNoticeAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteNotice(id)
    revalidatePath("/notices")
    return ok
  } catch (e) {
    logger.error("notice.delete failed", { error: String(e) })
    return false
  }
}
