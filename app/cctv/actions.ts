"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createCamera, setCameraWorking, deleteCamera, listCameras, type NewCamera } from "@/lib/cctv/store"
import type { Camera } from "@/lib/cctv"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listCamerasAction(): Promise<Camera[]> {
  noStore()
  try {
    // Per-role data scoping: camera health rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listCameras())
  } catch (e) {
    logger.error("cctv.list failed", { error: String(e) })
    return []
  }
}

export async function createCameraAction(input: NewCamera): Promise<Camera | null> {
  try {
    const c = await createCamera(input)
    revalidatePath("/cctv")
    return c
  } catch (e) {
    logger.error("cctv.create failed", { error: String(e) })
    return null
  }
}

export async function setCameraWorkingAction(id: string, working: boolean): Promise<Camera | null> {
  try {
    const c = await setCameraWorking(id, working)
    revalidatePath("/cctv")
    return c ?? null
  } catch (e) {
    logger.error("cctv.status failed", { error: String(e) })
    return null
  }
}

export async function deleteCameraAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteCamera(id)
    revalidatePath("/cctv")
    return ok
  } catch (e) {
    logger.error("cctv.delete failed", { error: String(e) })
    return false
  }
}
