"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { registerAlumnus, deleteAlumnus, listAlumni, type NewAlumnus } from "@/lib/alumni/store"
import type { Alumnus } from "@/lib/alumni"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listAlumniAction(): Promise<Alumnus[]> {
  noStore()
  try {
    // Per-role data scoping: alumni roll up by alma-mater jurisdiction subtree.
    return await scopeForCurrentSubject(await listAlumni())
  } catch (e) {
    logger.error("alumni.list failed", { error: String(e) })
    return []
  }
}

export async function registerAlumnusAction(input: NewAlumnus): Promise<Alumnus | null> {
  try {
    const a = await registerAlumnus(input)
    revalidatePath("/alumni")
    return a
  } catch (e) {
    logger.error("alumni.register failed", { error: String(e) })
    return null
  }
}
