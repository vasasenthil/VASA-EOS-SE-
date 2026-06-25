"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileLeave, decideLeave, deleteLeave, listLeave, type NewLeave } from "@/lib/leave/store"
import type { LeaveRequest, LeaveStatus } from "@/lib/leave"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listLeaveAction(): Promise<LeaveRequest[]> {
  noStore()
  try {
    return await listLeave()
  } catch (e) {
    logger.error("leave.list failed", { error: String(e) })
    return []
  }
}

export async function fileLeaveAction(input: NewLeave): Promise<LeaveRequest | null> {
  try {
    const r = await fileLeave(input)
    revalidatePath("/leave")
    return r
  } catch (e) {
    logger.error("leave.file failed", { error: String(e) })
    return null
  }
}

export async function decideLeaveAction(id: string, status: LeaveStatus): Promise<LeaveRequest | null> {
  if (!(await canDo("manage:staff"))) return null
  try {
    const r = await decideLeave(id, status)
    revalidatePath("/leave")
    return r ?? null
  } catch (e) {
    logger.error("leave.decide failed", { error: String(e) })
    return null
  }
}

export async function deleteLeaveAction(id: string): Promise<boolean> {
  if (!(await canDo("manage:staff"))) return false
  try {
    const ok = await deleteLeave(id)
    revalidatePath("/leave")
    return ok
  } catch (e) {
    logger.error("leave.delete failed", { error: String(e) })
    return false
  }
}
