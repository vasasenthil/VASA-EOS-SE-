"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { resolveClass, promotionSummary, type PromotionDecision, type PromotionRow } from "@/lib/promotion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function PromotionBoard() {
  const [decisions, setDecisions] = useState<Record<string, PromotionDecision>>(() =>
    Object.fromEntries(SIS_ROSTER.map((s) => [s.apaarId, "promote" as PromotionDecision])),
  )

  const rows: PromotionRow[] = SIS_ROSTER.map((s) => ({
    apaarId: s.apaarId,
    name: s.name,
    from: s.className,
    decision: decisions[s.apaarId] ?? "promote",
  }))
  const summary = promotionSummary(rows)

  function toggle(apaarId: string) {
    setDecisions((d) => ({ ...d, [apaarId]: d[apaarId] === "promote" ? "detain" : "promote" }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Promoting</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.promoted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Detaining</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.detained}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Graduating</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.graduated}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Year-end rollover</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current class</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Next class</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.apaarId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.from}</TableCell>
                  <TableCell>
                    <Badge variant={r.decision === "promote" ? "default" : "destructive"}>{r.decision}</Badge>
                  </TableCell>
                  <TableCell className={resolveClass(r.from, r.decision) === "Graduated" ? "font-medium text-emerald-600" : ""}>
                    {resolveClass(r.from, r.decision)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => toggle(r.apaarId)}>
                      {r.decision === "promote" ? "Detain" : "Promote"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
