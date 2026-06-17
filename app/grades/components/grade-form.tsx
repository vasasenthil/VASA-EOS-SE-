"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  emptyGrade, validateGrade, percentage, letterGrade,
  GRADE_STATUSES, TERMS, ASSESSMENTS, CLASS_LEVELS, SUBJECT_AREAS,
  type GradeInput, type GradeErrors,
} from "@/lib/grades"
import { createGradeAction, updateGradeAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function GradeForm({ id, initial }: { id?: string; initial?: GradeInput }) {
  const router = useRouter()
  const [f, setF] = useState<GradeInput>(initial ?? emptyGrade())
  const [errors, setErrors] = useState<GradeErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof GradeInput>(k: K, v: GradeInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateGrade(f).errors : errors
  const pct = percentage(f.marks, f.maxMarks)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateGrade(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateGradeAction(id, f) : await createGradeAction(f)
      if (res.ok) router.push(id ? `/grades/${id}` : "/grades")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the grade.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit grade" : "New grade"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Kavya R." /><Err msg={shown.student} /></div>
          <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id (optional)</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="term">Term *</Label>
            <select id="term" value={f.term} onChange={(e) => set("term", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{TERMS.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.term} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessment">Assessment *</Label>
            <select id="assessment" value={f.assessment} onChange={(e) => set("assessment", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSESSMENTS.map((a) => <option key={a} value={a}>{a}</option>)}</select><Err msg={shown.assessment} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="marks">Marks *</Label><Input id="marks" type="number" min={0} value={f.marks || (f.marks === 0 ? 0 : "")} onChange={(e) => set("marks", Number(e.target.value))} /><Err msg={shown.marks} /></div>
          <div className="space-y-1.5"><Label htmlFor="max">Max marks *</Label><Input id="max" type="number" min={1} value={f.maxMarks || ""} onChange={(e) => set("maxMarks", Number(e.target.value))} /><Err msg={shown.maxMarks} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as GradeInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{GRADE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
          <div className="space-y-1.5"><Label>Derived</Label><div className="flex items-center gap-2 h-9"><Badge variant="secondary">{pct}%</Badge><Badge>{letterGrade(pct)}</Badge></div></div>
        </div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create grade"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
