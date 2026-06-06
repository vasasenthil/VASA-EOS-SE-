"use client"

import { useState, useTransition } from "react"
import { RTE_CATEGORIES, nextRteStatus, rteSummary, type RteApplicant } from "@/lib/rte"
import { createApplicantAction, advanceApplicantAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

const STATUS_VARIANT: Record<RteApplicant["status"], "secondary" | "outline" | "default"> = {
  applied: "secondary",
  verified: "outline",
  allotted: "outline",
  admitted: "default",
}

const NEXT_LABEL: Record<RteApplicant["status"], string> = {
  applied: "Verify",
  verified: "Allot seat",
  allotted: "Confirm admission",
  admitted: "Admitted",
}

export function RteBoard({ initial = [] }: { initial?: RteApplicant[] }) {
  const [applicants, setApplicants] = useState<RteApplicant[]>(initial)
  const [quotaSeats, setQuotaSeats] = useState(20)
  const [name, setName] = useState("")
  const [category, setCategory] = useState(RTE_CATEGORIES[0])
  const [, startTransition] = useTransition()

  const s = rteSummary(applicants, quotaSeats)

  function add() {
    if (!name.trim()) return
    const optimistic: RteApplicant = {
      id: `rt-${Date.now()}`,
      name: name.trim(),
      category,
      status: "applied",
      date: new Date().toISOString().slice(0, 10),
    }
    setApplicants((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createApplicantAction({ name: optimistic.name, category: optimistic.category })
      if (saved) setApplicants((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setName("")
  }

  function advance(id: string) {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextRteStatus(a.status) } : a)))
    startTransition(async () => {
      const saved = await advanceApplicantAction(id)
      if (saved) setApplicants((prev) => prev.map((a) => (a.id === id ? saved : a)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Quota seats (25%)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.quotaSeats}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Applicants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.applied}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Admitted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.admitted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Seats filled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.fillPct}%</div><Progress value={Math.min(100, s.fillPct)} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Add RTE applicant</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="q">Reserved seats (25% of intake)</Label><Input id="q" type="number" min={0} value={quotaSeats} onChange={(e) => setQuotaSeats(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label htmlFor="n">Child name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Applicant name" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {RTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!name.trim()} className="w-full">Add applicant</Button>
            <p className="text-xs text-muted-foreground">RTE Sec 12(1)(c): 25% seats for EWS/DG. Admitted seats draw State reimbursement; production links to the RTE portal.</p>
            {s.vacant === 0 && s.quotaSeats > 0 ? <p className="text-xs text-emerald-600">Quota fully filled.</p> : <p className="text-xs text-muted-foreground">{s.vacant} seat(s) vacant.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Applicants ({applicants.length})</CardTitle></CardHeader>
          <CardContent>
            {applicants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applicants added yet.</p>
            ) : (
              <ul className="space-y-2">
                {applicants.map((a) => (
                  <li key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.name}</span>
                      <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.category} · {a.date}</p>
                    {a.status !== "admitted" ? (
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => advance(a.id)}>{NEXT_LABEL[a.status]}</Button>
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
