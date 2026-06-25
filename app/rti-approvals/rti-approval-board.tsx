"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { RTI_REQUEST } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem, type InboxAction } from "@/components/approval-inbox"
import type { RtiDetails } from "@/lib/rtiflow/store"
import { decideRtiAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  applicant: string
  subject: string
  instance: WorkflowInstance
  details?: RtiDetails
}

const ROLES = [
  { role: "BEO", label: "Public Information Officer (PIO)" },
  { role: "DEO", label: "First Appellate Authority (FAA)" },
  { role: "SECRETARY", label: "State Information Commission (SIC)" },
]

// Each tier may provide the information (resolve), let the citizen appeal (escalate), or
// reject under an exemption (RTI §8).
const ACTIONS: InboxAction[] = [
  { decision: "resolve", label: "Provide info", variant: "default" },
  { decision: "approve", label: "Appeal", variant: "secondary" },
  { decision: "reject", label: "Reject (§8 exempt)", variant: "outline" },
]

export function RtiApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideRtiAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.applicant} · ${r.subject}`,
    subtitle: r.details?.informationSought,
    details: inboxDetails([
      detailRow("Category", r.details?.category),
      detailRow("Fee ₹", r.details?.fee),
      detailRow("BPL", r.details?.bpl ? "Exempt" : undefined),
      detailRow("Deadline", r.details?.deadline),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>File an RTI application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the RTI form — subject, information sought, BPL fee exemption and life-&amp;-liberty expedite — with the
            fee and response deadline computed automatically before it reaches the PIO.
          </p>
          <Button asChild className="w-full">
            <Link href="/rti-approvals/new"><FilePlus className="mr-2 h-4 w-4" />File an RTI</Link>
          </Button>
          <p className="text-xs text-muted-foreground">PIO responds; each tier can provide, be appealed, or reject under §8.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={RTI_REQUEST} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} actions={ACTIONS} />
    </div>
  )
}
