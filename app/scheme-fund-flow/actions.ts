"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listFunds, getFund, createFund, updateFund, deleteFund, seedFunds } from "@/lib/fundledger/store"
import { queryFunds, validateFundLedger, type FundLedgerRecord, type FundLedgerInput, type FundFilters } from "@/lib/fundledger"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listFundsAction(filters: FundFilters = {}) {
  noStore()
  try {
    return queryFunds(await listFunds(), filters)
  } catch (e) {
    logger.error("fund.list failed", { error: String(e) })
    return { rows: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, allocated: 0, released: 0, utilised: 0, utilisationPct: 0, lowUtilisation: 0 } }
  }
}

export async function getFundAction(id: string): Promise<FundLedgerRecord | null> {
  noStore()
  try {
    return (await getFund(id)) ?? null
  } catch (e) {
    logger.error("fund.get failed", { error: String(e) })
    return null
  }
}

export async function createFundAction(input: FundLedgerInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the fund ledger." }
  const v = validateFundLedger(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const c = await createFund(input)
    revalidatePath("/scheme-fund-flow")
    return { ok: true, id: c.id }
  } catch (e) {
    logger.error("fund.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateFundAction(id: string, input: FundLedgerInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the fund ledger." }
  const v = validateFundLedger(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateFund(id, input)
    if (!updated) return { ok: false, reason: "Ledger row not found." }
    revalidatePath("/scheme-fund-flow")
    revalidatePath(`/scheme-fund-flow/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("fund.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteFundAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage the fund ledger." }
  try {
    const ok = await deleteFund(id)
    revalidatePath("/scheme-fund-flow")
    return { ok }
  } catch (e) {
    logger.error("fund.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedFundsAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed the fund ledger." }
  try {
    const count = await seedFunds()
    revalidatePath("/scheme-fund-flow")
    return { ok: true, count }
  } catch (e) {
    logger.error("fund.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
