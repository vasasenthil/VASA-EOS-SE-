"use client"

import { useState } from "react"
import { ICT_SUBJECTS, ictSummary, hasShortage, type IctSession } from "@/lib/ictlab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export function IctBoard() {
  const [sessions, setSessions] = useState<IctSession[]>([])
  const [cls, setCls] = useState("")
  const [subject, setSubject] = useState(ICT_SUBJECTS[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState(40)
  const [devicesWorking, setDevicesWorking] = useState(20)
  const [devicesTotal, setDevicesTotal] = useState(25)

  const s = ictSummary(sessions)

  function add() {
    if (!cls.trim()) return
    setSessions((prev) => [
      { id: `ic-${Date.now()}`, cls: cls.trim(), subject, date, students, devicesWorking, devicesTotal },
      ...prev,
    ])
    setCls("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.sessions}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Students reached</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.studentsReached}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Device uptime</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.uptimePct}%</div><Progress value={s.uptimePct} className="mt-2 h-1.5" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Device shortage</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${s.shortageSessions > 0 ? "text-destructive" : ""}`}>{s.shortageSessions}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader><CardTitle>Log a lab session</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="c">Class / section</Label><Input id="c" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="e.g. 8A" /></div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {ICT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="st">Students</Label><Input id="st" type="number" min={0} value={students} onChange={(e) => setStudents(Number(e.target.value))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label htmlFor="dw">Devices working</Label><Input id="dw" type="number" min={0} value={devicesWorking} onChange={(e) => setDevicesWorking(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label htmlFor="dt">Devices total</Label><Input id="dt" type="number" min={0} value={devicesTotal} onChange={(e) => setDevicesTotal(Number(e.target.value))} /></div>
            </div>
            <Button onClick={add} disabled={!cls.trim()} className="w-full">Log session</Button>
            <p className="text-xs text-muted-foreground">Tracks utilisation of the smart-class / ICT lab and flags when working devices can&apos;t cover the class.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Session log ({sessions.length})</CardTitle></CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((sess) => (
                  <li key={sess.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{sess.cls} · {sess.subject}</span>
                      <Badge variant={hasShortage(sess) ? "destructive" : "default"}>{sess.devicesWorking}/{sess.devicesTotal} devices</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{sess.date} · {sess.students} students{hasShortage(sess) ? " · device shortage" : ""}</p>
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
