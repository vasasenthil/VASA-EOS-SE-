"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { buildDiagnostic, diagnosticSummary, LEVEL_LABELS, type LearningLevel } from "@/lib/diagnostic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export function DiagnosticBoard() {
  const [scores, setScores] = useState<Record<string, number>>(seeded)
  const results = buildDiagnostic(scores)
  const s = diagnosticSummary(results)

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
        </CardContent>
      </Card>
    </div>
  )
}
