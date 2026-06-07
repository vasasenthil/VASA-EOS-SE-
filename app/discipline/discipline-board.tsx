"use client"

import { useState, useTransition } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { INCIDENT_TYPES, disciplineSummary, type Incident, type Severity } from "@/lib/discipline"
import { logIncidentAction, resolveIncidentAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SEVERITY_VARIANT: Record<Severity, "secondary" | "default" | "destructive"> = {
  minor: "secondary",
  moderate: "default",
  serious: "destructive",
}
const TODAY = new Date().toISOString().slice(0, 10)

export function DisciplineBoard({ initial = [] }: { initial?: Incident[] }) {
  const [incidents, setIncidents] = useState<Incident[]>(initial)
  const [student, setStudent] = useState(SIS_ROSTER[0]?.name ?? "")
  const [type, setType] = useState(INCIDENT_TYPES[0])
  const [severity, setSeverity] = useState<Severity>("minor")
  const [action, setAction] = useState("")
  const [, startTransition] = useTransition()

  const s = disciplineSummary(incidents)

  function log() {
    const optimistic: Incident = { id: `i-${Date.now()}`, student, type, severity, action: action.trim(), date: TODAY, status: "open" }
    setIncidents((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await logIncidentAction({ student: optimistic.student, type: optimistic.type, severity: optimistic.severity, action: optimistic.action })
      if (saved) setIncidents((prev) => prev.map((i) => (i.id === optimistic.id ? saved : i)))
    })
    setAction("")
  }
  function resolve(id: string) {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: "resolved" } : i)))
    startTransition(async () => {
      const saved = await resolveIncidentAction(id)
      if (saved) setIncidents((prev) => prev.map((i) => (i.id === id ? saved : i)))
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.open}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.resolved}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Serious</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.serious}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log incident</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SIS_ROSTER.map((x) => <option key={x.apaarId} value={x.name}>{x.name} — {x.className}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="serious">Serious</option>
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="a">Action taken</Label><Input id="a" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Counselling, parent informed" /></div>
            <Button onClick={log} className="w-full">Log incident</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Incidents ({incidents.length})</CardTitle></CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents logged.</p>
            ) : (
              <ul className="space-y-2">
                {incidents.map((i) => (
                  <li key={i.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{i.student}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant={SEVERITY_VARIANT[i.severity]}>{i.severity}</Badge>
                        <Badge variant={i.status === "resolved" ? "default" : "outline"}>{i.status}</Badge>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{i.type}</span>
                      <span>{i.date}</span>
                      {i.action ? <span>· {i.action}</span> : null}
                    </div>
                    {i.status === "open" ? <Button size="sm" variant="outline" className="mt-2" onClick={() => resolve(i.id)}>Resolve</Button> : null}
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
