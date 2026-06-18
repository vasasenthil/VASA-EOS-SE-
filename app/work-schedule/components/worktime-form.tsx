"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import {
  emptyWorkTime, validateWorkTime, instructionalMinutes, periodsOverlap,
  WORKTIME_STATUSES, PERIOD_KINDS, WEEKDAYS,
  type WorkTimeInput, type WorkTimeErrors, type BellPeriod,
} from "@/lib/worktime"
import { createWorkTimeAction, updateWorkTimeAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function WorkTimeForm({ id, initial }: { id?: string; initial?: WorkTimeInput }) {
  const router = useRouter()
  const [f, setF] = useState<WorkTimeInput>(initial ?? emptyWorkTime())
  const [errors, setErrors] = useState<WorkTimeErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof WorkTimeInput>(k: K, v: WorkTimeInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function toggleWeekday(n: number) {
    setF((p) => ({ ...p, workingWeekdays: p.workingWeekdays.includes(n) ? p.workingWeekdays.filter((x) => x !== n) : [...p.workingWeekdays, n].sort((a, b) => a - b) }))
  }
  function setPeriod(i: number, patch: Partial<BellPeriod>) {
    setF((p) => ({ ...p, periods: p.periods.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  }
  function addPeriod() {
    const last = f.periods[f.periods.length - 1]
    setF((p) => ({ ...p, periods: [...p.periods, { label: `Period ${p.periods.filter((x) => x.kind === "Period").length + 1}`, kind: "Period", startTime: last?.endTime ?? "09:00", endTime: "00:00" }] }))
  }
  function removePeriod(i: number) { setF((p) => ({ ...p, periods: p.periods.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateWorkTime(f).errors : errors
  const instr = instructionalMinutes(f.periods)
  const overlap = periodsOverlap(f.periods)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateWorkTime(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateWorkTimeAction(id, f) : await createWorkTimeAction(f)
      if (res.ok) router.push(id ? `/work-schedule/${id}` : "/work-schedule")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the profile.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit working-time profile" : "New working-time profile"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Academic year & term</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="name">Profile name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="TN High School Working Time" /><Err msg={shown.name} /></div>
            <div className="space-y-1.5"><Label htmlFor="ay">Academic year *</Label><Input id="ay" value={f.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2026-2027" /><Err msg={shown.academicYear} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status *</Label>
              <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as WorkTimeInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{WORKTIME_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="ts">Term start *</Label><Input id="ts" type="date" value={f.termStart} onChange={(e) => set("termStart", e.target.value)} /><Err msg={shown.termStart} /></div>
            <div className="space-y-1.5"><Label htmlFor="te">Term end *</Label><Input id="te" type="date" value={f.termEnd} onChange={(e) => set("termEnd", e.target.value)} /><Err msg={shown.termEnd} /></div>
            <div className="space-y-1.5"><Label htmlFor="ds">Day start *</Label><Input id="ds" type="time" value={f.dayStart} onChange={(e) => set("dayStart", e.target.value)} /><Err msg={shown.dayStart} /></div>
            <div className="space-y-1.5"><Label htmlFor="de">Day end *</Label><Input id="de" type="time" value={f.dayEnd} onChange={(e) => set("dayEnd", e.target.value)} /><Err msg={shown.dayEnd} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Working weekdays *</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => (
                <button type="button" key={w.n} onClick={() => toggleWeekday(w.n)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${f.workingWeekdays.includes(w.n) ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                  {w.short}
                </button>
              ))}
            </div>
            <Err msg={shown.workingWeekdays} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Daily bell schedule</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{instr} instructional min/day</Badge>
              {overlap ? <Badge className="bg-red-100 text-red-700 border-0">overlap</Badge> : null}
              <Button type="button" variant="outline" size="sm" onClick={addPeriod}><Plus className="mr-1 h-4 w-4" />Add</Button>
            </div>
          </div>
          <div className="space-y-2">
            {f.periods.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-4" value={p.label} onChange={(e) => setPeriod(i, { label: e.target.value })} placeholder="Period 1" />
                <select value={p.kind} onChange={(e) => setPeriod(i, { kind: e.target.value as BellPeriod["kind"] })} className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm">{PERIOD_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                <Input className="col-span-2" type="time" value={p.startTime} onChange={(e) => setPeriod(i, { startTime: e.target.value })} aria-label="Start" />
                <Input className="col-span-2" type="time" value={p.endTime} onChange={(e) => setPeriod(i, { endTime: e.target.value })} aria-label="End" />
                <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removePeriod(i)} aria-label="Remove" disabled={f.periods.length <= 1}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <Err msg={shown.periods} />
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <p className="text-xs text-muted-foreground">This profile + the Holiday Calendar resolve real school days (term · working weekday · not a holiday). The timetable&apos;s period times and lesson plans are scheduled against it.</p>
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create profile"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
