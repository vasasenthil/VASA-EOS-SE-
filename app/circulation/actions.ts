"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { issueLoan, returnLoan, deleteLoan, listLoans, type NewLoan } from "@/lib/circulation/store"
import type { Loan } from "@/lib/circulation"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listLoansAction(): Promise<Loan[]> {
  noStore()
  try {
    // Per-role data scoping: library circulation rolls up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listLoans())
  } catch (e) {
    logger.error("loan.list failed", { error: String(e) })
    return []
  }
}

export async function issueLoanAction(input: NewLoan): Promise<Loan | null> {
  try {
    const l = await issueLoan(input)
    revalidatePath("/circulation")
    return l
  } catch (e) {
    logger.error("loan.issue failed", { error: String(e) })
    return null
  }
}

export async function returnLoanAction(id: string, returnedOn: string): Promise<Loan | null> {
  try {
    const l = await returnLoan(id, returnedOn)
    revalidatePath("/circulation")
    return l ?? null
  } catch (e) {
    logger.error("loan.return failed", { error: String(e) })
    return null
  }
}
