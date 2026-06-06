"use client"

import { useState, useTransition } from "react"
import { BAGLESS_TYPES, BAGLESS_TARGET, baglessSummary, type BaglessActivity } from "@/lib/bagless"
import { createActivityAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function BaglessBoard({ initial = [] }: { initial?: BaglessActivity[] }) {
  const [activities, setActivities] = useState<BaglessActivity[]>(initial)
  const [title, setTitle] = useState("")
  const [type, setType] = useState(BAGLESS_TYPES[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [classGroup, setClassGroup] = useState("")
  const [participants, setParticipants] = useState(30)
  const [, startTransition] = useTransition()

  const s = baglessSummary(activities)

  function add() {
    if (!title.trim() || participants < 0) return
    const optimistic: BaglessActivity = { id: `bl-${Date.now()}`, title: title.trim(), type, date, classGroup: classGroup.trim() || "All", participants }
    setActivities((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await createActivityAction({ title: optimistic.title, type: optimistic.type, date: optimistic.date, classGroup: optimistic.classGroup, participants: optimistic.participants })
      if (saved) setActivities((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)))
    })
    setTitle("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Activities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.activities}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bagless days</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.daysLogged}<span className="text-base text-muted-foreground"> / {BAGLESS_TARGET}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.participants}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Annual target</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.targetPct}%</div><Progress value={s.targetPct} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log a bagless-day activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="t">Activity title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Visit to potter's workshop" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {BAGLESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="cg">Class group</Label><Input id="cg" value={classGroup} onChange={(e) => setClassGroup(e.target.value)} placeholder="e.g. 6-8" /></div>
            <div className="space-y-1.5"><Label htmlFor="p">Participants</Label><Input id="p" type="number" min={0} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} /></div>
            <Button onClick={add} disabled={!title.trim()} className="w-full">Log activity</Button>
            <p className="text-xs text-muted-foreground">NEP 2020 recommends 10 bagless days a year for experiential, hands-on learning with local vocations and crafts.</p>
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
                      <Badge variant="outline">{a.participants} students</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.type} · {a.date} · {a.classGroup}</p>
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
