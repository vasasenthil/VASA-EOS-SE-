"use client"

import { useState } from "react"
import { TEACHERS } from "@/lib/timetable"
import { LEAVE_TYPES, leaveDays, leaveSummary, type LeaveRequest, type LeaveStatus, type LeaveType } from "@/lib/leave"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<LeaveStatus, "default" | "secondary" | "destructive"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
}

export function LeaveBoard() {
  const [reqs, setReqs] = useState<LeaveRequest[]>([])
  const [teacher, setTeacher] = useState(TEACHERS[0])
  const [type, setType] = useState<LeaveType>("casual")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [reason, setReason] = useState("")

  const summary = leaveSummary(reqs)

  function file() {
    if (!from || !to || leaveDays(from, to) === 0) return
    setReqs((prev) => [
      { id: `lv-${Date.now()}`, teacher, type, from, to, reason: reason.trim(), status: "pending" },
      ...prev,
    ])
    setReason("")
  }

  function decide(id: string, status: LeaveStatus) {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.approved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.rejected}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Days approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.daysApproved}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle>Apply for leave</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {LEAVE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="f">From</Label><Input id="f" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="t">To</Label><Input id="t" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="r">Reason</Label><Input id="r" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            {from && to ? <p className="text-xs text-muted-foreground">{leaveDays(from, to)} day(s)</p> : null}
            <Button onClick={file} disabled={!from || !to || leaveDays(from, to) === 0} className="w-full">Submit request</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Requests ({reqs.length})</CardTitle></CardHeader>
          <CardContent>
            {reqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {reqs.map((r) => (
                  <li key={r.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.teacher}</span>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="capitalize">{r.type}</span>
                      <span>{r.from} → {r.to} ({leaveDays(r.from, r.to)}d)</span>
                      {r.reason ? <span>· {r.reason}</span> : null}
                    </div>
                    {r.status === "pending" ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => decide(r.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}>Reject</Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
