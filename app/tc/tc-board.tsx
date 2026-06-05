"use client"

import { useState } from "react"
import { TC_REASONS, nextTcStatus, tcSummary, tcNumber, type TcRequest } from "@/lib/tc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<TcRequest["status"], "secondary" | "outline" | "default"> = {
  requested: "secondary",
  verified: "outline",
  issued: "default",
}

const NEXT_LABEL: Record<TcRequest["status"], string> = {
  requested: "Verify records",
  verified: "Issue TC",
  issued: "Issued",
}

export function TcBoard() {
  const [requests, setRequests] = useState<TcRequest[]>([])
  const [seq, setSeq] = useState(1)
  const [student, setStudent] = useState("")
  const [cls, setCls] = useState("")
  const [reason, setReason] = useState(TC_REASONS[0])

  const s = tcSummary(requests)
  const year = new Date().getFullYear()

  function add() {
    if (!student.trim()) return
    setRequests((prev) => [
      { id: `tc-${Date.now()}`, student: student.trim(), cls: cls.trim() || "—", reason, status: "requested", date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ])
    setStudent("")
    setCls("")
  }

  function advance(id: string) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const next = nextTcStatus(r.status)
        // Stamp a TC number at the moment of issue.
        if (next === "issued" && r.status !== "issued") {
          setSeq((n) => n + 1)
          return { ...r, status: next, reason: `${r.reason} · ${tcNumber(year, seq)}` }
        }
        return { ...r, status: next }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Issued</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.issued}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.pending > 0 ? "text-destructive" : ""}`}>{s.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Next TC no.</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{tcNumber(year, seq)}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Request a transfer certificate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 10A" /></div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TC_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!student.trim()} className="w-full">Create request</Button>
            <p className="text-xs text-muted-foreground">Verify dues and records before issue. Production stamps a signed, verifiable TC and updates UDISE+/SIS.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>TC register ({requests.length})</CardTitle></CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.student} <span className="text-xs text-muted-foreground">· {r.cls}</span></span>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.reason} · {r.date}</p>
                    {r.status !== "issued" ? (
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => advance(r.id)}>{NEXT_LABEL[r.status]}</Button>
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
