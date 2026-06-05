"use client"

import { useState } from "react"
import { VOC_TRADES, NSQF_LEVELS, vocSummary, type VocEnrolment } from "@/lib/vocational"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VocationalBoard() {
  const [enrolments, setEnrolments] = useState<VocEnrolment[]>([])
  const [student, setStudent] = useState("")
  const [trade, setTrade] = useState(VOC_TRADES[0])
  const [level, setLevel] = useState(NSQF_LEVELS[0])

  const s = vocSummary(enrolments)

  function add() {
    if (!student.trim()) return
    setEnrolments((prev) => [
      { id: `vc-${Date.now()}`, student: student.trim(), trade, level, certified: false },
      ...prev,
    ])
    setStudent("")
  }

  function certify(id: string) {
    setEnrolments((prev) => prev.map((e) => (e.id === id ? { ...e, certified: true } : e)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Enrolments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Certified (NSQF)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.certified}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Trades offered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.trades}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Enrol in a vocational trade</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5">
              <Label>Trade</Label>
              <select value={trade} onChange={(e) => setTrade(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {VOC_TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>NSQF level</Label>
              <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {NSQF_LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!student.trim()} className="w-full">Enrol student</Button>
            <p className="text-xs text-muted-foreground">NEP 2020 integrates vocational education from Class 6; certification maps to the National Skills Qualification Framework.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Enrolments ({enrolments.length})</CardTitle></CardHeader>
          <CardContent>
            {enrolments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolments yet.</p>
            ) : (
              <ul className="space-y-2">
                {enrolments.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{e.student}</span>
                      <span className="block text-xs text-muted-foreground">{e.trade} · NSQF Level {e.level}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={e.certified ? "default" : "secondary"}>{e.certified ? "Certified" : "In progress"}</Badge>
                      {!e.certified ? <Button size="sm" variant="outline" onClick={() => certify(e.id)}>Certify</Button> : null}
                    </span>
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
