"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { LeaveType } from "@/lib/leave"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { LEAVE_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { LeaveDetails } from "@/lib/leaveflow/store"
import { decideLeaveFlowAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  teacher: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  instance: WorkflowInstance
  details?: LeaveDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Principal / HM" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
]

export function LeaveApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideLeaveFlowAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.teacher} · ${r.days}d`,
    subtitle: `${r.type} · ${r.from} → ${r.to}${r.reason ? ` · ${r.reason}` : ""}`,
    details: inboxDetails([
      detailRow("Substitute", r.details?.substitute),
      detailRow("Contact", r.details?.contact),
      detailRow("Medical cert.", r.details?.medicalCert ? "Attached" : undefined),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Apply for leave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full leave form — type, date range (duration computed for you), reason, substitute and medical
            certificate where required — before it enters the Principal → BEO → DEO flow.
          </p>
          <Button asChild className="w-full">
            <Link href="/leave-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Apply for leave</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Principal always approves; over 5 days adds the BEO, over 15 the DEO.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={LEAVE_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
