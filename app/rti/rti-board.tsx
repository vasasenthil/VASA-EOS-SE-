"use client"

import { useState } from "react"
import { nextRtiStatus, rtiSummary, daysLeft, isOverdue, type RtiRequest } from "@/lib/rti"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<RtiRequest["status"], "secondary" | "outline" | "default"> = {
  received: "secondary",
  under_process: "outline",
  replied: "default",
}

const NEXT_LABEL: Record<RtiRequest["status"], string> = {
  received: "Start processing",
  under_process: "Mark replied",
  replied: "Replied",
}

export function RtiBoard() {
  const today = new Date().toISOString().slice(0, 10)
  const [requests, setRequests] = useState<RtiRequest[]>([])
  const [applicant, setApplicant] = useState("")
  const [subject, setSubject] = useState("")
  const [receivedDate, setReceivedDate] = useState(today)

  const s = rtiSummary(requests, today)

  function add() {
    if (!applicant.trim() || !subject.trim()) return
    setRequests((prev) => [
      { id: `rt-${Date.now()}`, applicant: applicant.trim(), subject: subject.trim(), receivedDate, status: "received" },
      ...prev,
    ])
    setApplicant("")
    setSubject("")
  }

  function advance(id: string) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextRtiStatus(r.status) } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Replied</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.replied}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue (&gt;30d)</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.overdue > 0 ? "text-destructive" : ""}`}>{s.overdue}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log an RTI application</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="a">Applicant</Label><Input id="a" value={applicant} onChange={(e) => setApplicant(e.target.value)} placeholder="Applicant name" /></div>
            <div className="space-y-1.5"><Label htmlFor="s">Subject / information sought</Label><Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Teacher sanctioned strength" /></div>
            <div className="space-y-1.5"><Label htmlFor="d">Date received</Label><Input id="d" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} /></div>
            <Button onClick={add} disabled={!applicant.trim() || !subject.trim()} className="w-full">Log application</Button>
            <p className="text-xs text-muted-foreground">RTI Act 2005: the PIO must reply within 30 days. Overdue applications are flagged in red.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>RTI register ({requests.length})</CardTitle></CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => {
                  const left = daysLeft(r.receivedDate, today)
                  const overdue = isOverdue(r, today)
                  return (
                    <li key={r.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.applicant}</span>
                        <Badge variant={overdue ? "destructive" : STATUS_VARIANT[r.status]}>{overdue ? "overdue" : r.status}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{r.subject}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Received {r.receivedDate} · {r.status === "replied" ? "closed" : `${left} day(s) left`}
                        </span>
                        {r.status !== "replied" ? (
                          <Button size="sm" variant="outline" onClick={() => advance(r.id)}>{NEXT_LABEL[r.status]}</Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
