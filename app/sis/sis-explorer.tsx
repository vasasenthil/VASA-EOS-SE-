"use client"

import { useState } from "react"
import type { SisStudent } from "@/lib/sis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SisExplorer({ students }: { students: SisStudent[] }) {
  const [selectedId, setSelectedId] = useState(students[0]?.apaarId)
  const selected = students.find((s) => s.apaarId === selectedId) ?? students[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.apaarId} data-state={s.apaarId === selectedId ? "selected" : undefined}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category}</div>
                  </TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>
                    <Badge variant={s.attendancePct >= 85 ? "default" : "destructive"}>{s.attendancePct}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(s.apaarId)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>{selected.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-mono text-xs">{selected.apaarId}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{selected.className}</Badge>
              <Badge variant="outline">{selected.category}</Badge>
              <Badge variant="outline">{selected.gender}</Badge>
              <Badge variant="outline">{selected.motherTongue}</Badge>
              <Badge variant={selected.nipunStatus === "on-track" ? "default" : "secondary"}>
                NIPUN {selected.nipunStatus}
              </Badge>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Schemes</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selected.schemes.map((sc) => (
                  <Badge key={sc} variant="secondary">
                    {sc}
                  </Badge>
                ))}
              </div>
            </div>

            {selected.cwsn ? (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">CWSN (RPwD)</div>
                <p>
                  #{selected.cwsn.category} — {selected.cwsn.label}
                </p>
              </div>
            ) : null}

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Risk flags</div>
              {selected.riskFlags.length === 0 ? (
                <p className="text-muted-foreground">None — on track.</p>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selected.riskFlags.map((r) => (
                    <Badge key={r} variant="destructive">
                      {r}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
