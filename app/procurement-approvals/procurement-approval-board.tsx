"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { GEM_PROCUREMENT } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { IndentDetails } from "@/lib/procurementflow/store"
import { decideIndentAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  item: string
  category: string
  cost: number
  instance: WorkflowInstance
  details?: IndentDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Headmaster (indent)" },
  { role: "BEO", label: "Block (verify)" },
  { role: "DEO", label: "District (financial sanction)" },
  { role: "DIRECTOR", label: "Directorate (tender)" },
]

export function ProcurementApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideIndentAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.item} · ${r.category}`,
    subtitle: `₹${r.cost.toLocaleString("en-IN")}`,
    details: inboxDetails([
      detailRow("Quantity", r.details?.quantity),
      detailRow("Cost ₹", r.cost),
      detailRow("Mode", r.details?.mode),
      detailRow("Funding", r.details?.fundingHead),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Raise a procurement indent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full indent — category, item, quantity, estimate and funding head — with the GeM/GFR purchase mode
            picked automatically before it enters financial sanction.
          </p>
          <Button asChild className="w-full">
            <Link href="/procurement-approvals/new"><FilePlus className="mr-2 h-4 w-4" />New indent</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Headmaster → BEO → DEO sanction → Directorate (tender ≥ ₹5 lakh).</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={GEM_PROCUREMENT} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
