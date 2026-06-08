"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createProject, scoreProject, deleteProject, listProjects, type NewProject } from "@/lib/sciencefair/store"
import type { SfProject } from "@/lib/sciencefair"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listProjectsAction(): Promise<SfProject[]> {
  noStore()
  try {
    // Per-role data scoping: science projects roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listProjects())
  } catch (e) {
    logger.error("sf.list failed", { error: String(e) })
    return []
  }
}

export async function createProjectAction(input: NewProject): Promise<SfProject | null> {
  try {
    const p = await createProject(input)
    revalidatePath("/science-fair")
    return p
  } catch (e) {
    logger.error("sf.create failed", { error: String(e) })
    return null
  }
}

export async function scoreProjectAction(id: string, score: number): Promise<SfProject | null> {
  try {
    const p = await scoreProject(id, score)
    revalidatePath("/science-fair")
    return p ?? null
  } catch (e) {
    logger.error("sf.score failed", { error: String(e) })
    return null
  }
}

export async function deleteProjectAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteProject(id)
    revalidatePath("/science-fair")
    return ok
  } catch (e) {
    logger.error("sf.delete failed", { error: String(e) })
    return false
  }
}
