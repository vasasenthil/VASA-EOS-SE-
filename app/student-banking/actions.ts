"use server"

import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { openAccount, transact, deleteAccount, listAccounts, type NewAccount } from "@/lib/banking/store"
import type { Account } from "@/lib/banking"
import { scopeForCurrentSubject } from "@/lib/access/scope-server"
import { logger } from "@/lib/logger"

export async function listAccountsAction(): Promise<Account[]> {
  noStore()
  try {
    // Per-role data scoping: savings accounts roll up by jurisdiction subtree.
    return await scopeForCurrentSubject(await listAccounts())
  } catch (e) {
    logger.error("banking.list failed", { error: String(e) })
    return []
  }
}

export async function openAccountAction(input: NewAccount): Promise<Account | null> {
  try {
    const a = await openAccount(input)
    revalidatePath("/student-banking")
    return a
  } catch (e) {
    logger.error("banking.open failed", { error: String(e) })
    return null
  }
}

export async function transactAction(id: string, kind: "deposit" | "withdraw", amount: number): Promise<Account | null> {
  try {
    const a = await transact(id, kind, amount)
    revalidatePath("/student-banking")
    return a ?? null
  } catch (e) {
    logger.error("banking.transact failed", { error: String(e) })
    return null
  }
}

export async function deleteAccountAction(id: string): Promise<boolean> {
  try {
    const ok = await deleteAccount(id)
    revalidatePath("/student-banking")
    return ok
  } catch (e) {
    logger.error("banking.delete failed", { error: String(e) })
    return false
  }
}
