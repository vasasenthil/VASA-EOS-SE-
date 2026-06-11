"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { GRIEVANCE_ESCALATION } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem, type InboxAction } from "@/components/approval-inbox"
import type { GrievanceDetails } from "@/lib/grievanceflow/store"
import { fileGrievanceFlowAction, actGrievanceAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Rec {
  id: string
  applicant: string
  category: string
  description: string
  instance: WorkflowInstance
  details?: GrievanceDetails
}

const GRIEVANCE_CATEGORIES = ["Scheme / DBT", "Fees", "Safety", "Teacher conduct", "Infrastructure", "Other"]

const ROLES = [
  { role: "PRINCIPAL", label: "Principal (school)" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
]

// Each tier may resolve the grievance or escalate it to the next tier.
const ACTIONS: InboxAction[] = [
  { decision: "resolve", label: "Resolve", variant: "default" },
  { decision: "approve", label: "Escalate", variant: "secondary" },
  { decision: "reject", label: "Dismiss", variant: "outline" },
]

export function GrievanceApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [applicant, setApplicant] = useState("")
  const [category, setCategory] = useState(GRIEVANCE_CATEGORIES[0])
  const [description, setDescription] = useState("")
  const [pending, startTransition] = useTransition()

  function file() {
    if (!applicant.trim() || !description.trim()) return
    startTransition(async () => {
      const saved = await fileGrievanceFlowAction({ applicant: applicant.trim(), category, description: description.trim() })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setApplicant("")
    setDescription("")
  }

  function decide(idv: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await actGrievanceAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.applicant} · ${r.category}`,
    subtitle: r.description,
    details: inboxDetails([
      detailRow("Urgency", r.details?.urgency),
      detailRow("School", r.details?.school),
      detailRow("District", r.details?.district),
      detailRow("Relationship", r.details?.relationship),
      detailRow("Phone", r.details?.contactPhone),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>File a grievance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="a">Applicant</Label><Input id="a" value={applicant} onChange={(e) => setApplicant(e.target.value)} placeholder="Name" /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {GRIEVANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="d">Description</Label><Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" /></div>
          <Button onClick={file} disabled={pending || !applicant.trim() || !description.trim()} className="w-full">Submit grievance</Button>
          <p className="text-xs text-muted-foreground">Starts at the school; each tier can resolve or escalate to the next.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={GRIEVANCE_ESCALATION} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} actions={ACTIONS} />
    </div>
  )
}
