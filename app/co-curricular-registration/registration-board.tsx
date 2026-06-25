"use client"

import { useState } from "react"
import { ACTIVITIES, registerParticipant, type Registration } from "@/lib/cocurricular"
import { SIS_ROSTER } from "@/lib/sis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function RegistrationBoard() {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ACTIVITIES.map((a) => [a.name, a.participants])),
  )
  const [regs, setRegs] = useState<Registration[]>([])
  const [activity, setActivity] = useState(ACTIVITIES[0]?.name ?? "")
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")

  function register() {
    const s = SIS_ROSTER.find((x) => x.apaarId === student)
    if (!s) return
    setCounts((c) => ({ ...c, [activity]: registerParticipant(c[activity] ?? 0) }))
    setRegs((prev) => [{ id: `r-${Date.now()}`, activity, student: s.name }, ...prev])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader><CardTitle>Register a student</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Activity</Label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {ACTIVITIES.map((a) => <option key={a.name} value={a.name}>{a.name} ({a.category})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Student</Label>
            <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {SIS_ROSTER.map((s) => <option key={s.apaarId} value={s.apaarId}>{s.name} — {s.className}</option>)}
            </select>
          </div>
          <Button onClick={register} className="w-full">Register</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Participation</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ACTIVITIES.map((a) => (
                <li key={a.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>
                    <span className="font-medium">{a.name}</span>
                    <span className="block text-xs text-muted-foreground">{a.category}</span>
                  </span>
                  <Badge variant="outline">{counts[a.name] ?? 0} participants</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent registrations ({regs.length})</CardTitle></CardHeader>
          <CardContent>
            {regs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {regs.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span>{r.student}</span>
                    <span className="text-muted-foreground">{r.activity}</span>
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
