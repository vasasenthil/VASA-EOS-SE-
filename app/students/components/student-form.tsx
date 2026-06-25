"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  emptyStudent, validateStudent, GENDERS, CATEGORIES, SECTIONS, CLASS_LEVELS, STUDENT_STATUSES,
  type StudentInput, type StudentErrors,
} from "@/lib/students"
import { createStudentAction, updateStudentAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function StudentForm({ id, initial }: { id?: string; initial?: StudentInput }) {
  const router = useRouter()
  const [f, setF] = useState<StudentInput>(initial ?? emptyStudent())
  const [errors, setErrors] = useState<StudentErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof StudentInput>(k: K, v: StudentInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateStudent(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateStudent(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateStudentAction(id, f) : await createStudentAction(f)
      if (res.ok) router.push(id ? `/students/${id}` : "/students")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the student record.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit student record" : "New student record"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Aarthi M." /><Err msg={shown.name} /></div>
          <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id *</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender *</Label>
            <select id="gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select><Err msg={shown.gender} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="dob">Date of birth *</Label><Input id="dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /><Err msg={shown.dob} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section">Section *</Label>
            <select id="section" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <select id="category" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as StudentInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{STUDENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="guardian">Guardian *</Label><Input id="guardian" value={f.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Murugan S." /><Err msg={shown.guardianName} /></div>
          <div className="space-y-1.5"><Label htmlFor="phone">Contact phone *</Label><Input id="phone" inputMode="numeric" value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="9840012301" /><Err msg={shown.contactPhone} /></div>
        </div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create record"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
