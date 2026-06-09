"use client"

import { useState, useTransition } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { buildDiagnostic, diagnosticSummary, LEVEL_LABELS, type LearningLevel } from "@/lib/diagnostic"
import type { DiagRound } from "@/lib/diagnostic/store"
import { saveRoundAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const LEVEL_VARIANT: Record<LearningLevel, "default" | "secondary" | "destructive"> = {
  at_grade: "default",
  one_below: "secondary",
  two_below: "destructive",
}

function seeded(): Record<string, number> {
  return Object.fromEntries(SIS_ROSTER.map((s, i) => [s.apaarId, 40 + ((i * 13) % 50)]))
}

const TODAY = new Date().toISOString().slice(0, 10)

export function DiagnosticBoard({ initial = [] }: { initial?: DiagRound[] }) {
  const [scores, setScores] = useState<Record<string, number>>(seeded)
  const [label, setLabel] = useState("Baseline round")
  const [rounds, setRounds] = useState<DiagRound[]>(initial)
  const [pending, startTransition] = useTransition()
  const results = buildDiagnostic(scores)
  const s = diagnosticSummary(results)

  function saveRound() {
    if (!label.trim()) return
    startTransition(async () => {
      const saved = await saveRoundAction({ date: TODAY, label: label.trim(), scores, summary: s })
      if (saved) setRounds((prev) => [saved, ...prev])
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">At grade</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.atGrade}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">One below</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.oneBelow}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Two+ below</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.twoBelow}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.avgScore}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Diagnostic results — enter scores</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="w-28">Score</TableHead>
                <TableHead>Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SIS_ROSTER.map((stu) => {
                const r = results.find((x) => x.apaarId === stu.apaarId)!
                return (
                  <TableRow key={stu.apaarId}>
                    <TableCell className="font-medium">{stu.name}</TableCell>
                    <TableCell>{stu.className}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={scores[stu.apaarId] ?? 0}
                        onChange={(e) => setScores((m) => ({ ...m, [stu.apaarId]: Number(e.target.value) }))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell><Badge variant={LEVEL_VARIANT[r.level]}>{LEVEL_LABELS[r.level]}</Badge></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <label htmlFor="lbl" className="text-xs font-medium text-muted-foreground">Round label</label>
              <Input id="lbl" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 w-56" />
            </div>
            <Button onClick={saveRound} disabled={pending || !label.trim()}>Save round</Button>
          </div>
          {rounds.length > 0 ? (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Saved rounds ({rounds.length})</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {rounds.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.date} · {r.label}</span>
                    <span>avg {r.summary.avgScore} · {r.summary.twoBelow} two+ below</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
