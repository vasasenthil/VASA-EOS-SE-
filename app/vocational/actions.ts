"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createEnrolment, certifyEnrolment, deleteEnrolment, listEnrolments, type NewEnrolment } from "@/lib/vocational/store"
import type { VocEnrolment } from "@/lib/vocational"
import { logger } from "@/lib/logger"

export async function listEnrolmentsAction(): Promise<VocEnrolment[]> {
  noStore()
  try {
    return await listEnrolments()
  } catch (e) {
    logger.error("voc.list failed", { error: String(e) })
    return []
  }
}

export async function createEnrolmentAction(input: NewEnrolment): Promise<VocEnrolment | null> {
  try {
    const en = await createEnrolment(input)
    revalidatePath("/vocational")
    return en
  } catch (e) {
    logger.error("voc.create failed", { error: String(e) })
    return null
  }
}

export async function certifyEnrolmentAction(id: string): Promise<VocEnrolment | null> {
  try {
    const en = await certifyEnrolment(id)
    revalidatePath("/vocational")
    return en ?? null
  } catch (e) {
    logger.error("voc.certify failed", { error: String(e) })
    return null
  }
}

export async function deleteEnrolmentAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteEnrolment(id)
    revalidatePath("/vocational")
    return ok
  } catch (e) {
    logger.error("voc.delete failed", { error: String(e) })
    return false
  }
}
