"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { BUDGET_SANCTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { BudgetDetails } from "@/lib/budgetflow/store"
import { decideBudgetAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: BudgetDetails
}

const ROLES = [
  { role: "DIRECTOR", label: "Directorate (proposal)" },
  { role: "SECRETARY", label: "Secretariat & Finance" },
  { role: "MINISTER", label: "Cabinet / Minister" },
]

export function BudgetApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideBudgetAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.scheme,
    subtitle: `₹${r.amount.toLocaleString("en-IN")} · ${r.details?.proposalType ?? ""}`,
    details: inboxDetails([
      detailRow("Type", r.details?.proposalType),
      detailRow("Head", r.details?.budgetHead),
      detailRow("From", r.details?.fromHead),
      detailRow("FY", r.details?.fiscalYear),
      detailRow("Amount ₹", r.amount),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Propose a budget sanction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full proposal — type (fresh / re-appropriation / supplementary), budget head, amount and fiscal
            year — with automatic Cabinet routing for new schemes and high-value sanctions.
          </p>
          <Button asChild className="w-full">
            <Link href="/budget-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New proposal</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Directorate → Secretariat &amp; Finance → Cabinet/Minister (new / ≥ ₹50 Cr).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={BUDGET_SANCTION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
