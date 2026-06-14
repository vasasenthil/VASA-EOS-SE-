"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { SAFETY_INCIDENT } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { IncidentDetails } from "@/lib/safetyflow/store"
import { decideIncidentAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  caseRef: string
  category: string
  escalate: boolean
  instance: WorkflowInstance
  details?: IncidentDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Headmaster (verify / report)" },
  { role: "BEO", label: "Block Safety Officer" },
  { role: "DEO", label: "District Child Protection (DCPU)" },
]

export function SafetyIncidentBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideIncidentAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.caseRef} · ${r.category}`,
    subtitle: r.details?.account,
    details: inboxDetails([
      detailRow("Severity", r.details?.severity),
      detailRow("Date", r.details?.incidentDate),
      detailRow("Reported by", r.details?.reportedBy),
      detailRow("Mandatory report", r.details?.mandatoryReport ? "CWC/Police (24h)" : undefined),
      detailRow("Escalation", r.escalate ? "DCPU" : "Block"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Report a safety incident</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the safeguarding report — category, severity and a factual account, with an <strong>anonymised</strong>{" "}
            case reference (POCSO §23). Mandatory-report and escalation routing are computed automatically.
          </p>
          <Button asChild className="w-full">
            <Link href="/safety-incidents/new"><FilePlus className="mr-2 h-4 w-4" />Report incident</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster verifies &amp; reports → Block safety → District Child Protection.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={SAFETY_INCIDENT} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
