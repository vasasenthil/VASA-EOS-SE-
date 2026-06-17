"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { emptyCourse, validateCourse, COURSE_STATUSES, CLASS_LEVELS, SUBJECT_AREAS, type CourseInput, type CourseErrors } from "@/lib/courses"
import { createCourseAction, updateCourseAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function CourseForm({ id, initial }: { id?: string; initial?: CourseInput }) {
  const router = useRouter()
  const [f, setF] = useState<CourseInput>(initial ?? emptyCourse())
  const [errors, setErrors] = useState<CourseErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof CourseInput>(k: K, v: CourseInput[K]) {
    setF((p) => ({ ...p, [k]: v }))
  }
  const shown = submitted ? validateCourse(f).errors : errors

  function submit() {
    setSubmitted(true)
    setServerErr(null)
    const v = validateCourse(f)
    setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateCourseAction(id, f) : await createCourseAction(f)
      if (res.ok) router.push(id ? `/courses/${id}` : "/courses")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the course.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit course" : "New course"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="code">Code *</Label><Input id="code" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="MAT-X" /><Err msg={shown.code} /></div>
          <div className="space-y-1.5"><Label htmlFor="name">Course name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Mathematics" /><Err msg={shown.name} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class *</Label>
            <select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select><Err msg={shown.classLevel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Subject area *</Label>
            <select id="area" value={f.subjectArea} onChange={(e) => set("subjectArea", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.subjectArea} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="teacher">Teacher *</Label><Input id="teacher" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.teacher} /></div>
          <div className="space-y-1.5"><Label htmlFor="credits">Credits *</Label><Input id="credits" type="number" min={1} max={10} value={f.credits || ""} onChange={(e) => set("credits", Number(e.target.value))} /><Err msg={shown.credits} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as CourseInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {COURSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.status} />
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="desc">Description *</Label><Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What the course covers (min 10 characters)." /><Err msg={shown.description} /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create course"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
