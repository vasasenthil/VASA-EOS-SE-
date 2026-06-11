"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { FORUM_RESOLUTION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { ForumDetails } from "@/lib/forumflow/store"
import { fileForumAction, decideForumAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

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

const FORUMS = [
  "State Steering Committee",
  "Executive Steering",
  "Programme Management",
  "District Education Coordination",
  "AI Ethics Council",
]

export function ForumBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [forum, setForum] = useState(FORUMS[0])
  const [title, setTitle] = useState("")
  const [items, setItems] = useState("")
  const [requiresMinister, setRequiresMinister] = useState(false)
  const [pending, startTransition] = useTransition()

  function file() {
    if (!title.trim()) return
    const actionItems = items.split("\n").map((s) => s.trim()).filter(Boolean)
    startTransition(async () => {
      const saved = await fileForumAction({ forum, title: title.trim(), requiresMinister, actionItems })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setTitle("")
    setItems("")
    setRequiresMinister(false)
  }

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
          <div className="space-y-1.5">
            <Label htmlFor="forum">Forum</Label>
            <select
              id="forum"
              value={forum}
              onChange={(e) => setForum(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {FORUMS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Resolution / agenda subject</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Adopt revised CMBS menu" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="items">Action items (one per line)</Label>
            <textarea
              id="items"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={"Notify district offices\nPublish circular"}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="rm" checked={requiresMinister} onCheckedChange={(v) => setRequiresMinister(v === true)} />
            <Label htmlFor="rm" className="font-normal">
              Significant — requires Minister ratification
            </Label>
          </div>
          <Button onClick={file} disabled={pending || !title.trim()} className="w-full">
            Table resolution
          </Button>
          <p className="text-xs text-muted-foreground">
            RACI: Secretary convenes &amp; adopts the agenda, a quorum of 2 Directors adopts the resolution, and the
            Minister ratifies significant items (routine items skip ratification).
          </p>
        </CardContent>
      </Card>

      <ApprovalInbox def={FORUM_RESOLUTION} items={inbox} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
