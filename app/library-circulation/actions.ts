"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { listLoans, getLoan, createLoan, updateLoan, deleteLoan, seedLoans } from "@/lib/librarycirc/store"
import { queryLoans, validateLoan, type LibraryLoan, type LoanInput, type LoanFilters, type LoanPage } from "@/lib/librarycirc"
import { canDo } from "@/lib/access/guard"
import { logger } from "@/lib/logger"

export async function listLoansAction(filters: LoanFilters = {}): Promise<LoanPage> {
  noStore()
  try {
    return queryLoans(await listLoans(), filters)
  } catch (e) {
    logger.error("librarycirc.list failed", { error: String(e) })
    return { loans: [], total: 0, totalPages: 1, page: 1, pageSize: 10, summary: { total: 0, issued: 0, overdue: 0, returned: 0, fineDue: 0 } }
  }
}

export async function getLoanAction(id: string): Promise<LibraryLoan | null> {
  noStore()
  try {
    return (await getLoan(id)) ?? null
  } catch (e) {
    logger.error("librarycirc.get failed", { error: String(e) })
    return null
  }
}

export async function createLoanAction(input: LoanInput): Promise<{ ok: boolean; id?: string; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage library loans." }
  const v = validateLoan(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const l = await createLoan(input)
    revalidatePath("/library-circulation")
    return { ok: true, id: l.id }
  } catch (e) {
    logger.error("librarycirc.create failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function updateLoanAction(id: string, input: LoanInput): Promise<{ ok: boolean; errors?: Record<string, string>; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage library loans." }
  const v = validateLoan(input)
  if (!v.ok) return { ok: false, errors: v.errors }
  try {
    const updated = await updateLoan(id, input)
    if (!updated) return { ok: false, reason: "Loan not found." }
    revalidatePath("/library-circulation")
    revalidatePath(`/library-circulation/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("librarycirc.update failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

/** Quick-action: mark a loan returned today (circulation desk return). */
export async function markReturnedAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage library loans." }
  try {
    const loan = await getLoan(id)
    if (!loan) return { ok: false, reason: "Loan not found." }
    if (loan.returnDate) return { ok: true }
    const { id: _id, createdAt, updatedAt, ...rest } = loan
    await updateLoan(id, { ...rest, returnDate: new Date().toISOString().slice(0, 10) })
    revalidatePath("/library-circulation")
    revalidatePath(`/library-circulation/${id}`)
    return { ok: true }
  } catch (e) {
    logger.error("librarycirc.return failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function deleteLoanAction(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to manage library loans." }
  try {
    const ok = await deleteLoan(id)
    revalidatePath("/library-circulation")
    return { ok }
  } catch (e) {
    logger.error("librarycirc.delete failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}

export async function seedLoansAction(): Promise<{ ok: boolean; count?: number; reason?: string }> {
  if (!(await canDo("manage:school"))) return { ok: false, reason: "You do not have permission to seed library loans." }
  try {
    const count = await seedLoans()
    revalidatePath("/library-circulation")
    return { ok: true, count }
  } catch (e) {
    logger.error("librarycirc.seed failed", { error: String(e) })
    return { ok: false, reason: "Server error." }
  }
}
