"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { TC_ISSUANCE } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { TcDetails } from "@/lib/tcflow/store"
import { decideTcAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  student: string
  instance: WorkflowInstance
  details?: TcDetails
}

const ROLES = [
  { role: "ACADEMIC_HEAD", label: "Class Teacher / Academic Head" },
  { role: "PRINCIPAL", label: "Headmaster (issue & sign)" },
  { role: "BEO", label: "Block (counter-sign)" },
]

export function TcApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideTcAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.student,
    subtitle: `Class ${r.details?.lastClass ?? "—"} · ${r.details?.tcType ?? ""}`,
    details: inboxDetails([
      detailRow("APAAR", r.details?.apaarId),
      detailRow("UDISE", r.details?.udiseCode),
      detailRow("Class", r.details?.lastClass),
      detailRow("Type", r.details?.tcType),
      detailRow("Leaving", r.details?.dateOfLeaving),
      detailRow("Dues cleared", r.details?.duesCleared ? "Yes" : "No"),
      detailRow("Reason", r.details?.reason),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Request a transfer certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full request — student, APAAR id, UDISE, class last studied, certificate type and reason — with
            automatic Block counter-signature routing for inter-state and duplicate certificates.
          </p>
          <Button asChild className="w-full">
            <Link href="/tc-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New TC request</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Class Teacher → Headmaster → Block (inter-state / duplicate).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={TC_ISSUANCE} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
