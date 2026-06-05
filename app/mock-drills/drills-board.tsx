"use client"

import { useState } from "react"
import { DRILL_TYPES, DRILL_TARGET_SEC, drillSummary, isWithinTarget, type Drill } from "@/lib/drills"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function DrillsBoard() {
  const [drills, setDrills] = useState<Drill[]>([])
  const [type, setType] = useState(DRILL_TYPES[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [evacTimeSec, setEvacTimeSec] = useState(180)
  const [participants, setParticipants] = useState(200)
  const [observations, setObservations] = useState("")

  const s = drillSummary(drills)

  function add() {
    setDrills((prev) => [
      { id: `dr-${Date.now()}`, type, date, evacTimeSec, participants, observations: observations.trim() },
      ...prev,
    ])
    setObservations("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Drills held</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.participants}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg evacuation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(s.avgEvacSec)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Within target</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.withinTarget}<span className="text-base text-muted-foreground"> / {s.total}</span></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log a drill</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Drill type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {DRILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="ev">Evacuation time (seconds)</Label>
              <Input id="ev" type="number" min={0} value={evacTimeSec} onChange={(e) => setEvacTimeSec(Number(e.target.value))} />
              <p className={`text-xs ${evacTimeSec > 0 && evacTimeSec <= DRILL_TARGET_SEC ? "text-emerald-600" : "text-destructive"}`}>
                Target ≤ {fmt(DRILL_TARGET_SEC)} (NDMA)
              </p>
            </div>
            <div className="space-y-1.5"><Label htmlFor="p">Participants</Label><Input id="p" type="number" min={0} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label htmlFor="o">Observations</Label><Input id="o" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="e.g. Stairwell B bottleneck" /></div>
            <Button onClick={add} className="w-full">Log drill</Button>
            <p className="text-xs text-muted-foreground">Schools should conduct periodic mock drills; slow evacuations trigger a review of routes and assembly points.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Drill log ({drills.length})</CardTitle></CardHeader>
          <CardContent>
            {drills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drills logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {drills.map((d) => (
                  <li key={d.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.type} drill</span>
                      <Badge variant={isWithinTarget(d) ? "default" : "destructive"}>{fmt(d.evacTimeSec)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{d.date} · {d.participants} participants{d.observations ? ` · ${d.observations}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
