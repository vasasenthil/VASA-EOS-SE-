"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import { decideRecognitionAction } from "./actions"
import type { RecognitionType, RecognitionDetails } from "@/lib/recognitionflow/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  school: string
  district: string
  type: RecognitionType
  instance: WorkflowInstance
  details?: RecognitionDetails
}

const ROLES = [
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
  { role: "DIRECTOR", label: "Director (Directorate)" },
]

export function RecognitionApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideRecognitionAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.school,
    subtitle: `${r.district} · ${r.type}`,
    details: inboxDetails([
      detailRow("Management", r.details?.management),
      detailRow("Block", r.details?.block),
      detailRow("UDISE", r.details?.udiseCode),
      detailRow("Trust reg.", r.details?.trustRegNo),
      detailRow("Land", r.details?.landStatus),
      detailRow("Criteria met", r.details?.criteriaMet?.length ? `${r.details.criteriaMet.length}/6` : undefined),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>File a recognition application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full recognition form — management, UDISE/trust registration, land status and the statutory
            criteria — validated by type (new vs renewal) before it enters the BEO → DEO → Director workflow.
          </p>
          <Button asChild className="w-full">
            <Link href="/recognition-approvals/new"><FilePlus className="mr-2 h-4 w-4" />File an application</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Routes BEO → DEO → Director; any tier can reject with the trail preserved.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={RECOGNITION_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
