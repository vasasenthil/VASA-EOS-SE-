"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { SCHOLARSHIP_SANCTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { ScholarshipDetails } from "@/lib/scholarshipflow/store"
import { decideScholarshipAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  student: string
  scheme: string
  amount: number
  instance: WorkflowInstance
  details?: ScholarshipDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Headmaster (verify)" },
  { role: "BEO", label: "Block Education Officer (sanction)" },
  { role: "DEO", label: "District (scrutiny / DBT release)" },
]

export function ScholarshipApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideScholarshipAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.student} · ${r.scheme}`,
    subtitle: `₹${r.amount.toLocaleString("en-IN")}`,
    details: inboxDetails([
      detailRow("Category", r.details?.category),
      detailRow("Income ₹", r.details?.annualIncome),
      detailRow("Attendance", r.details?.attendancePct ? `${r.details.attendancePct}%` : undefined),
      detailRow("Account", r.details?.accountMasked),
      detailRow("AI eligibility", r.details?.eligible === undefined ? undefined : r.details.eligible ? "Eligible" : "Review"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Apply for a scholarship / benefit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full application — scheme, social category, income, attendance and DBT account — with live
            AI-eligibility (the Reasoning engine) before it enters sanction.
          </p>
          <Button asChild className="w-full">
            <Link href="/scholarship-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New application</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster verifies → BEO sanctions → DEO scrutiny (≥ ₹25k) → DBT release.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={SCHOLARSHIP_SANCTION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
