"use client"

import { useState } from "react"
import {
  DAYS,
  PERIODS,
  SAMPLE_GRID,
  TEACHERS,
  slotKey,
  suggestSubstitutes,
  type Grid,
  type Day,
} from "@/lib/timetable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TimetableBoard() {
  const [grid, setGrid] = useState<Grid>(SAMPLE_GRID)
  const [day, setDay] = useState<Day>("Mon")
  const [period, setPeriod] = useState(1)
  const [subject, setSubject] = useState("")
  const [teacher, setTeacher] = useState(TEACHERS[0])
  const [absent, setAbsent] = useState(TEACHERS[0])

  function setSlot() {
    if (!subject.trim()) return
    setGrid((g) => ({ ...g, [slotKey(day, period)]: { subject: subject.trim(), teacher } }))
    setSubject("")
  }

  const subs = suggestSubstitutes(grid, absent)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly timetable</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 text-left">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="border p-2">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="border p-2 font-medium">P{p}</td>
                  {DAYS.map((d) => {
                    const s = grid[slotKey(d, p)]
                    return (
                      <td key={d} className="border p-2 align-top">
                        {s ? (
                          <div>
                            <div className="font-medium">{s.subject}</div>
                            <div className="text-xs text-muted-foreground">{s.teacher}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Set a slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <select value={day} onChange={(e) => setDay(e.target.value as Day)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {PERIODS.map((p) => <option key={p} value={p}>P{p}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subj">Subject</Label>
              <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Maths" />
            </div>
            <div className="space-y-1.5">
              <Label>Teacher</Label>
              <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Button onClick={setSlot} disabled={!subject.trim()} className="w-full">Set slot</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Substitution planner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mark teacher absent</Label>
              <select value={absent} onChange={(e) => setAbsent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TEACHERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {subs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{absent} has no periods this week.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {subs.map((s) => (
                  <li key={`${s.day}-${s.period}`} className="rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.day} P{s.period} — {s.subject}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.candidates.length ? (
                        s.candidates.map((c) => <Badge key={c} variant="outline">{c}</Badge>)
                      ) : (
                        <span className="text-xs text-destructive">No free teacher</span>
                      )}
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
