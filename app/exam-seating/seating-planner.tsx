"use client"

import { useState, useTransition } from "react"
import { HALLS, seatingPlan } from "@/lib/exam-seating"
import type { SeatingSnapshot } from "@/lib/exam-seating/store"
import { savePlanAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function SeatingPlanner({ initial = [] }: { initial?: SeatingSnapshot[] }) {
  const [candidates, setCandidates] = useState(120)
  const [label, setLabel] = useState("Half-yearly")
  const [plans, setPlans] = useState<SeatingSnapshot[]>(initial)
  const [pending, startTransition] = useTransition()
  const plan = seatingPlan(candidates)

  function save() {
    if (!label.trim()) return
    startTransition(async () => {
      const saved = await savePlanAction({ label: label.trim(), candidates, seated: plan.seated, unseated: plan.unseated })
      if (saved) setPlans((prev) => [saved, ...prev])
    })
  }

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
          <div className="space-y-1.5 border-t pt-3">
            <Label htmlFor="lbl">Plan label</Label>
            <Input id="lbl" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <Button onClick={save} disabled={pending || !label.trim()} className="w-full">Save plan</Button>
          {plans.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {plans.slice(0, 5).map((p) => (
                <li key={p.id} className="flex justify-between"><span>{p.label}</span><span>{p.candidates} cand · {p.unseated} unseated</span></li>
              ))}
            </ul>
          ) : null}
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
