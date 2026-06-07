"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { savePaper, listPapers, type NewPaper, type PaperSnapshot } from "@/lib/question-bank/store"
import { logger } from "@/lib/logger"

export async function listPapersAction(): Promise<PaperSnapshot[]> {
  noStore()
  try {
    return await listPapers()
  } catch (e) {
    logger.error("paper.list failed", { error: String(e) })
    return []
  }
}

export async function savePaperAction(input: NewPaper): Promise<PaperSnapshot | null> {
  try {
    const p = await savePaper(input)
    revalidatePath("/question-bank")
    return p
  } catch (e) {
    logger.error("paper.save failed", { error: String(e) })
    return null
  }
}
