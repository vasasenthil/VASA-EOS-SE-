"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { createTrip, addConsent, deleteTrip, listTrips, type NewTrip } from "@/lib/excursions/store"
import type { Trip } from "@/lib/excursions"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listTripsAction(): Promise<Trip[]> {
  noStore()
  try {
    // Per-role data scoping: trips roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listTrips())
  } catch (e) {
    logger.error("excursions.list failed", { error: String(e) })
    return []
  }
}

export async function createTripAction(input: NewTrip): Promise<Trip | null> {
  try {
    const t = await createTrip(input)
    revalidatePath("/excursions")
    return t
  } catch (e) {
    logger.error("excursions.create failed", { error: String(e) })
    return null
  }
}

export async function addConsentAction(id: string): Promise<Trip | null> {
  try {
    const t = await addConsent(id)
    revalidatePath("/excursions")
    return t ?? null
  } catch (e) {
    logger.error("excursions.consent failed", { error: String(e) })
    return null
  }
}

export async function deleteTripAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteTrip(id)
    revalidatePath("/excursions")
    return ok
  } catch (e) {
    logger.error("excursions.delete failed", { error: String(e) })
    return false
  }
}
