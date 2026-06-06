"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createTest, deleteTest, listTests, type NewTest } from "@/lib/water/store"
import type { WaterTest } from "@/lib/water"
import { logger } from "@/lib/logger"

export async function listTestsAction(): Promise<WaterTest[]> {
  noStore()
  try {
    return await listTests()
  } catch (e) {
    logger.error("water.list failed", { error: String(e) })
    return []
  }
}

export async function createTestAction(input: NewTest): Promise<WaterTest | null> {
  try {
    const t = await createTest(input)
    revalidatePath("/water-quality")
    return t
  } catch (e) {
    logger.error("water.create failed", { error: String(e) })
    return null
  }
}

export async function deleteTestAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteTest(id)
    revalidatePath("/water-quality")
    return ok
  } catch (e) {
    logger.error("water.delete failed", { error: String(e) })
    return false
  }
}
