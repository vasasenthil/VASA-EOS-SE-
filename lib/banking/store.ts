// VASA-EOS(SE) — Student savings-bank persistence (server-only).
// Durable in Supabase when configured; in-memory fallback otherwise. Audited.
// The new balance is computed server-side (applyTxn) so it can't be falsified.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { applyTxn, type Account } from "./index"

function id(): string {
  return `AC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

interface Row {
  id: string
  student: string
  cls: string
  balance: number
  tenant_id: string
  created_at: string
}

function fromRow(r: Row): Account {
  return { id: r.id, student: r.student, cls: r.cls, balance: r.balance, tenantId: r.tenant_id ?? DEFAULT_SCHOOL_NODE }
}

// Seeded across tenant nodes so savings-bank accounts roll up by jurisdiction.
const store: Account[] = [
  { id: "AC-SEED1", student: "Asha", cls: "6-A", balance: 450, tenantId: "TN-CHN-B1-S1" },
  { id: "AC-SEED2", student: "Bala", cls: "7-B", balance: 1200, tenantId: "TN-CHN-B2-S1" },
  { id: "AC-SEED3", student: "Chitra", cls: "5-C", balance: 80, tenantId: "TN-CBE-B1-S1" },
]

export interface NewAccount {
  student: string
  cls: string
  opening: number
  /** Tenant node the account is opened at; defaults to the demo school. */
  tenantId?: string
}

export async function openAccount(input: NewAccount): Promise<Account> {
  const a: Account = { id: id(), student: input.student, cls: input.cls, balance: Math.max(0, input.opening), tenantId: input.tenantId ?? DEFAULT_SCHOOL_NODE }
  const db = getDb()
  if (db) {
    await db.from("bank_accounts").insert({
      id: a.id,
      student: a.student,
      cls: a.cls,
      balance: a.balance,
      tenant_id: a.tenantId,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(a)
  }
  await appendAudit({ actor: "bank", action: "account.open", resource: a.id, details: { opening: a.balance } })
  return a
}

async function load(aid: string): Promise<Account | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("bank_accounts").select("*").eq("id", aid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === aid)
}

export async function getAccount(aid: string): Promise<Account | undefined> {
  return load(aid)
}

export async function transact(aid: string, kind: "deposit" | "withdraw", amount: number): Promise<Account | undefined> {
  const a = await load(aid)
  if (!a) return undefined
  a.balance = applyTxn(a.balance, kind, amount)
  const db = getDb()
  if (db) await db.from("bank_accounts").update({ balance: a.balance }).eq("id", aid)
  await appendAudit({ actor: "bank", action: `account.${kind}`, resource: aid, details: { amount, balance: a.balance } })
  return a
}

export async function deleteAccount(aid: string): Promise<boolean> {
  const existing = await load(aid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("bank_accounts").delete().eq("id", aid)
  } else {
    const i = store.findIndex((x) => x.id === aid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "account.close", resource: aid })
  return true
}

export async function listAccounts(): Promise<Account[]> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("bank_accounts").select("*").order("created_at", { ascending: false })
    return ((data as Row[] | null) ?? []).map(fromRow)
  }
  return [...store]
}
