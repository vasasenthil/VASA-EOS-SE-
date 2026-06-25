"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listProposals, getProposal, createProposal, updateProposal, deleteProposal, seedProposals } from "@/lib/policysim/store"
import { queryProposals, validateProposal, type PolicyProposal, type ProposalInput, type ProposalFilters, type ProposalPage } from "@/lib/policysim"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listProposalsAction(filters: ProposalFilters = {}): Promise<ProposalPage> {
  noStore()
  try {
    return queryProposals(await listProposals(), filters)
  } catch (e) {
    logger.error("policysim.list failed", { error: String(e) })
    return { proposals: [], total: 0, totalPages: 1, page: 1, pageSize: 9, summary: { total: 0, sanctioned: 0, pending: 0, projectedBeneficiaries: 0, projectedCost: 0 } }
  }
}

export async function getProposalAction(id: string): Promise<PolicyProposal | null> {
  noStore()
  try {
    return (await getProposal(id)) ?? null
  } catch (e) {
    logger.error("policysim.get failed", { error: String(e) })
    return null
  }
}

export async function createProposalAction(input: ProposalInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage policy proposals." }
  const v = validateProposal(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const p = await createProposal(input)
    revalidatePath("/policy-simulator")
    return { ok: true, id: p.id }
  } catch (e) {
    logger.error("policysim.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateProposalAction(id: string, input: ProposalInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage policy proposals." }
  const v = validateProposal(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateProposal(id, input)
    if (!updated) return { ok: false, reason: "Proposal not found." }
    revalidatePath("/policy-simulator")
    revalidatePath(`/policy-simulator/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("policysim.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteProposalAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage policy proposals." }
  try {
    const ok = await deleteProposal(id)
    revalidatePath("/policy-simulator")
    return { ok }
  } catch (e) {
    logger.error("policysim.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedProposalsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed policy proposals." }
  try {
    const count = await seedProposals()
    revalidatePath("/policy-simulator")
    return { ok: true, count }
  } catch (e) {
    logger.error("policysim.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
