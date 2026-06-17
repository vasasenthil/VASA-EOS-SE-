"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyAttendance, validateAttendance, ATTENDANCE_STATUSES, SECTIONS, CLASS_LEVELS,
  type AttendanceInput, type AttendanceErrors,
} from "@/lib/attendance-register"
import { createAttendanceAction, updateAttendanceAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function AttendanceForm({ id, initial }: { id?: string; initial?: AttendanceInput }) {
  const router = useRouter()
  const [f, setF] = useState<AttendanceInput>(initial ?? emptyAttendance())
  const [errors, setErrors] = useState<AttendanceErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof AttendanceInput>(k: K, v: AttendanceInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateAttendance(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateAttendance(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateAttendanceAction(id, f) : await createAttendanceAction(f)
      if (res.ok) router.push(id ? `/attendance-register/${id}` : "/attendance-register")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the attendance entry.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit attendance entry" : "New attendance entry"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Aarthi M." /><Err msg={shown.student} /></div>
          <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id (optional)</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section">Section *</Label>
            <select id="section" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /><Err msg={shown.date} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as AttendanceInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={f.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} placeholder="Reason / note (optional)." /></div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create entry"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
