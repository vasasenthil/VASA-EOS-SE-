"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { MAINTENANCE_WORKFLOW } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem, type InboxAction } from "@/components/approval-inbox"
import type { TicketDetails } from "@/lib/maintenanceflow/store"
import { actTicketAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

type Priority = "low" | "medium" | "high"

interface Rec {
  id: string
  category: string
  description: string
  priority: Priority
  instance: WorkflowInstance
  details?: TicketDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Principal (triage / close)" },
  { role: "VENDOR", label: "Vendor (works)" },
]

// Advance the works flow, or reject (cannot proceed).
const ACTIONS: InboxAction[] = [
  { decision: "approve", label: "Advance", variant: "default" },
  { decision: "reject", label: "Reject", variant: "outline" },
]

export function MaintenanceApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(idv: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await actTicketAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.category} · ${r.priority}`,
    subtitle: r.description,
    details: inboxDetails([
      detailRow("Location", r.details?.location),
      detailRow("Reported by", r.details?.reportedBy),
      detailRow("Est. cost ₹", r.details?.estimatedCost),
      detailRow("Preferred", r.details?.preferredDate),
      detailRow("Safety hazard", r.details?.safetyHazard ? "Yes" : undefined),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Raise a maintenance ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full ticket form — category, location, priority, estimated cost, preferred date and a safety-hazard
            flag — before it enters the Principal → Vendor → Principal flow.
          </p>
          <Button asChild className="w-full">
            <Link href="/maintenance-approvals/new"><FilePlus className="mr-2 h-4 w-4" />Raise a ticket</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Principal triages → Vendor completes → Principal verifies &amp; closes.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={MAINTENANCE_WORKFLOW} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} actions={ACTIONS} />
    </div>
  )
}
