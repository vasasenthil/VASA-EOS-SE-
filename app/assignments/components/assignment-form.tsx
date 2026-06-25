"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyAssignment, validateAssignment, ASSIGNMENT_STATUSES, ASSIGNMENT_TYPES, CLASS_LEVELS, SUBJECT_AREAS,
  type AssignmentInput, type AssignmentErrors,
} from "@/lib/assignments"
import { createAssignmentAction, updateAssignmentAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function AssignmentForm({ id, initial }: { id?: string; initial?: AssignmentInput }) {
  const router = useRouter()
  const [f, setF] = useState<AssignmentInput>(initial ?? emptyAssignment())
  const [errors, setErrors] = useState<AssignmentErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof AssignmentInput>(k: K, v: AssignmentInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateAssignment(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateAssignment(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateAssignmentAction(id, f) : await createAssignmentAction(f)
      if (res.ok) router.push(id ? `/assignments/${id}` : "/assignments")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the assignment.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit assignment" : "New assignment"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Algebra worksheet 3" /><Err msg={shown.title} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type *</Label>
            <select id="type" value={f.type} onChange={(e) => set("type", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSIGNMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.type} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="due">Due date *</Label><Input id="due" type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /><Err msg={shown.dueDate} /></div>
          <div className="space-y-1.5"><Label htmlFor="max">Max marks *</Label><Input id="max" type="number" min={1} value={f.maxMarks || ""} onChange={(e) => set("maxMarks", Number(e.target.value))} /><Err msg={shown.maxMarks} /></div>
          <div className="space-y-1.5"><Label htmlFor="teacher">Teacher *</Label><Input id="teacher" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.teacher} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as AssignmentInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} />
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="instr">Instructions *</Label><Textarea id="instr" value={f.instructions} onChange={(e) => set("instructions", e.target.value)} rows={3} placeholder="What students must do (min 10 characters)." /><Err msg={shown.instructions} /></div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create assignment"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
