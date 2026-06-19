"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Wand2, CalendarClock } from "lucide-react"
import {
  emptyCover, validateCover, weekday, COVER_REASONS, COVER_STATUSES, PERIODS, CLASS_LEVELS, SECTIONS, SUBJECT_AREAS,
  type CoverInput, type CoverErrors,
} from "@/lib/coverflow"
import { createCoverAction, updateCoverAction, suggestSubstitutesAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function CoverForm({ id, initial }: { id?: string; initial?: CoverInput }) {
  const router = useRouter()
  const [f, setF] = useState<CoverInput>(initial ?? emptyCover())
  const [errors, setErrors] = useState<CoverErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [free, setFree] = useState<string[] | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof CoverInput>(k: K, v: CoverInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateCover(f).errors : errors
  const wd = weekday(f.date)

  function suggest() {
    start(async () => setFree(await suggestSubstitutesAction(f.date, f.period, f.absentTeacher)))
  }

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateCover(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateCoverAction(id, f) : await createCoverAction(f)
      if (res.ok) router.push(id ? `/cover-arrangements/${id}` : "/cover-arrangements")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the cover arrangement.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit cover arrangement" : "New cover arrangement"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Absence & slot</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /><Err msg={shown.date} />{wd ? <p className="text-xs text-muted-foreground">{wd}</p> : null}</div>
            <div className="space-y-1.5"><Label htmlFor="absent">Absent teacher *</Label><Input id="absent" value={f.absentTeacher} onChange={(e) => set("absentTeacher", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.absentTeacher} /></div>
            <div className="space-y-1.5"><Label htmlFor="reason">Reason *</Label><select id="reason" value={f.reason} onChange={(e) => set("reason", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{COVER_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select><Err msg={shown.reason} /></div>
            <div className="space-y-1.5"><Label htmlFor="period">Period *</Label><select id="period" value={f.period} onChange={(e) => set("period", Number(e.target.value))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}</select><Err msg={shown.period} /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="sec">Section *</Label><select id="sec" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Substitute</h3>
            <Button type="button" variant="outline" size="sm" onClick={suggest} disabled={pending}><Wand2 className="mr-1 h-4 w-4" />Suggest free teachers</Button>
          </div>
          {free ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Free in {wd || "—"}, period {f.period} (from the timetable):</p>
              {free.length === 0 ? <p className="text-muted-foreground">No free teacher found in this slot — every teacher is already assigned.</p> : (
                <div className="flex flex-wrap gap-1">{free.map((t) => <Button key={t} type="button" variant="outline" size="sm" onClick={() => set("substituteTeacher", t)}>{t}</Button>)}</div>
              )}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="sub">Substitute teacher</Label><Input id="sub" value={f.substituteTeacher} onChange={(e) => set("substituteTeacher", e.target.value)} placeholder="Ms. Rao" /><Err msg={shown.substituteTeacher} /></div>
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as CoverInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{COVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
          </div>
          <Badge variant="secondary">{f.substituteTeacher ? `Covered by ${f.substituteTeacher}` : "Uncovered — assign a substitute"}</Badge>
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create cover"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
