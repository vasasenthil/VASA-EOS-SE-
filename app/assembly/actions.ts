"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createAssembly, deleteAssembly, listAssemblies, type NewAssembly } from "@/lib/assembly/store"
import type { Assembly } from "@/lib/assembly"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listAssembliesAction(): Promise<Assembly[]> {
  noStore()
  try {
    // Per-role data scoping: assembly logs roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listAssemblies())
  } catch (e) {
    logger.error("assembly.list failed", { error: String(e) })
    return []
  }
}

export async function createAssemblyAction(input: NewAssembly): Promise<Assembly | null> {
  try {
    const a = await createAssembly(input)
    revalidatePath("/assembly")
    return a
  } catch (e) {
    logger.error("assembly.create failed", { error: String(e) })
    return null
  }
}

export async function deleteAssemblyAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteAssembly(id)
    revalidatePath("/assembly")
    return ok
  } catch (e) {
    logger.error("assembly.delete failed", { error: String(e) })
    return false
  }
}
