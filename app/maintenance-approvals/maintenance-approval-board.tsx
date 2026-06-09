"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { MAINTENANCE_WORKFLOW } from "@/lib/workflow/definitions"
import { ApprovalInbox, type InboxItem, type InboxAction } from "@/components/approval-inbox"
import { raiseTicketFlowAction, actTicketAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Priority = "low" | "medium" | "high"

interface Rec {
  id: string
  category: string
  description: string
  priority: Priority
  instance: WorkflowInstance
}

const CATEGORIES = ["Electrical", "Plumbing", "Furniture", "Building", "IT / Smart class", "Sanitation"]

const ROLES = [
  { role: "PRINCIPAL", label: "Principal (triage / close)" },
  { role: "VENDOR", label: "Vendor (works)" },
]

// Advance the works flow, or reject (cannot proceed).
const ACTIONS: InboxAction[] = [
  { decision: "approve", label: "Advance", variant: "default" },
  { decision: "reject", label: "Reject", variant: "outline" },
]

export function MaintenanceApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [pending, startTransition] = useTransition()

  function raise() {
    if (!description.trim()) return
    startTransition(async () => {
      const saved = await raiseTicketFlowAction({ category, description: description.trim(), priority })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setDescription("")
  }

  function decide(idv: string, role: string, decision: Decision) {
    startTransition(async () => {
      const res = await actTicketAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.category} · ${r.priority}`,
    subtitle: r.description,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Raise a maintenance ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="d">Description</Label><Input id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Class 7 fan not working" /></div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {(["low", "medium", "high"] as Priority[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Button onClick={raise} disabled={pending || !description.trim()} className="w-full">Raise ticket</Button>
          <p className="text-xs text-muted-foreground">Principal triages → Vendor completes → Principal verifies &amp; closes.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={MAINTENANCE_WORKFLOW} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} actions={ACTIONS} />
    </div>
  )
}
