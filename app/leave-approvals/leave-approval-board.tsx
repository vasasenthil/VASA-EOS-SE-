"use client"

import { useState, useTransition } from "react"
import { LEAVE_TYPES, leaveDays, type LeaveType } from "@/lib/leave"
import type { Decision, WorkflowInstance } from "@/lib/workflow"
import { LEAVE_APPROVAL } from "@/lib/workflow/definitions"
import { ApprovalInbox, inboxDetails, detailRow, type InboxItem } from "@/components/approval-inbox"
import type { LeaveDetails } from "@/lib/leaveflow/store"
import { fileLeaveFlowAction, decideLeaveFlowAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Rec {
  id: string
  teacher: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  instance: WorkflowInstance
  details?: LeaveDetails
}

const ROLES = [
  { role: "PRINCIPAL", label: "Principal / HM" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
]

export function LeaveApprovalBoard({ initial = [], sessionRole }: { initial?: Rec[]; sessionRole?: string | null }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [teacher, setTeacher] = useState("")
  const [type, setType] = useState<LeaveType>("casual")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  const days = from && to ? leaveDays(from, to) : 0

  function file() {
    if (!teacher.trim() || !from || !to || days === 0) return
    startTransition(async () => {
      const saved = await fileLeaveFlowAction({ teacher: teacher.trim(), type, from, to, reason: reason.trim() })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setTeacher("")
    setReason("")
  }

  function decide(id: string, role: string, decision: Decision, note?: string) {
    startTransition(async () => {
      const res = await decideLeaveFlowAction({ id, actorRole: role, actor: `${role} (demo)`, decision, note })
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const items: InboxItem[] = records.map((r) => ({
    id: r.id,
    instance: r.instance,
    title: `${r.teacher} · ${r.days}d`,
    subtitle: `${r.type} · ${r.from} → ${r.to}${r.reason ? ` · ${r.reason}` : ""}`,
    details: inboxDetails([
      detailRow("Substitute", r.details?.substitute),
      detailRow("Contact", r.details?.contact),
      detailRow("Medical cert.", r.details?.medicalCert ? "Attached" : undefined),
    ]),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Apply for leave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="tc">Teacher</Label><Input id="tc" value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Teacher name" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {LEAVE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label htmlFor="f">From</Label><Input id="f" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="t">To</Label><Input id="t" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="r">Reason</Label><Input id="r" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" /></div>
          {days > 0 ? (
            <p className="text-xs text-muted-foreground">
              {days} day(s) → routes to: Principal{days > 5 ? " → BEO" : ""}{days > 15 ? " → DEO" : ""}
            </p>
          ) : null}
          <Button onClick={file} disabled={pending || !teacher.trim() || !from || !to || days === 0} className="w-full">Submit request</Button>
        </CardContent>
      </Card>

      <ApprovalInbox def={LEAVE_APPROVAL} items={items} roles={ROLES} onDecide={decide} pending={pending} sessionRole={sessionRole} />
    </div>
  )
}
