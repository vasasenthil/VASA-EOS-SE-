"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { SMC_RESOLUTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, type InboxItem } from "@/components/approval-inbox"
import { fileResolutionAction, decideResolutionAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Rec {
  id: string
  title: string
  description: string
  instance: WorkflowInstance
}

const ROLES = [
  { role: "PARENT", label: "SMC Member" },
  { role: "PRINCIPAL", label: "Principal (chair)" },
]

export function SmcApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pending, startTransition] = useTransition()

  function file() {
    if (!title.trim()) return
    startTransition(async () => {
      const saved = await fileResolutionAction({ title: title.trim(), description: description.trim() })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setTitle("")
    setDescription("")
  }

  function decide(id: string, role: string, decision: Decision) {
    startTransition(async () => {
      const res = await decideResolutionAction({ id, actorRole: role, actor: `${role} (demo)`, decision })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({ id: r.id, instance: r.instance, title: r.title, subtitle: r.description }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Move a resolution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="t">Resolution title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Approve ₹40,000 repair grant" /></div>
          <div className="space-y-1.5"><Label htmlFor="d">Details</Label><Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Background and amount" /></div>
          <Button onClick={file} disabled={pending || !title.trim()} className="w-full">Table resolution</Button>
          <p className="text-xs text-muted-foreground">Needs 3 SMC-member approvals (quorum), then the Principal counter-signs.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={SMC_RESOLUTION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
