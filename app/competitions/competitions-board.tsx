"use client"

import { useState } from "react"
import { COMP_LEVELS, MEDALS, compSummary, type CompEntry, type Medal } from "@/lib/competitions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MEDAL_VARIANT: Record<Medal, "default" | "secondary" | "outline"> = {
  Gold: "default",
  Silver: "secondary",
  Bronze: "secondary",
  Participation: "outline",
}

export function CompetitionsBoard() {
  const [entries, setEntries] = useState<CompEntry[]>([])
  const [student, setStudent] = useState("")
  const [event, setEvent] = useState("")
  const [level, setLevel] = useState(COMP_LEVELS[0])
  const [medal, setMedal] = useState<Medal>("Participation")

  const s = compSummary(entries)

  function add() {
    if (!student.trim() || !event.trim()) return
    setEntries((prev) => [
      { id: `cp-${Date.now()}`, student: student.trim(), event: event.trim(), level, medal },
      ...prev,
    ])
    setStudent("")
    setEvent("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.entries}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Medals won</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.medals}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gold</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.gold}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Participation</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.participation}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Record a result</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="st">Student</Label><Input id="st" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student name" /></div>
            <div className="space-y-1.5"><Label htmlFor="ev">Event / competition</Label><Input id="ev" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. Maths Olympiad" /></div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {COMP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Result</Label>
              <select value={medal} onChange={(e) => setMedal(e.target.value as Medal)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {MEDALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Button onClick={add} disabled={!student.trim() || !event.trim()} className="w-full">Record result</Button>
            <p className="text-xs text-muted-foreground">Results build the student&apos;s achievement portfolio and feed the holistic progress card.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Results ({entries.length})</CardTitle></CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{e.student}</span>
                      <span className="block text-xs text-muted-foreground">{e.event} · {e.level} level</span>
                    </span>
                    <Badge variant={MEDAL_VARIANT[e.medal]}>{e.medal}</Badge>
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
