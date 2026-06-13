"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { TRANSFER_REQUEST } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { TransferDetails } from "@/lib/transferflow/store"
import { decideTransferAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  teacher: string
  interDistrict: boolean
  instance: WorkflowInstance
  details?: TransferDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Headmaster (relieving NOC)" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District (counselling / order)" },
  { role: "DIRECTOR", label: "Directorate (inter-district sanction)" },
]

export function TransferApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideTransferAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.teacher,
    subtitle: `${r.details?.currentDistrict ?? "?"} → ${r.details?.requestedDistrict ?? "?"}`,
    details: inboxDetails([
      detailRow("From", r.details?.currentSchool),
      detailRow("To", r.details?.requestedSchool),
      detailRow("Reason", r.details?.reason),
      detailRow("Service", r.details?.yearsOfService ? `${r.details.yearsOfService} yrs` : undefined),
      detailRow("Eligibility", r.details?.eligible === undefined ? undefined : r.details.eligible ? "Eligible" : "Not eligible"),
      detailRow("Scope", r.interDistrict ? "Inter-district" : "Intra-district"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Request a transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full transfer request — current/requested posting, reason and years of service — with live
            eligibility and inter-district detection before it enters counselling.
          </p>
          <Button asChild className="w-full">
            <Link href="/transfer-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New transfer request</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster NOC → BEO → DEO counselling → Directorate (inter-district).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={TRANSFER_REQUEST} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
