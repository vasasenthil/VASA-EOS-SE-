"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  emptyTimetableEntry, validateTimetable, DAYS, PERIODS, SECTIONS, CLASS_LEVELS, SUBJECT_AREAS,
  type TimetableInput, type TimetableErrors,
} from "@/lib/timetable-manager"
import { createTimetableAction, updateTimetableAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function TimetableForm({ id, initial }: { id?: string; initial?: TimetableInput }) {
  const router = useRouter()
  const [f, setF] = useState<TimetableInput>(initial ?? emptyTimetableEntry())
  const [errors, setErrors] = useState<TimetableErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof TimetableInput>(k: K, v: TimetableInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateTimetable(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateTimetable(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateTimetableAction(id, f) : await createTimetableAction(f)
      if (res.ok) router.push(id ? `/timetable-manager/${id}` : "/timetable-manager")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the timetable entry.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit timetable entry" : "New timetable entry"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section">Section *</Label>
            <select id="section" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="day">Day *</Label>
            <select id="day" value={f.day} onChange={(e) => set("day", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select><Err msg={shown.day} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period">Period *</Label>
            <select id="period" value={f.period} onChange={(e) => set("period", Number(e.target.value))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}</select><Err msg={shown.period} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="start">Start time *</Label><Input id="start" type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /><Err msg={shown.startTime} /></div>
          <div className="space-y-1.5"><Label htmlFor="end">End time *</Label><Input id="end" type="time" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} /><Err msg={shown.endTime} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="teacher">Teacher *</Label><Input id="teacher" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.teacher} /></div>
          <div className="space-y-1.5"><Label htmlFor="room">Room *</Label><Input id="room" value={f.room} onChange={(e) => set("room", e.target.value)} placeholder="R-101" /><Err msg={shown.room} /></div>
        </div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <p className="text-xs text-muted-foreground">A class or a teacher cannot be double-booked in the same day and period — clashes are rejected on save.</p>
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create entry"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
