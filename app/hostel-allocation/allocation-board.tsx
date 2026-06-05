"use client"

import { useState } from "react"
import { HOSTELS, allocate, vacate } from "@/lib/hostel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function AllocationBoard() {
  const [occupied, setOccupied] = useState<Record<string, number>>(() =>
    Object.fromEntries(HOSTELS.map((h) => [h.id, h.occupied])),
  )

  function doAllocate(id: string, capacity: number) {
    setOccupied((o) => ({ ...o, [id]: allocate(o[id] ?? 0, capacity) }))
  }
  function doVacate(id: string) {
    setOccupied((o) => ({ ...o, [id]: vacate(o[id] ?? 0) }))
  }

  return (
    <div className="space-y-3">
      {HOSTELS.map((h) => {
        const occ = occupied[h.id] ?? 0
        const free = Math.max(0, h.capacity - occ)
        const pct = h.capacity ? Math.round((occ / h.capacity) * 100) : 0
        return (
          <Card key={h.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{h.name}</CardTitle>
                <Badge variant="outline">{h.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{h.district}</span>
                <span>
                  <span className="font-medium">{occ}</span>/{h.capacity} occupied · <span className={free === 0 ? "text-destructive" : ""}>{free} free</span>
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => doAllocate(h.id, h.capacity)} disabled={free === 0}>
                  Allocate bed
                </Button>
                <Button size="sm" variant="outline" onClick={() => doVacate(h.id)} disabled={occ === 0}>
                  Vacate
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
