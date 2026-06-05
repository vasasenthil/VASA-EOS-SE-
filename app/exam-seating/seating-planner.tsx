"use client"

import { useState } from "react"
import { HALLS, seatingPlan } from "@/lib/exam-seating"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function SeatingPlanner() {
  const [candidates, setCandidates] = useState(120)
  const plan = seatingPlan(candidates)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader><CardTitle>Candidates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c">Number of candidates</Label>
            <Input id="c" type="number" min={0} value={candidates} onChange={(e) => setCandidates(Number(e.target.value))} />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between"><span>Total hall capacity</span><span className="font-medium">{plan.totalCapacity}</span></div>
            <div className="flex justify-between"><span>Seated</span><span className="font-medium">{plan.seated}</span></div>
            <div className="flex justify-between"><span>Unseated</span><span className={plan.unseated > 0 ? "font-medium text-destructive" : "font-medium"}>{plan.unseated}</span></div>
          </div>
          {plan.unseated > 0 ? (
            <p className="text-xs text-destructive">Capacity exceeded — schedule another session or add a hall.</p>
          ) : (
            <p className="text-xs text-muted-foreground">All candidates seated.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hall allocation</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plan.allocations.map((a) => {
              const pct = a.hall.capacity ? Math.round((a.seats / a.hall.capacity) * 100) : 0
              return (
                <li key={a.hall.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{a.hall.name}</span>
                    <span>{a.seats}/{a.hall.capacity} {a.seats === a.hall.capacity && a.seats > 0 ? <Badge variant="secondary" className="ml-1">full</Badge> : null}</span>
                  </div>
                  <Progress value={pct} className="mt-1 h-2" />
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
