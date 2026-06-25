"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { addBeneficiary, advanceBeneficiary, deleteBeneficiary, listBeneficiaries, type NewScholar } from "@/lib/scholarship/store"
import type { ScholarRow } from "@/lib/scholarship"
import { canDo } from "@/lib/access/guard"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listBeneficiariesAction(): Promise<ScholarRow[]> {
  noStore()
  try {
    // Per-role data scoping: scholarship beneficiaries roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listBeneficiaries())
  } catch (e) {
    logger.error("scholarship.list failed", { error: String(e) })
    return []
  }
}

export async function addBeneficiaryAction(input: NewScholar): Promise<ScholarRow | null> {
  try {
    const r = await addBeneficiary(input)
    revalidatePath("/scholarships")
    return r
  } catch (e) {
    logger.error("scholarship.add failed", { error: String(e) })
    return null
  }
}

export async function advanceBeneficiaryAction(id: string): Promise<ScholarRow | null> {
  if (!(await canDo("read:scheme"))) return null
  try {
    const r = await advanceBeneficiary(id)
    revalidatePath("/scholarships")
    return r ?? null
  } catch (e) {
    logger.error("scholarship.advance failed", { error: String(e) })
    return null
  }
}
