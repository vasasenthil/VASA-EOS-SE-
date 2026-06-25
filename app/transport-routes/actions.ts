"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listRoutes, getRoute, createRoute, updateRoute, deleteRoute, seedRoutes } from "@/lib/transportmgmt/store"
import { queryRoutes, validateRoute, type TransportRoute, type TransportInput, type TransportFilters, type TransportPage } from "@/lib/transportmgmt"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listRoutesAction(filters: TransportFilters = {}): Promise<TransportPage> {
  noStore()
  try {
    return queryRoutes(await listRoutes(), filters)
  } catch (e) {
    logger.error("transport.list failed", { error: String(e) })
    return { routes: [], total: 0, totalPages: 1, page: 1, pageSize: 9, summary: { routes: 0, active: 0, capacity: 0, assigned: 0, freeSeats: 0, avgOccupancy: 0, overloaded: 0 } }
  }
}

export async function getRouteAction(id: string): Promise<TransportRoute | null> {
  noStore()
  try {
    return (await getRoute(id)) ?? null
  } catch (e) {
    logger.error("transport.get failed", { error: String(e) })
    return null
  }
}

export async function createRouteAction(input: TransportInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage transport." }
  const v = validateRoute(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const t = await createRoute(input)
    revalidatePath("/transport-routes")
    return { ok: true, id: t.id }
  } catch (e) {
    logger.error("transport.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateRouteAction(id: string, input: TransportInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage transport." }
  const v = validateRoute(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateRoute(id, input)
    if (!updated) return { ok: false, reason: "Route not found." }
    revalidatePath("/transport-routes")
    revalidatePath(`/transport-routes/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("transport.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteRouteAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage transport." }
  try {
    const ok = await deleteRoute(id)
    revalidatePath("/transport-routes")
    return { ok }
  } catch (e) {
    logger.error("transport.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedRoutesAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed transport." }
  try {
    const count = await seedRoutes()
    revalidatePath("/transport-routes")
    return { ok: true, count }
  } catch (e) {
    logger.error("transport.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
