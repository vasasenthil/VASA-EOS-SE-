"use client"

import { useState } from "react"
import { ROUTES, board, alight, freeSeats } from "@/lib/transport"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function AssignmentBoard() {
  const [occupied, setOccupied] = useState<Record<string, number>>(() =>
    Object.fromEntries(ROUTES.map((r) => [r.id, r.students])),
  )

  return (
    <div className="space-y-3">
      {ROUTES.map((r) => {
        const occ = occupied[r.id] ?? 0
        const free = freeSeats(r.capacity, occ)
        const pct = r.capacity ? Math.round((occ / r.capacity) * 100) : 0
        return (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{r.name}</CardTitle>
                <Badge variant="outline">{r.operator}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">CWSN: {r.cwsn}</span>
                <span>
                  <span className="font-medium">{occ}</span>/{r.capacity} assigned · <span className={free === 0 ? "text-destructive" : ""}>{free} free</span>
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setOccupied((o) => ({ ...o, [r.id]: board(o[r.id] ?? 0, r.capacity) }))} disabled={free === 0}>
                  Assign student
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOccupied((o) => ({ ...o, [r.id]: alight(o[r.id] ?? 0) }))} disabled={occ === 0}>
                  Remove
                </Button>
                {free === 0 ? <Badge variant="destructive" className="self-center">Full</Badge> : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
