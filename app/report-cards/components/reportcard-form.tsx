"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import {
  emptyReportCard, validateReportCard, reportTotals,
  REPORT_CARD_STATUSES, TERMS, CLASS_LEVELS, SUBJECT_AREAS,
  type ReportCardInput, type ReportCardErrors, type SubjectResult,
} from "@/lib/reportcards"
import { createReportCardAction, updateReportCardAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function ReportCardForm({ id, initial }: { id?: string; initial?: ReportCardInput }) {
  const router = useRouter()
  const [f, setF] = useState<ReportCardInput>(initial ?? emptyReportCard())
  const [errors, setErrors] = useState<ReportCardErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof ReportCardInput>(k: K, v: ReportCardInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setSubject(i: number, patch: Partial<SubjectResult>) {
    setF((p) => ({ ...p, subjects: p.subjects.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))
  }
  function addSubject() { setF((p) => ({ ...p, subjects: [...p.subjects, { subject: "", marks: 0, maxMarks: 100 }] })) }
  function removeSubject(i: number) { setF((p) => ({ ...p, subjects: p.subjects.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateReportCard(f).errors : errors
  const totals = reportTotals(f.subjects)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateReportCard(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateReportCardAction(id, f) : await createReportCardAction(f)
      if (res.ok) router.push(id ? `/report-cards/${id}` : "/report-cards")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the report card.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit report card" : "New report card"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Kavya R." /><Err msg={shown.student} /></div>
          <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id (optional)</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300420" /><Err msg={shown.apaarId} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="term">Term *</Label>
            <select id="term" value={f.term} onChange={(e) => set("term", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{TERMS.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.term} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="att">Attendance % *</Label><Input id="att" type="number" min={0} max={100} value={f.attendancePct} onChange={(e) => set("attendancePct", Number(e.target.value))} /><Err msg={shown.attendancePct} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as ReportCardInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{REPORT_CARD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Subjects *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSubject}><Plus className="mr-1 h-4 w-4" />Add subject</Button>
          </div>
          <div className="space-y-2">
            {f.subjects.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select value={s.subject} onChange={(e) => setSubject(i, { subject: e.target.value })} className="col-span-6 h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">Select subject…</option>{SUBJECT_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Input className="col-span-2" type="number" min={0} value={s.marks} onChange={(e) => setSubject(i, { marks: Number(e.target.value) })} aria-label="Marks" />
                <span className="col-span-1 text-center text-muted-foreground text-sm">/</span>
                <Input className="col-span-2" type="number" min={1} value={s.maxMarks} onChange={(e) => setSubject(i, { maxMarks: Number(e.target.value) })} aria-label="Max marks" />
                <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeSubject(i)} aria-label="Remove subject" disabled={f.subjects.length <= 1}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <Err msg={shown.subjects} />
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <Badge variant="secondary">{totals.obtained}/{totals.max}</Badge>
            <Badge variant="secondary">{totals.pct}%</Badge>
            <Badge>{totals.grade}</Badge>
            <Badge className={`${totals.outcome === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} border-0`}>{totals.outcome}</Badge>
          </div>
        </div>

        <div className="space-y-1.5"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={f.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} placeholder="Class-teacher remarks (optional)." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create report card"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
