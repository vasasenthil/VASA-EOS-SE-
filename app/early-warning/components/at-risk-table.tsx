"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilePlus2, ShieldCheck } from "lucide-react"
import type { RiskAssessment, RiskLevel } from "@/lib/earlywarning"
import { openCaseAction } from "../actions"

const LEVEL_STYLE: Record<RiskLevel, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
}

export function AtRiskTable({ assessments }: { assessments: RiskAssessment[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function openCase(a: RiskAssessment) {
    const openedBy = window.prompt("Open a case — your name/role (the human acting on this AI flag):", "Class teacher")
    if (!openedBy) return
    start(async () => {
      const res = await openCaseAction({
        student: a.student, apaarId: a.apaarId, classLevel: a.classLevel, section: a.section,
        riskLevel: a.level, score: a.score, factors: a.factors.map((f) => f.label).join("; "),
        status: "Open", assignee: "", intervention: "", openedBy,
      })
      if (res.ok) router.refresh()
      else alert(res.reason ?? "Could not open the case.")
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="text-center">Risk</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Why (AI factors)</TableHead>
              <TableHead className="hidden lg:table-cell">Recommended next step</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground"><ShieldCheck className="mx-auto mb-2 h-8 w-8" />No students match — adjust the filters.</TableCell></TableRow>
            ) : (
              assessments.map((a) => (
                <TableRow key={`${a.student}-${a.apaarId}`} className={a.level === "High" ? "bg-red-50/40" : undefined}>
                  <TableCell className="font-medium">{a.student}<div className="text-xs text-muted-foreground">Class {a.classLevel}-{a.section}</div></TableCell>
                  <TableCell className="text-center"><Badge className={`${LEVEL_STYLE[a.level]} border-0`}>{a.level}</Badge></TableCell>
                  <TableCell className="text-center tabular-nums">{a.score}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{a.factors.length === 0 ? <span className="text-xs text-muted-foreground">No risk factors</span> : a.factors.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f.label}</Badge>)}</div></TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{a.recommendation}</TableCell>
                  <TableCell className="text-right">
                    {a.level !== "Low" ? (
                      <Button variant="outline" size="sm" disabled={pending} onClick={() => openCase(a)}><FilePlus2 className="mr-1 h-4 w-4" />Open case</Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
