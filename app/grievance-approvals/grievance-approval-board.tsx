"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { GRIEVANCE_ESCALATION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem, type InboxAction } from "@/components/approval-inbox"
import type { GrievanceDetails } from "@/lib/grievanceflow/store"
import { actGrievanceAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  applicant: string
  category: string
  description: string
  instance: WorkflowInstance
  details?: GrievanceDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Principal (school)" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
]

// Each tier may resolve the grievance or escalate it to the next tier.
const ACTIONS: InboxAction[] = [
  { decision: "resolve", label: "Resolve", variant: "default" },
  { decision: "approve", label: "Escalate", variant: "secondary" },
  { decision: "reject", label: "Dismiss", variant: "outline" },
]

export function GrievanceApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(idv: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await actGrievanceAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.applicant} · ${r.category}`,
    subtitle: r.description,
    details: inboxDetails([
      detailRow("Urgency", r.details?.urgency),
      detailRow("School", r.details?.school),
      detailRow("District", r.details?.district),
      detailRow("Relationship", r.details?.relationship),
      detailRow("Phone", r.details?.contactPhone),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>File a grievance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full grievance form — category, urgency, school/district, contact and DPDP consent — validated
            before it enters the School → Block → District escalation flow.
          </p>
          <Button asChild className="w-full">
            <Link href="/grievance-approvals/new"><FilePlus className="mr-2 h-4 w-4" />File a grievance</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Starts at the school; each tier can resolve or escalate to the next.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={GRIEVANCE_ESCALATION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} actions={ACTIONS} />
    </div>
  )
}
