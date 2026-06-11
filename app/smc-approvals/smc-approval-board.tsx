"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { SMC_RESOLUTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { ResolutionDetails } from "@/lib/smcflow/store"
import { decideResolutionAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  title: string
  description: string
  instance: WorkflowInstance
  details?: ResolutionDetails
}

const ROLES = [
  { role: "PARENT", label: "SMC Member" },
  { role: "PRINCIPAL", label: "Principal (chair)" },
]

export function SmcApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideResolutionAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.title,
    subtitle: r.description,
    details: inboxDetails([
      detailRow("Category", r.details?.category),
      detailRow("Meeting", r.details?.meetingDate),
      detailRow("Proposed by", r.details?.proposedBy),
      detailRow("Seconded by", r.details?.secondedBy),
      detailRow("Members", r.details?.membersPresent),
      r.details?.fundImplication ? detailRow("Fund ₹", r.details.fundImplication) : null,
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Table a resolution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full SMC resolution form — category, meeting date, proposer and seconder, quorum and fund
            implication — with live validation and a completeness check before it enters the quorum workflow.
          </p>
          <Button asChild className="w-full">
            <Link href="/smc-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Propose a resolution</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Needs 3 SMC-member approvals (quorum), then the Principal counter-signs.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={SMC_RESOLUTION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
