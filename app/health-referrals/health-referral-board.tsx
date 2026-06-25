"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { HEALTH_REFERRAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { ReferralDetails } from "@/lib/healthflow/store"
import { decideReferralAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  student: string
  category: string
  specialistReferral: boolean
  instance: WorkflowInstance
  details?: ReferralDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "School Health (Headmaster)" },
  { role: "BEO", label: "Block Medical Officer" },
  { role: "DEO", label: "District DEIC (specialist)" },
]

export function HealthReferralBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideReferralAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.student} · ${r.category}`,
    subtitle: r.details?.findings,
    details: inboxDetails([
      detailRow("Class", r.details?.className),
      detailRow("Severity", r.details?.severity),
      detailRow("Triage", r.details?.triage),
      detailRow("Screened", r.details?.screeningDate),
      detailRow("Guardian", r.details?.guardianMasked),
      detailRow("Referral", r.specialistReferral ? "DEIC specialist" : "Block-level"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>New health screening / referral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the RBSK screening form — the 4 Ds, severity, findings and guardian consent — with automatic triage and
            specialist-referral routing before it enters review.
          </p>
          <Button asChild className="w-full">
            <Link href="/health-referrals/new"><FilePlus className="mr-2 h-4 w-4" />New referral</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster verifies → Block Medical Officer → District DEIC (referral cases).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={HEALTH_REFERRAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
