"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { HPC_SUBJECTS, computeHpc } from "@/lib/hpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function seededMarks(): Record<string, number> {
  return Object.fromEntries(HPC_SUBJECTS.map((s, i) => [s, 70 + ((i * 7) % 25)]))
}

export function HpcCard() {
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")
  const [marks, setMarks] = useState<Record<string, number>>(seededMarks)

  const hpc = computeHpc(marks)
  const name = SIS_ROSTER.find((s) => s.apaarId === student)?.name ?? "Student"

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Enter marks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {SIS_ROSTER.map((s) => (
                <option key={s.apaarId} value={s.apaarId}>{s.name} — {s.className}</option>
              ))}
            </select>
          </div>
          {HPC_SUBJECTS.map((subj) => (
            <div key={subj} className="space-y-1.5">
              <Label htmlFor={subj}>{subj}</Label>
              <Input
                id={subj}
                type="number"
                min={0}
                max={100}
                value={marks[subj] ?? 0}
                onChange={(e) => setMarks((m) => ({ ...m, [subj]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holistic Progress Card — {name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-sm">{hpc.percentage}%</Badge>
            <Badge variant="outline">CGPA {hpc.cgpa}</Badge>
            <Badge variant="secondary">{hpc.total}/{hpc.max}</Badge>
          </div>
          <ul className="divide-y text-sm">
            {hpc.subjects.map((r) => (
              <li key={r.subject} className="flex items-center justify-between py-2">
                <span>{r.subject}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono">{r.marks}</span>
                  <Badge variant="outline">{r.grade}</Badge>
                  <span className="text-xs text-muted-foreground">{r.points} pts</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{hpc.descriptor}</p>
        </CardContent>
      </Card>
    </div>
  )
}
