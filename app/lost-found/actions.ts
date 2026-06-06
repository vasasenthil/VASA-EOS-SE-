"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createItem, claimItem, deleteItem, listItems, type NewItem } from "@/lib/lostfound/store"
import type { LostItem } from "@/lib/lostfound"
import { logger } from "@/lib/logger"

export async function listItemsAction(): Promise<LostItem[]> {
  noStore()
  try {
    return await listItems()
  } catch (e) {
    logger.error("lostfound.list failed", { error: String(e) })
    return []
  }
}

export async function createItemAction(input: NewItem): Promise<LostItem | null> {
  try {
    const it = await createItem(input)
    revalidatePath("/lost-found")
    return it
  } catch (e) {
    logger.error("lostfound.create failed", { error: String(e) })
    return null
  }
}

export async function claimItemAction(id: string): Promise<LostItem | null> {
  try {
    const it = await claimItem(id)
    revalidatePath("/lost-found")
    return it ?? null
  } catch (e) {
    logger.error("lostfound.claim failed", { error: String(e) })
    return null
  }
}

export async function deleteItemAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteItem(id)
    revalidatePath("/lost-found")
    return ok
  } catch (e) {
    logger.error("lostfound.delete failed", { error: String(e) })
    return false
  }
}
