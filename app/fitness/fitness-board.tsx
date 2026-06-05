"use client"

import { useState } from "react"
import { FITNESS_TESTS, gradeFor, fitnessSummary, type FitnessRecord, type FitnessGrade } from "@/lib/fitness"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const GRADE_VARIANT: Record<FitnessGrade, "destructive" | "secondary" | "default"> = {
  "Needs improvement": "destructive",
  Healthy: "secondary",
  Excellent: "default",
}

export function FitnessBoard() {
  const [records, setRecords] = useState<FitnessRecord[]>([])
  const [student, setStudent] = useState("")
  const [cls, setCls] = useState("")
  const [test, setTest] = useState(FITNESS_TESTS[0])
  const [score, setScore] = useState(60)

  const s = fitnessSummary(records)

  function add() {
    if (!student.trim()) return
    setRecords((prev) => [
      { id: `ft-${Date.now()}`, student: student.trim(), cls: cls.trim() || "—", test, score, grade: gradeFor(score) },
      ...prev,
    ])
    setStudent("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Test records</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.records}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.students}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgScore}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Need attention</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.needsAttention > 0 ? "text-destructive" : ""}`}>{s.needsAttention}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Record a fitness test</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 7A" /></div>
            <div className="space-y-1.5">
              <Label>Test</Label>
              <select value={test} onChange={(e) => setTest(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {FITNESS_TESTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sc">Score (0–100 percentile)</Label>
              <div className="flex items-center gap-2">
                <input id="sc" type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="flex-1" />
                <span className="w-8 text-right text-xs tabular-nums">{score}</span>
              </div>
              <p className="text-xs text-muted-foreground">Grade: <span className="font-medium">{gradeFor(score)}</span></p>
            </div>
            <Button onClick={add} disabled={!student.trim()} className="w-full">Record test</Button>
            <p className="text-xs text-muted-foreground">Khelo India fitness assessment; low scores flag students for a PE follow-up plan.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fitness records ({records.length})</CardTitle></CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records yet.</p>
            ) : (
              <ul className="space-y-2">
                {records.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{r.student} <span className="text-xs text-muted-foreground">· {r.cls}</span></span>
                      <span className="block text-xs text-muted-foreground">{r.test} · {r.score}</span>
                    </span>
                    <Badge variant={GRADE_VARIANT[r.grade]}>{r.grade}</Badge>
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
