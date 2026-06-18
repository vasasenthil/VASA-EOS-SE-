"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listAssets, getAsset, createAsset, updateAsset, deleteAsset, seedAssets } from "@/lib/assetmgmt/store"
import { queryAssets, validateAsset, type AssetItem, type AssetInput, type AssetFilters, type AssetPage } from "@/lib/assetmgmt"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listAssetsAction(filters: AssetFilters = {}): Promise<AssetPage> {
  noStore()
  try {
    return queryAssets(await listAssets(), filters)
  } catch (e) {
    logger.error("assetmgmt.list failed", { error: String(e) })
    return { items: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { items: 0, quantity: 0, purchaseValue: 0, bookValue: 0, lowStock: 0, underRepair: 0 } }
  }
}

export async function getAssetAction(id: string): Promise<AssetItem | null> {
  noStore()
  try {
    return (await getAsset(id)) ?? null
  } catch (e) {
    logger.error("assetmgmt.get failed", { error: String(e) })
    return null
  }
}

export async function createAssetAction(input: AssetInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the asset register." }
  const v = validateAsset(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const a = await createAsset(input)
    revalidatePath("/asset-register")
    return { ok: true, id: a.id }
  } catch (e) {
    logger.error("assetmgmt.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateAssetAction(id: string, input: AssetInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the asset register." }
  const v = validateAsset(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateAsset(id, input)
    if (!updated) return { ok: false, reason: "Asset not found." }
    revalidatePath("/asset-register")
    revalidatePath(`/asset-register/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("assetmgmt.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteAssetAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the asset register." }
  try {
    const ok = await deleteAsset(id)
    revalidatePath("/asset-register")
    return { ok }
  } catch (e) {
    logger.error("assetmgmt.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedAssetsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed the asset register." }
  try {
    const count = await seedAssets()
    revalidatePath("/asset-register")
    return { ok: true, count }
  } catch (e) {
    logger.error("assetmgmt.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
