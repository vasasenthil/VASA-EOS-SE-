"use client"

import { useState } from "react"
import { BUSES, advanceStop, busStatus, etaMinutes, fleetSummary, progressPct, type Bus, type BusStatus } from "@/lib/bus-tracking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STATUS_VARIANT: Record<BusStatus, "default" | "secondary" | "destructive"> = {
  "en-route": "secondary",
  arrived: "default",
  delayed: "destructive",
}

export function TrackingBoard() {
  const [buses, setBuses] = useState<Bus[]>(BUSES)
  const summary = fleetSummary(buses)

  function ping(id: string) {
    setBuses((prev) => prev.map((b) => (b.id === id ? { ...b, stopsDone: advanceStop(b.stopsDone, b.stopsTotal) } : b)))
  }
  function toggleDelay(id: string) {
    setBuses((prev) => prev.map((b) => (b.id === id ? { ...b, delayed: !b.delayed } : b)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Buses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.buses}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En route</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.enRoute}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Arrived</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.arrived}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delayed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.delayed}</div></CardContent></Card>
      </div>

      <div className="space-y-3">
        {buses.map((b) => {
          const st = busStatus(b)
          return (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{b.id} — {b.route}</CardTitle>
                  <Badge variant={STATUS_VARIANT[st]}>{st}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">stop {b.stopsDone}/{b.stopsTotal}</span>
                  <span>ETA <span className="font-medium">{etaMinutes(b)} min</span></span>
                </div>
                <Progress value={progressPct(b)} className="h-2" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => ping(b.id)} disabled={b.stopsDone >= b.stopsTotal}>Advance stop</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleDelay(b.id)}>{b.delayed ? "Clear delay" : "Mark delayed"}</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
