"use client"

import { useState } from "react"
import { buildResults, type Division } from "@/lib/results"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const DIVISION_VARIANT: Record<Division, "default" | "secondary" | "destructive" | "outline"> = {
  Distinction: "default",
  First: "default",
  Second: "secondary",
  Third: "outline",
  Fail: "destructive",
}

const RESULTS = buildResults()

export function ResultsBoard() {
  const [published, setPublished] = useState<Set<string>>(new Set())

  const passCount = RESULTS.filter((r) => r.allPass).length
  const passPct = RESULTS.length ? Math.round((passCount / RESULTS.length) * 100) : 0

  function togglePublish(id: string) {
    setPublished((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Candidates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{RESULTS.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pass %</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{passPct}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{published.size}/{RESULTS.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground"> </CardTitle></CardHeader><CardContent><Button size="sm" onClick={() => setPublished(new Set(RESULTS.map((r) => r.apaarId)))}>Publish all</Button></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Results</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESULTS.map((r) => (
                <TableRow key={r.apaarId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.total}/{r.max}</TableCell>
                  <TableCell className="text-right">{r.percentage}%</TableCell>
                  <TableCell><Badge variant={DIVISION_VARIANT[r.division]}>{r.division}</Badge></TableCell>
                  <TableCell>{published.has(r.apaarId) ? <Badge>published</Badge> : <Badge variant="outline">draft</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(r.apaarId)}>
                      {published.has(r.apaarId) ? "Unpublish" : "Publish"}
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
