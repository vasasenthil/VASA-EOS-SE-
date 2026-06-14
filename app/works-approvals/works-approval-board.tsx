"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { INFRA_WORKS } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { WorksDetails } from "@/lib/infraflow/store"
import { decideWorksAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  school: string
  workType: string
  cost: number
  instance: WorkflowInstance
  details?: WorksDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Headmaster (proposal)" },
  { role: "BEO", label: "Block AE (technical)" },
  { role: "DEO", label: "District EE / DEO (sanction)" },
  { role: "DIRECTOR", label: "Directorate (high-value)" },
]

export function WorksApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideWorksAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.school} · ${r.workType}`,
    subtitle: `₹${r.cost.toLocaleString("en-IN")}`,
    details: inboxDetails([
      detailRow("Funding", r.details?.fundingSource),
      detailRow("Cost ₹", r.cost),
      detailRow("Mandated", r.details?.mandated ? "RTE/RPwD" : undefined),
      detailRow("Tier", r.cost >= 1000000 ? "Directorate" : "District"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Propose infrastructure works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full works proposal — type, estimate, funding source and justification — with live high-value and
            RTE/RPwD-mandated detection before it enters technical scrutiny.
          </p>
          <Button asChild className="w-full">
            <Link href="/works-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New works proposal</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster → Block AE → District EE/DEO → Directorate (≥ ₹10 lakh).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={INFRA_WORKS} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
