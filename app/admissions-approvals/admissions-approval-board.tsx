"use client"

import { useState, useTransition } from "react"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { ADMISSION_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, type InboxItem } from "@/components/approval-inbox"
import { fileApplicantAction, decideApplicantAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Rec {
  id: string
  name: string
  dob: string
  gender: string
  category: string
  className: string
  apaarId?: string
  instance: WorkflowInstance
}

const ROLES = [
  { role: "ACADEMIC_HEAD", label: "Academic Head (verify)" },
  { role: "PRINCIPAL", label: "Principal (enrol)" },
]

const CATEGORIES = ["General", "BC", "MBC", "SC", "ST", "EWS"]

export function AdmissionsApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [name, setName] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("Female")
  const [category, setCategory] = useState("General")
  const [className, setClassName] = useState("")
  const [pending, startTransition] = useTransition()

  function file() {
    if (!name.trim() || !dob || !className.trim()) return
    startTransition(async () => {
      const saved = await fileApplicantAction({ name: name.trim(), dob, gender, category, className: className.trim() })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setName("")
    setDob("")
    setClassName("")
  }

  function decide(idv: string, role: string, decision: Decision) {
    startTransition(async () => {
      const res = await decideApplicantAction({ id: idv, actorRole: role, actor: `${role} (demo)`, decision })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === idv ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: r.name,
    subtitle: `Class ${r.className} · ${r.category}${r.apaarId ? ` · ${r.apaarId}` : ""}`,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>New admission application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="n">Student name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label htmlFor="d">Date of birth</Label><Input id="d" type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class</Label><Input id="c" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. 1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {["Female", "Male", "Other"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={file} disabled={pending || !name.trim() || !dob || !className.trim()} className="w-full">Submit application</Button>
          <p className="text-xs text-muted-foreground">Academic Head verifies → Principal enrols → APAAR id minted automatically.</p>
        </CardContent>
      </Card>

      <ApprovalInbox def={ADMISSION_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
