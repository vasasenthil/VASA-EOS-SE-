"use client"

import { useState, useTransition } from "react"
import { VISIT_PURPOSES, isOnPremises, visitorSummary, type Visitor } from "@/lib/visitors"
import { checkInAction, checkOutAction } from "./actions"
import { DEFAULT_SCHOOL_NODE } from "@/lib/access/scope"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function now(): string {
  return new Date().toTimeString().slice(0, 5)
}

export function VisitorDesk({ initial = [] }: { initial?: Visitor[] }) {
  const [visitors, setVisitors] = useState<Visitor[]>(initial)
  const [name, setName] = useState("")
  const [purpose, setPurpose] = useState(VISIT_PURPOSES[0])
  const [meeting, setMeeting] = useState("")
  const [, startTransition] = useTransition()

  const s = visitorSummary(visitors)

  function checkIn() {
    if (!name.trim()) return
    const optimistic: Visitor = { id: `v-${Date.now()}`, name: name.trim(), purpose, meeting: meeting.trim(), inTime: now(), tenantId: DEFAULT_SCHOOL_NODE }
    setVisitors((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await checkInAction({ name: optimistic.name, purpose: optimistic.purpose, meeting: optimistic.meeting, inTime: optimistic.inTime })
      if (saved) setVisitors((prev) => prev.map((v) => (v.id === optimistic.id ? saved : v)))
    })
    setName("")
    setMeeting("")
  }
  function checkOut(id: string) {
    const t = now()
    setVisitors((prev) => prev.map((v) => (v.id === id && !v.outTime ? { ...v, outTime: t } : v)))
    startTransition(async () => {
      const saved = await checkOutAction(id, t)
      if (saved) setVisitors((prev) => prev.map((v) => (v.id === id ? saved : v)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">On premises</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.onPremises}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Checked out</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.checkedOut}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Check in a visitor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {VISIT_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="m">Meeting (person/dept)</Label><Input id="m" value={meeting} onChange={(e) => setMeeting(e.target.value)} /></div>
            <Button onClick={checkIn} disabled={!name.trim()} className="w-full">Check in</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Visitor log ({visitors.length})</CardTitle></CardHeader>
          <CardContent>
            {visitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visitors logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {visitors.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                    <div>
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.purpose}{v.meeting ? ` · ${v.meeting}` : ""} · in {v.inTime}{v.outTime ? ` · out ${v.outTime}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnPremises(v) ? <Badge variant="secondary">on premises</Badge> : <Badge>checked out</Badge>}
                      {isOnPremises(v) ? <Button size="sm" variant="outline" onClick={() => checkOut(v.id)}>Check out</Button> : null}
                    </div>
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
