"use client"

import { useState, useTransition } from "react"
import { ECO_ACTIVITIES, ecoSummary, type EcoActivity } from "@/lib/eco"
import { createActivityAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function EcoBoard({ initial = [] }: { initial?: EcoActivity[] }) {
  const [activities, setActivities] = useState<EcoActivity[]>(initial)
  const [title, setTitle] = useState("")
  const [type, setType] = useState(ECO_ACTIVITIES[0])
  const [saplings, setSaplings] = useState(0)
  const [survived, setSurvived] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [, startTransition] = useTransition()

  const s = ecoSummary(activities)
  const isPlantation = type === "Tree plantation"

  function add() {
    if (!title.trim()) return
    const optimistic: EcoActivity = { id: `ec-${Date.now()}`, title: title.trim(), type, saplings: isPlantation ? saplings : 0, survived: isPlantation ? survived : 0, date, tenantId: DEFAULT_SCHOOL_NODE }
    setActivities((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createActivityAction({ title: optimistic.title, type: optimistic.type, saplings: optimistic.saplings, survived: optimistic.survived, date: optimistic.date })
      if (saved) setActivities((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setTitle("")
    setSaplings(0)
    setSurvived(0)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Activities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activities}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saplings planted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.saplingsPlanted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saplings survived</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.saplingsSurvived}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Survival rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.survivalPct}%</div><Progress value={s.survivalPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log an eco-club activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Activity title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. World Environment Day drive" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {ECO_ACTIVITIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {isPlantation ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label htmlFor="sp">Saplings planted</Label><Input id="sp" type="number" min={0} value={saplings} onChange={(e) => setSaplings(Number(e.target.value))} /></div>
                <div className="space-y-1.5"><Label htmlFor="sv">Survived</Label><Input id="sv" type="number" min={0} value={survived} onChange={(e) => setSurvived(Number(e.target.value))} /></div>
              </div>
            ) : null}
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <Button onClick={add} disabled={!title.trim()} className="w-full">Log activity</Button>
            <p className="text-xs text-muted-foreground">Survival is tracked at follow-up; counts feed the Green School / ESG score.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity log ({activities.length})</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.title}</span>
                      <Badge variant="outline">{a.type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.date}{a.saplings > 0 ? ` · ${a.survived}/${a.saplings} saplings surviving` : ""}
                    </p>
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
