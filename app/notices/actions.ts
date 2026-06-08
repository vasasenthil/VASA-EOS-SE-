"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { publishNotice, setPinned, deleteNotice, listNotices, type NewNotice } from "@/lib/notices/store"
import { type Notice, shouldSyndicate } from "@/lib/notices"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { integrations } from "@/lib/integrations"
import { logger } from "@/lib/logger"

export async function listNoticesAction(): Promise<Notice[]> {
  noStore()
  try {
    // Per-role data scoping: notices roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listNotices())
  } catch (e) {
    logger.error("notice.list failed", { error: String(e) })
    return []
  }
}

export async function publishNoticeAction(input: NewNotice): Promise<Notice | null> {
  try {
    const n = await publishNotice(input)
    // Best-effort syndication of public-facing notices to the TN Schools Portal.
    // Never blocks or fails the local publish; the portal port is mock by default
    // and a live adapter activates once INTEGRATION_TNPORTAL is configured.
    if (shouldSyndicate(n.audience)) {
      try {
        const res = await integrations.portal.publish({ kind: "notice", title: n.title, body: n.body })
        logger.info("notice.syndicate", { id: n.id, mode: res.mode, ok: res.ok, ref: res.data?.ref })
      } catch (e) {
        logger.warn("notice.syndicate failed", { id: n.id, error: String(e) })
      }
    }
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
