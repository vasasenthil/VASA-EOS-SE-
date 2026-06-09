"use client"

import { useState } from "react"
import { EVENT_TYPES, SAMPLE_EVENTS, sortEvents, calendarSummary, type AcademicEvent, type EventType } from "@/lib/events"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TYPE_VARIANT: Record<EventType, "default" | "secondary" | "destructive" | "outline"> = {
  term: "default",
  exam: "destructive",
  holiday: "secondary",
  ptm: "outline",
  event: "outline",
}

export function CalendarBoard() {
  const [events, setEvents] = useState<AcademicEvent[]>(SAMPLE_EVENTS)
  const [title, setTitle] = useState("")
  const [type, setType] = useState<EventType>("event")
  const [date, setDate] = useState("")
  const [filter, setFilter] = useState<EventType | "all">("all")

  const summary = calendarSummary(events)
  const shown = sortEvents(filter === "all" ? events : events.filter((e) => e.type === filter))

  function add() {
    if (!title.trim() || !date) return
    setEvents((prev) => [...prev, { id: `ev-${Date.now()}`, title: title.trim(), type, date }])
    setTitle("")
    setDate("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader><CardTitle>Add to calendar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Half-yearly exams" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <Button onClick={add} disabled={!title.trim() || !date} className="w-full">Add event</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Calendar ({summary.total})</CardTitle>
            <select value={filter} onChange={(e) => setFilter(e.target.value as EventType | "all")} className="h-8 rounded-md border bg-background px-2 text-xs">
              <option value="all">All types</option>
              {EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {shown.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{e.title}</span>
                  <span className="block text-xs text-muted-foreground">{e.date}</span>
                </span>
                <Badge variant={TYPE_VARIANT[e.type]} className="capitalize">{e.type}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
