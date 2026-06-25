"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listKpis, getKpi, createKpi, updateKpi, deleteKpi, seedKpis } from "@/lib/rollup/store"
import { aggregate, groupBy, flagged, districtsOf, validateKpi, type SchoolKpi, type KpiInput, type AggregateKpi } from "@/lib/rollup"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export interface RollupView {
  level: "State" | "District" | "Block"
  state: AggregateKpi
  units: AggregateKpi[] // districts, or blocks within a district
  schools: SchoolKpi[] // schools within a block (when drilled to block)
  flaggedUnits: AggregateKpi[]
  districts: string[]
  district?: string
  block?: string
}

/** Resolve the roll-up at the requested drill level (State → District → Block → School). */
export async function rollupAction(district?: string, block?: string): Promise<RollupView> {
  noStore()
  try {
    const all = await listKpis()
    const state = aggregate("Tamil Nadu", all)
    const districts = districtsOf(all)
    if (district && block) {
      const schools = all.filter((k) => k.district === district && k.block === block)
      return { level: "Block", state, units: [], schools, flaggedUnits: [], districts, district, block }
    }
    if (district) {
      const inDistrict = all.filter((k) => k.district === district)
      const blocks = groupBy(inDistrict, "block")
      return { level: "District", state, units: blocks, schools: [], flaggedUnits: flagged(blocks), districts, district }
    }
    const byDistrict = groupBy(all, "district")
    return { level: "State", state, units: byDistrict, schools: [], flaggedUnits: flagged(byDistrict), districts }
  } catch (e) {
    logger.error("rollup.view failed", { error: String(e) })
    const empty = aggregate("Tamil Nadu", [])
    return { level: "State", state: empty, units: [], schools: [], flaggedUnits: [], districts: [] }
  }
}

export async function getKpiAction(id: string): Promise<SchoolKpi | null> {
  noStore()
  try {
    return (await getKpi(id)) ?? null
  } catch (e) {
    logger.error("rollup.get failed", { error: String(e) })
    return null
  }
}

export async function createKpiAction(input: KpiInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage KPI snapshots." }
  const v = validateKpi(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const k = await createKpi(input)
    revalidatePath("/governance-rollup")
    return { ok: true, id: k.id }
  } catch (e) {
    logger.error("rollup.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateKpiAction(id: string, input: KpiInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage KPI snapshots." }
  const v = validateKpi(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateKpi(id, input)
    if (!updated) return { ok: false, reason: "Snapshot not found." }
    revalidatePath("/governance-rollup")
    revalidatePath(`/governance-rollup/schools/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("rollup.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteKpiAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage KPI snapshots." }
  try {
    const ok = await deleteKpi(id)
    revalidatePath("/governance-rollup")
    return { ok }
  } catch (e) {
    logger.error("rollup.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedKpisAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed KPI snapshots." }
  try {
    const count = await seedKpis()
    revalidatePath("/governance-rollup")
    return { ok: true, count }
  } catch (e) {
    logger.error("rollup.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
