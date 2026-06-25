"use client"

import { useState, useTransition } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { SPORT_EVENTS, sportsSummary, type Medal, type SportResult } from "@/lib/sports"
import { recordResultAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const MEDAL_VARIANT: Record<Medal, "default" | "secondary" | "outline"> = {
  gold: "default",
  silver: "secondary",
  bronze: "secondary",
  participation: "outline",
}

export function SportsBoard({ initial = [] }: { initial?: SportResult[] }) {
  const [results, setResults] = useState<SportResult[]>(initial)
  const [event, setEvent] = useState(SPORT_EVENTS[0])
  const [student, setStudent] = useState(SIS_ROSTER[0]?.name ?? "")
  const [medal, setMedal] = useState<Medal>("gold")
  const [, startTransition] = useTransition()

  const s = sportsSummary(results)

  function record() {
    const optimistic: SportResult = { id: `sp-${Date.now()}`, event, student, medal, tenantId: DEFAULT_SCHOOL_NODE }
    setResults((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await recordResultAction({ event, student, medal })
      if (saved) setResults((prev) => prev.map((r) => (r.id === optimistic.id ? saved : r)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">🥇 Gold</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.gold}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">🥈 Silver</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.silver}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">🥉 Bronze</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.bronze}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Points</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.points}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Record result</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Event</Label>
              <select value={event} onChange={(e) => setEvent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SPORT_EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SIS_ROSTER.map((x) => <option key={x.apaarId} value={x.name}>{x.name} — {x.className}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Medal</Label>
              <select value={medal} onChange={(e) => setMedal(e.target.value as Medal)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option><option value="participation">Participation</option>
              </select>
            </div>
            <Button onClick={record} className="w-full">Record</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Results ({results.length} · {s.events} events)</CardTitle></CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{r.student}</span>
                      <span className="block text-xs text-muted-foreground">{r.event}</span>
                    </span>
                    <Badge variant={MEDAL_VARIANT[r.medal]}>{r.medal}</Badge>
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
