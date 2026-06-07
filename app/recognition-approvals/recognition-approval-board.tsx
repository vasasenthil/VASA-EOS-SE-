"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { RECOGNITION_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, type InboxItem } from "@/components/approval-inbox"
import { fileRecognitionAction, decideRecognitionAction } from "./actions"
import type { RecognitionType } from "@/lib/recognitionflow/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Rec {
  id: string
  school: string
  district: string
  type: RecognitionType
  instance: WorkflowInstance
}

const ROLES = [
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
  { role: "DIRECTOR", label: "Director (Directorate)" },
]

const TYPES: { key: RecognitionType; label: string }[] = [
  { key: "new", label: "New recognition" },
  { key: "renewal", label: "Renewal" },
  { key: "upgrade", label: "Upgrade" },
]

export function RecognitionApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [school, setSchool] = useState("")
  const [district, setDistrict] = useState("")
  const [type, setType] = useState<RecognitionType>("new")
  const [pending, startTransition] = useTransition()

  function file() {
    if (!school.trim() || !district.trim()) return
    startTransition(async () => {
      const saved = await fileRecognitionAction({ school: school.trim(), district: district.trim(), type })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setSchool("")
    setDistrict("")
  }

  function decide(id: string, role: string, decision: Decision) {
    startTransition(async () => {
      const res = await decideRecognitionAction({ id, actorRole: role, actor: `${role} (demo)`, decision })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.school,
    subtitle: `${r.district} · ${r.type}`,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>File a recognition application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="s">School</Label><Input id="s" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. GHSS Egmore" /></div>
          <div className="space-y-1.5"><Label htmlFor="d">District</Label><Input id="d" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Chennai" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as RecognitionType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <Button onClick={file} disabled={pending || !school.trim() || !district.trim()} className="w-full">Submit application</Button>
          <p className="text-xs text-muted-foreground">Routes BEO → DEO → Director; any tier can reject with the trail preserved.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={RECOGNITION_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
