"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { fileTransfer, advanceTransfer, rejectTransfer, deleteTransfer, listTransfers, type NewTransfer } from "@/lib/postings/store"
import type { TransferRequest } from "@/lib/postings"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listTransfersAction(): Promise<TransferRequest[]> {
  noStore()
  try {
    return await listTransfers()
  } catch (e) {
    logger.error("transfer.list failed", { error: String(e) })
    return []
  }
}

export async function fileTransferAction(input: NewTransfer): Promise<TransferRequest | null> {
  try {
    const t = await fileTransfer(input)
    revalidatePath("/postings")
    return t
  } catch (e) {
    logger.error("transfer.file failed", { error: String(e) })
    return null
  }
}

export async function advanceTransferAction(id: string): Promise<TransferRequest | null> {
  if (!(await canDo("manage:staff"))) return null
  try {
    const t = await advanceTransfer(id)
    revalidatePath("/postings")
    return t ?? null
  } catch (e) {
    logger.error("transfer.advance failed", { error: String(e) })
    return null
  }
}

export async function rejectTransferAction(id: string): Promise<TransferRequest | null> {
  if (!(await canDo("manage:staff"))) return null
  try {
    const t = await rejectTransfer(id)
    revalidatePath("/postings")
    return t ?? null
  } catch (e) {
    logger.error("transfer.reject failed", { error: String(e) })
    return null
  }
}
