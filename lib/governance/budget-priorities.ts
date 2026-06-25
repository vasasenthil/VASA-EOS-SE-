// VASA-EOS(SE) — executive budget priorities (the Minister's where-the-money-goes view).
//
// The Secretary sanctions and re-appropriates; the Minister sets PRIORITIES — which heads are flagship, what
// outcome each is meant to buy, and whether the spend matches the politics of the manifesto. This joins the
// real finance budget to an executive priority tier (flagship / high / standard) and the in-repo module that
// measures the outcome that head is meant to deliver, then surfaces each head's share of the total and its
// utilisation. Budget heads are cross-checked against the real budget and outcome modules are asserted to
// exist on disk. Pure + client-safe.

import { csvField } from "@/lib/csv"

import { BUDGET, type BudgetLine } from "@/lib/finance"

export type PriorityTier = "flagship" | "high" | "standard"

export interface BudgetPriority {
  /** Must match a real budget head. */
  head: string
  tier: PriorityTier
  /** Why this is prioritised. */
  rationale: string
  /** In-repo module measuring the outcome this head buys (asserted to exist). */
  outcomeRef: string
}

export const BUDGET_PRIORITIES: BudgetPriority[] = [
  { head: "PM POSHAN / CMBS", tier: "flagship", rationale: "Nutrition & breakfast scheme — attendance and retention driver", outcomeRef: "lib/meals/index.ts" },
  { head: "Samagra Shiksha (composite grant)", tier: "flagship", rationale: "Foundational learning (Ennum Ezhuthum) — the core learning outcome", outcomeRef: "lib/diagnostic/index.ts" },
  { head: "Infrastructure & maintenance", tier: "high", rationale: "RTE §19 norms and safe, climate-resilient schools", outcomeRef: "lib/infrastructure/index.ts" },
  { head: "Library & TLM", tier: "standard", rationale: "Reading habit and teaching-learning material", outcomeRef: "lib/library/index.ts" },
  { head: "Sports & co-curricular", tier: "standard", rationale: "Holistic development and student engagement", outcomeRef: "lib/cocurricular/index.ts" },
]

const TIER_RANK: Record<PriorityTier, number> = { flagship: 0, high: 1, standard: 2 }

export interface PriorityLine extends BudgetPriority {
  allocated: number
  spent: number
  /** Share of total allocation, 0–100. */
  sharePct: number
  utilisationPct: number
}

/** Does the priority's head map to a real budget head? */
export function headResolved(p: BudgetPriority, budget: BudgetLine[] = BUDGET): boolean {
  return budget.some((b) => b.head === p.head)
}

/** Priorities joined to the budget, flagship-first then by allocation. */
export function prioritisedBudget(budget: BudgetLine[] = BUDGET, priorities: BudgetPriority[] = BUDGET_PRIORITIES): PriorityLine[] {
  const total = budget.reduce((s, b) => s + b.allocated, 0)
  return priorities
    .map((p) => {
      const line = budget.find((b) => b.head === p.head)
      const allocated = line?.allocated ?? 0
      const spent = line?.spent ?? 0
      return {
        ...p,
        allocated,
        spent,
        sharePct: total === 0 ? 0 : Math.round((allocated / total) * 100),
        utilisationPct: allocated === 0 ? 0 : Math.round((spent / allocated) * 100),
      }
    })
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.allocated - a.allocated)
}

export interface PrioritySummary {
  priorities: number
  flagship: number
  high: number
  standard: number
  /** Combined share of total allocation going to flagship heads, 0–100. */
  flagshipSharePct: number
  totalAllocated: number
}

export function prioritySummary(budget: BudgetLine[] = BUDGET, priorities: BudgetPriority[] = BUDGET_PRIORITIES): PrioritySummary {
  const total = budget.reduce((s, b) => s + b.allocated, 0)
  const flagshipAlloc = priorities
    .filter((p) => p.tier === "flagship")
    .reduce((s, p) => s + (budget.find((b) => b.head === p.head)?.allocated ?? 0), 0)
  return {
    priorities: priorities.length,
    flagship: priorities.filter((p) => p.tier === "flagship").length,
    high: priorities.filter((p) => p.tier === "high").length,
    standard: priorities.filter((p) => p.tier === "standard").length,
    flagshipSharePct: total === 0 ? 0 : Math.round((flagshipAlloc / total) * 100),
    totalAllocated: total,
  }
}


export function toCSV(budget: BudgetLine[] = BUDGET, priorities: BudgetPriority[] = BUDGET_PRIORITIES): string {
  const header = ["Head", "Tier", "Allocated", "Share %", "Utilisation %", "Rationale", "Outcome module"]
  const rows = prioritisedBudget(budget, priorities).map((p) =>
    [p.head, p.tier, String(p.allocated), String(p.sharePct), String(p.utilisationPct), p.rationale, p.outcomeRef].map(csvField).join(","),
  )
  return [header.join(","), ...rows].join("\r\n") + "\r\n"
}
