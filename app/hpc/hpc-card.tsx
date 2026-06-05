"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { HPC_SUBJECTS, computeHpc, CO_SCHOLASTIC_DOMAINS, computeCoScholastic } from "@/lib/hpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function seededMarks(): Record<string, number> {
  return Object.fromEntries(HPC_SUBJECTS.map((s, i) => [s, 70 + ((i * 7) % 25)]))
}

function seededCo(): Record<string, number> {
  return Object.fromEntries(CO_SCHOLASTIC_DOMAINS.map((d, i) => [d, 3 + (i % 3)]))
}

export function HpcCard() {
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")
  const [marks, setMarks] = useState<Record<string, number>>(seededMarks)
  const [co, setCo] = useState<Record<string, number>>(seededCo)

  const hpc = computeHpc(marks)
  const coResults = computeCoScholastic(co)
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
          <div className="pt-2">
            <Label className="text-sm font-medium">Co-scholastic (rate 1-5)</Label>
            {CO_SCHOLASTIC_DOMAINS.map((d) => (
              <div key={d} className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{d}</span>
                <select
                  value={co[d] ?? 3}
                  onChange={(e) => setCo((c) => ({ ...c, [d]: Number(e.target.value) }))}
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
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

          <div>
            <p className="mb-1 text-sm font-medium">Co-scholastic</p>
            <ul className="divide-y text-sm">
              {coResults.map((c) => (
                <li key={c.domain} className="flex items-center justify-between py-2">
                  <span>{c.domain}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{c.rating}/5</span>
                    <Badge variant="outline">{c.grade}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
