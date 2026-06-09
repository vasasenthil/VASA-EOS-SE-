"use client"

import { useState, useTransition } from "react"
import { nextDistStatus, distributionSummary, type DistRecord, type DistStatus } from "@/lib/distribution"
import { advanceDistributionAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_VARIANT: Record<DistStatus, "outline" | "secondary" | "default"> = {
  entitled: "outline",
  issued: "secondary",
  acknowledged: "default",
}

export function DistributionBoard({ initial = [] }: { initial?: DistRecord[] }) {
  const [records, setRecords] = useState<DistRecord[]>(initial)
  const [, startTransition] = useTransition()
  const s = distributionSummary(records)

  function advance(id: string) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextDistStatus(r.status) } : r)))
    startTransition(async () => {
      const saved = await advanceDistributionAction(id)
      if (saved) setRecords((prev) => prev.map((r) => (r.id === id ? saved : r)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Entitlements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Issued</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.issued}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Acknowledged</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.acknowledged}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Coverage</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.coveragePct}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Distribution pipeline</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student}</TableCell>
                  <TableCell>{r.item}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {r.status !== "acknowledged" ? (
                      <Button size="sm" variant="outline" onClick={() => advance(r.id)}>
                        Mark {nextDistStatus(r.status)}
                      </Button>
                    ) : null}
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
