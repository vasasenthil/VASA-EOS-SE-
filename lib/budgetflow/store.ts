// VASA-EOS(SE) — Budget sanction / re-appropriation workflow persistence (server-only).
// Each proposal carries a live BUDGET_SANCTION instance: Directorate proposal → Secretariat &
// Finance scrutiny → Cabinet/Minister approval (new schemes / high value). Durable in Supabase
// when configured; in-memory otherwise. Every action audited.

import { appendAudit } from "@/lib/audit/trail"
import { getDb } from "@/lib/persistence"
import { act, startInstance, type ActInput, type WorkflowInstance } from "@/lib/workflow"
import { BUDGET_SANCTION } from "@/lib/workflow/definitions"

function id(): string {
  return `BS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/** Rich detail captured by the budget form. */
export interface BudgetDetails {
  proposalType?: string
  budgetHead?: string
  fromHead?: string
  fiscalYear?: string
  justification?: string
  needsCabinet?: boolean
}

export interface BudgetFlowRecord {
  id: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: BudgetDetails
}

interface Row {
  id: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: BudgetDetails
  created_at: string
}

function fromRow(r: Row): BudgetFlowRecord {
  return { id: r.id, scheme: r.scheme, amount: r.amount, instance: r.instance, details: r.details }
}

const store: BudgetFlowRecord[] = []

export interface NewBudget {
  scheme: string
  amount: number
  needsCabinet: boolean
  details?: BudgetDetails
}

export async function fileBudget(input: NewBudget): Promise<BudgetFlowRecord> {
  const rec: BudgetFlowRecord = {
    id: id(),
    scheme: input.scheme,
    amount: input.amount,
    instance: startInstance(BUDGET_SANCTION, { needsCabinet: input.needsCabinet }),
    details: input.details,
  }
  const db = getDb()
  if (db) {
    await db.from("budget_flows").insert({
      id: rec.id,
      scheme: rec.scheme,
      amount: rec.amount,
      instance: rec.instance,
      details: rec.details,
      created_at: new Date().toISOString(),
    })
  } else {
    store.unshift(rec)
  }
  await appendAudit({
    actor: "finance",
    action: "budgetflow.file",
    resource: rec.id,
    details: { proposalType: rec.details?.proposalType, amount: rec.amount, needsCabinet: rec.details?.needsCabinet },
  })
  return rec
}

async function load(rid: string): Promise<BudgetFlowRecord | undefined> {
  const db = getDb()
  if (db) {
    const { data } = await db.from("budget_flows").select("*").eq("id", rid).maybeSingle()
    return data ? fromRow(data as Row) : undefined
  }
  return store.find((x) => x.id === rid)
}

export async function getBudget(rid: string): Promise<BudgetFlowRecord | undefined> {
  return load(rid)
}

export interface ActResult {
  ok: boolean
  record?: BudgetFlowRecord
  reason?: string
}

export async function actOnBudget(rid: string, input: ActInput): Promise<ActResult> {
  const rec = await load(rid)
  if (!rec) return { ok: false, reason: "Proposal not found." }
  const result = act(BUDGET_SANCTION, rec.instance, input)
  if (!result.ok) return { ok: false, record: rec, reason: result.reason }
  rec.instance = result.instance
  const db = getDb()
  if (db) await db.from("budget_flows").update({ instance: rec.instance }).eq("id", rid)
  await appendAudit({
    actor: input.actor,
    action: "budgetflow.act",
    resource: rid,
    details: { role: input.actorRole, decision: input.decision, status: rec.instance.status },
  })
  return { ok: true, record: rec }
}

export async function deleteBudget(rid: string): Promise<boolean> {
  const existing = await load(rid)
  if (!existing) return false
  const db = getDb()
  if (db) {
    await db.from("budget_flows").delete().eq("id", rid)
  } else {
    const i = store.findIndex((x) => x.id === rid)
    if (i >= 0) store.splice(i, 1)
  }
  await appendAudit({ actor: "admin", action: "budgetflow.delete", resource: rid })
  return true
}

export async function listBudgets(): Promise<BudgetFlowRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const { data } = await db.from("budget_flows").select("*").order("created_at", { ascending: false })
      return ((data as Row[] | null) ?? []).map(fromRow)
    } catch {
      return []
    }
  }
  return [...store]
}
