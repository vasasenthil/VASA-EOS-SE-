"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileForum, actOnForum, listForums, type NewForum, type ForumFlowRecord } from "@/lib/forumflow/store"
import type { Decision } from "@/lib/workflow"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listForumsAction(): Promise<ForumFlowRecord[]> {
  noStore()
  try {
    return await listForums()
  } catch (e) {
    logger.error("forumflow.list failed", { error: String(e) })
    return []
  }
}

export async function fileForumAction(input: NewForum): Promise<ForumFlowRecord | null> {
  if (!(await canDo("manage:governance"))) return null
  try {
    const rec = await fileForum(input)
    revalidatePath("/governance/forums")
    return rec
  } catch (e) {
    logger.error("forumflow.file failed", { error: String(e) })
    return null
  }
}

export async function decideForumAction(input: {
  id: string
  actorRole: string
  actor: string
  decision: Decision
  note?: string
}): Promise<{ ok: boolean; record?: ForumFlowRecord; reason?: string }> {
  if (!(await canDo("manage:governance"))) {
    return { ok: false, reason: "You do not have permission to act on forum resolutions." }
  }
  try {
    const res = await actOnForum(input.id, { actorRole: input.actorRole, actor: input.actor, decision: input.decision, note: input.note })
    revalidatePath("/governance/forums")
    return res
  } catch (e) {
    logger.error("forumflow.decide failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
