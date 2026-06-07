"use client"

import { useState, useTransition } from "react"
import { TEACHERS } from "@/lib/timetable"
import { QUALITY } from "@/lib/quality"
import { nextTransferStatus, transferSummary, type TransferRequest, type TransferStatus } from "@/lib/postings"
import { fileTransferAction, advanceTransferAction, rejectTransferAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STATUS_VARIANT: Record<TransferStatus, "default" | "secondary" | "outline" | "destructive"> = {
  requested: "outline",
  approved: "secondary",
  posted: "default",
  rejected: "destructive",
}
const SCHOOLS = QUALITY.map((q) => q.name)

export function PostingsBoard({ initial = [] }: { initial?: TransferRequest[] }) {
  const [reqs, setReqs] = useState<TransferRequest[]>(initial)
  const [teacher, setTeacher] = useState(TEACHERS[0])
  const [fromSchool, setFromSchool] = useState(SCHOOLS[0])
  const [toSchool, setToSchool] = useState(SCHOOLS[1] ?? SCHOOLS[0])
  const [reason, setReason] = useState("")
  const [, startTransition] = useTransition()

  const s = transferSummary(reqs)

  function file() {
    const optimistic: TransferRequest = { id: `tr-${Date.now()}`, teacher, fromSchool, toSchool, reason: reason.trim(), status: "requested" }
    setReqs((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await fileTransferAction({ teacher, fromSchool, toSchool, reason: optimistic.reason })
      if (saved) setReqs((prev) => prev.map((r) => (r.id === optimistic.id ? saved : r)))
    })
    setReason("")
  }
  function advance(id: string) {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextTransferStatus(r.status) } : r)))
    startTransition(async () => {
      const saved = await advanceTransferAction(id)
      if (saved) setReqs((prev) => prev.map((r) => (r.id === id ? saved : r)))
    })
  }
  function reject(id: string) {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)))
    startTransition(async () => {
      const saved = await rejectTransferAction(id)
      if (saved) setReqs((prev) => prev.map((r) => (r.id === id ? saved : r)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Requested</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.requested}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.approved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Posted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.posted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.rejected}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>New transfer request</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>From school</Label>
              <select value={fromSchool} onChange={(e) => setFromSchool(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SCHOOLS.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>To school</Label>
              <select value={toSchool} onChange={(e) => setToSchool(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SCHOOLS.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="r">Reason</Label><Input id="r" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Mutual / health / proximity" /></div>
            <Button onClick={file} className="w-full">Submit request</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Requests ({reqs.length})</CardTitle></CardHeader>
          <CardContent>
            {reqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transfer requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {reqs.map((r) => (
                  <li key={r.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.teacher}</span>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.fromSchool} → {r.toSchool}{r.reason ? ` · ${r.reason}` : ""}</div>
                    {r.status !== "posted" && r.status !== "rejected" ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => advance(r.id)}>{r.status === "requested" ? "Approve" : "Post"}</Button>
                        <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
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
