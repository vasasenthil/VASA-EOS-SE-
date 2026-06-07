"use client"

import { useMemo, useState, useTransition } from "react"
import { LEAVE_TYPES, leaveDays, type LeaveType } from "@/lib/leave"
import { currentStep, progress, type WorkflowInstance } from "@/lib/workflow"
import { LEAVE_APPROVAL } from "@/lib/workflow/definitions"
import { fileLeaveFlowAction, decideLeaveFlowAction, type DecideInput } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface Rec {
  id: string
  teacher: string
  type: LeaveType
  from: string
  to: string
  days: number
  reason: string
  instance: WorkflowInstance
}

const APPROVER_ROLES: { role: string; label: string }[] = [
  { role: "PRINCIPAL", label: "Principal / HM" },
  { role: "BEO", label: "Block Education Officer" },
  { role: "DEO", label: "District Education Officer" },
]

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  in_progress: "secondary",
  approved: "default",
  rejected: "destructive",
}

export function LeaveApprovalBoard({ initial = [] }: { initial?: Rec[] }) {
  const [records, setRecords] = useState<Rec[]>(initial)
  const [teacher, setTeacher] = useState("")
  const [type, setType] = useState<LeaveType>("casual")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [reason, setReason] = useState("")
  const [asRole, setAsRole] = useState<string>("PRINCIPAL")
  const [pending, startTransition] = useTransition()

  const days = from && to ? leaveDays(from, to) : 0

  // Requests awaiting the currently-selected approver role.
  const inbox = useMemo(
    () =>
      records.filter(
        (r) => r.instance.status === "in_progress" && currentStep(LEAVE_APPROVAL, r.instance)?.approverRole === asRole,
      ),
    [records, asRole],
  )

  function file() {
    if (!teacher.trim() || !from || !to || days === 0) return
    startTransition(async () => {
      const saved = await fileLeaveFlowAction({ teacher: teacher.trim(), type, from, to, reason: reason.trim() })
      if (saved) setRecords((prev) => [saved as Rec, ...prev])
    })
    setTeacher("")
    setReason("")
  }

  function decide(id: string, decision: "approve" | "reject") {
    const input: DecideInput = { id, actorRole: asRole, actor: `${asRole} (demo)`, decision }
    startTransition(async () => {
      const res = await decideLeaveFlowAction(input)
      if (res.ok && res.record) setRecords((prev) => prev.map((r) => (r.id === id ? (res.record as Rec) : r)))
    })
  }

  const counts = {
    total: records.length,
    inProgress: records.filter((r) => r.instance.status === "in_progress").length,
    approved: records.filter((r) => r.instance.status === "approved").length,
    rejected: records.filter((r) => r.instance.status === "rejected").length,
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{counts.approved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${counts.rejected > 0 ? "text-destructive" : ""}`}>{counts.rejected}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <Card>
          <CardHeader><CardTitle>Apply for leave</CardTitle></CardHeader>
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

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Approver inbox</CardTitle>
              <select value={asRole} onChange={(e) => setAsRole(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">
                {APPROVER_ROLES.map((a) => <option key={a.role} value={a.role}>Acting as: {a.label}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Awaiting your action ({inbox.length})</p>
              {inbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing in this inbox. Switch role or submit a request.</p>
              ) : (
                <ul className="space-y-2">
                  {inbox.map((r) => (
                    <li key={r.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.teacher} · {r.days}d</span>
                        <Badge variant="secondary">{currentStep(LEAVE_APPROVAL, r.instance)?.name}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.type} · {r.from} → {r.to}{r.reason ? ` · ${r.reason}` : ""}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => decide(r.id, "reject")} disabled={pending}>Reject</Button>
                        <Button size="sm" onClick={() => decide(r.id, "approve")} disabled={pending}>Approve</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">All requests ({records.length})</p>
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requests yet.</p>
              ) : (
                <ul className="space-y-2">
                  {records.map((r) => {
                    const p = progress(LEAVE_APPROVAL, r.instance)
                    return (
                      <li key={r.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.teacher} <span className="text-xs text-muted-foreground">· {r.days}d</span></span>
                          <Badge variant={STATUS_VARIANT[r.instance.status]}>{r.instance.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="mt-2"><Progress value={p.pct} className="h-1.5" /></div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Step {p.step}/{p.total}{p.currentStepName ? ` · awaiting ${p.currentStepName}` : " · complete"}
                        </p>
                        {r.instance.history.length > 0 ? (
                          <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
                            {r.instance.history.map((h, i) => (
                              <li key={i}>
                                {h.decision === "approve" ? "✓" : "✗"} {h.actorRole} {h.decision}d{h.note ? ` — ${h.note}` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
