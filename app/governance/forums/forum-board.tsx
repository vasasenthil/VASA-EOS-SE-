"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { ForumDetails } from "@/lib/forumflow/store"
import { decideForumAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus } from "lucide-react"

interface Rec {
  id: string
  forum: string
  title: string
  requiresMinister: boolean
  actionItems: string[]
  instance: WorkflowInstance
  details?: ForumDetails
}

const ROLES = [
  { role: "SECRETARY", label: "Secretary (convener)" },
  { role: "DIRECTOR", label: "Director (member)" },
  { role: "MINISTER", label: "Minister (chair)" },
]

export function ForumBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [pending, startTransition] = useTransition()

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideForumAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const inbox: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.title,
    subtitle: `${r.forum}${r.actionItems.length ? ` · ${r.actionItems.length} action item${r.actionItems.length > 1 ? "s" : ""}` : ""}`,
    details: inboxDetails([
      detailRow("Category", r.details?.category),
      detailRow("Meeting", r.details?.meetingDate),
      detailRow("Responsible", r.details?.responsible),
      detailRow("Accountable", r.details?.accountable),
      r.details?.fundImplication ? detailRow("Fund ₹", r.details.fundImplication) : null,
      detailRow("Ratification", r.requiresMinister ? "Minister" : "Routine"),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Table an agenda item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the full governance resolution form — forum, category, meeting date, RACI ownership, fund implication
            and action items — with automatic Minister-ratification routing for significant or high-value items.
          </p>
          <Button asChild className="w-full">
            <Link href="/governance/forums/new"><FilePlus className="mr-2 h-4 w-4" />Table a resolution</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Secretary convenes &amp; adopts → a quorum of 2 Directors adopts → the Minister ratifies significant items.
          </p>
        </CardContent>
      </Card>

      <ApprovalInbox def={FORUM_RESOLUTION} items={inbox} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
