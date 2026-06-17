"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  emptyHoliday, validateHoliday, holidayDays, HOLIDAY_CATEGORIES, HOLIDAY_STATUSES,
  type HolidayInput, type HolidayErrors,
} from "@/lib/holidays"
import { createHolidayAction, updateHolidayAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function HolidayForm({ id, initial }: { id?: string; initial?: HolidayInput }) {
  const router = useRouter()
  const [f, setF] = useState<HolidayInput>(initial ?? emptyHoliday())
  const [errors, setErrors] = useState<HolidayErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof HolidayInput>(k: K, v: HolidayInput[K]) {
    setF((p) => {
      const next = { ...p, [k]: v }
      // keep end >= start by default when start moves past end
      if (k === "startDate" && next.endDate && next.endDate < (v as string)) next.endDate = v as string
      return next
    })
  }
  const shown = submitted ? validateHoliday(f).errors : errors
  const days = holidayDays(f)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateHoliday(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateHolidayAction(id, f) : await createHolidayAction(f)
      if (res.ok) router.push(id ? `/holidays/${id}` : "/holidays")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the holiday.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit holiday" : "New holiday"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="name">Holiday name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Deepavali holidays" /><Err msg={shown.name} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <select id="category" value={f.category} onChange={(e) => set("category", e.target.value as HolidayInput["category"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{HOLIDAY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="ay">Academic year *</Label><Input id="ay" value={f.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2026-2027" /><Err msg={shown.academicYear} /></div>
          <div className="space-y-1.5"><Label htmlFor="start">Start date *</Label><Input id="start" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /><Err msg={shown.startDate} /></div>
          <div className="space-y-1.5"><Label htmlFor="end">End date *</Label><Input id="end" type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /><Err msg={shown.endDate} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as HolidayInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{HOLIDAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <div className="flex h-9 items-center"><Badge variant="secondary">{days} day{days === 1 ? "" : "s"}</Badge></div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.recurring} onChange={(e) => set("recurring", e.target.checked)} className="h-4 w-4" />
          Recurring every year (fixed-date festival — matches the same month/day in any year)
        </label>
        <div className="space-y-1.5"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Notes (optional)." /></div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <p className="text-xs text-muted-foreground">Holidays mark non-working dates — the Working-Time Scheduler reads this calendar to compute real school days for the timetable and lesson plans.</p>
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create holiday"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
