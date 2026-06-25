"use client"

import { useState, useTransition } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { resolveClass, promotionSummary, type PromotionDecision, type PromotionRow } from "@/lib/promotion"
import type { PromotionRun } from "@/lib/promotion/store"
import { saveRunAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function PromotionBoard({ initial = [] }: { initial?: PromotionRun[] }) {
  const [decisions, setDecisions] = useState<Record<string, PromotionDecision>>(() =>
    Object.fromEntries(SIS_ROSTER.map((s) => [s.apaarId, "promote" as PromotionDecision])),
  )
  const [label, setLabel] = useState("AY 2026-27 rollover")
  const [runs, setRuns] = useState<PromotionRun[]>(initial)
  const [pending, startTransition] = useTransition()

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

  function saveRun() {
    if (!label.trim()) return
    startTransition(async () => {
      const saved = await saveRunAction({ label: label.trim(), summary })
      if (saved) setRuns((prev) => [saved, ...prev])
    })
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

      <Card>
        <CardHeader><CardTitle>Commit rollover run</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <label htmlFor="run" className="text-xs font-medium text-muted-foreground">Run label</label>
            <Input id="run" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 w-64" />
          </div>
          <Button onClick={saveRun} disabled={pending || !label.trim()}>Save run</Button>
          {runs.length > 0 ? (
            <ul className="ml-auto w-full space-y-1 text-xs text-muted-foreground sm:w-auto">
              {runs.slice(0, 4).map((r) => (
                <li key={r.id} className="flex justify-between gap-4"><span>{r.label}</span><span>{r.promoted} promoted · {r.graduated} grad</span></li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
