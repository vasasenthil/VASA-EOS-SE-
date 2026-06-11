"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { ADMISSION_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { AdmissionDetails } from "@/lib/admissionsflow/store"
import { decideApplicantAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  name: string
  dob: string
  gender: string
  category: string
  className: string
  apaarId?: string
  instance: WorkflowInstance
  details?: AdmissionDetails
}

const ROLES = [
  { role: "ACADEMIC_HEAD", label: "Academic Head (verify)" },
  { role: "PRINCIPAL", label: "Principal (enrol)" },
]

export function AdmissionsApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(idv: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideApplicantAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.name,
    subtitle: `Class ${r.className} · ${r.category}${r.apaarId ? ` · ${r.apaarId}` : ""}`,
    details: inboxDetails([
      detailRow("Guardian", r.details?.guardianName),
      detailRow("Phone", r.details?.guardianPhone),
      detailRow("Prev. school", r.details?.previousSchool),
      detailRow("RTE quota", r.details?.rteQuota ? "Yes" : undefined),
      detailRow("Documents", r.details?.documents?.length ? String(r.details.documents.length) : undefined),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>New admission application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full RTE admission form — student, guardian, address, previous school, the 25%-quota claim and
            document checklist — with the RTE §4 age check before it enters verification and enrolment.
          </p>
          <Button asChild className="w-full">
            <Link href="/admissions-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New application</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Academic Head verifies → Principal enrols → APAAR id minted automatically.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={ADMISSION_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
