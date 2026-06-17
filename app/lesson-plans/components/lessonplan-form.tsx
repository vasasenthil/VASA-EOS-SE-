"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import {
  emptyLessonPlan, validateLessonPlan, parseList, durationMinutes,
  LESSON_STATUSES, LESSON_TYPES, PERIODS, SECTIONS, CLASS_LEVELS, SUBJECT_AREAS, RESOURCE_KINDS,
  type LessonPlanInput, type LessonPlanErrors, type ResourceLink,
} from "@/lib/lessonplans"
import { createLessonPlanAction, updateLessonPlanAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function LessonPlanForm({ id, initial }: { id?: string; initial?: LessonPlanInput }) {
  const router = useRouter()
  const [f, setF] = useState<LessonPlanInput>(initial ?? emptyLessonPlan())
  const [errors, setErrors] = useState<LessonPlanErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof LessonPlanInput>(k: K, v: LessonPlanInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setNote(i: number, patch: Partial<ResourceLink>) {
    setF((p) => ({ ...p, classNotes: p.classNotes.map((n, j) => (j === i ? { ...n, ...patch } : n)) }))
  }
  function addNote() { setF((p) => ({ ...p, classNotes: [...p.classNotes, { kind: "Link", title: "", url: "" }] })) }
  function removeNote(i: number) { setF((p) => ({ ...p, classNotes: p.classNotes.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateLessonPlan(f).errors : errors
  const duration = durationMinutes(f.startTime, f.endTime)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateLessonPlan(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateLessonPlanAction(id, f) : await createLessonPlanAction(f)
      if (res.ok) router.push(id ? `/lesson-plans/${id}` : "/lesson-plans")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the lesson plan.")
    })
  }

  const listField = (k: "previousTopics" | "furtherTopics" | "materialsToBring") => (
    <Input value={f[k].join(", ")} onChange={(e) => set(k, parseList(e.target.value))} placeholder="Comma-separated…" />
  )

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit lesson plan" : "New lesson plan"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Scheduling */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Scheduling</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="section">Section *</Label><select id="section" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} /></div>
            <div className="space-y-1.5"><Label htmlFor="teacher">Subject teacher *</Label><Input id="teacher" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.teacher} /></div>
            <div className="space-y-1.5"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /><Err msg={shown.date} /></div>
            <div className="space-y-1.5"><Label htmlFor="period">Period *</Label><select id="period" value={f.period} onChange={(e) => set("period", Number(e.target.value))} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}</select><Err msg={shown.period} /></div>
            <div className="space-y-1.5"><Label htmlFor="start">Start *</Label><Input id="start" type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /><Err msg={shown.startTime} /></div>
            <div className="space-y-1.5"><Label htmlFor="end">End *</Label><Input id="end" type="time" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} /><Err msg={shown.endTime} /></div>
            <div className="space-y-1.5"><Label>Duration</Label><div className="flex h-9 items-center"><Badge variant="secondary">{duration} min</Badge></div></div>
          </div>
        </section>

        {/* Pedagogy */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Lesson</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="type">Lesson type *</Label><select id="type" value={f.lessonType} onChange={(e) => set("lessonType", e.target.value as LessonPlanInput["lessonType"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.lessonType} /></div>
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as LessonPlanInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{LESSON_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="topic">Today&apos;s topic / lesson *</Label><Input id="topic" value={f.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Quadratic equations — factorisation" /><Err msg={shown.topic} /></div>
          <div className="space-y-1.5"><Label htmlFor="obj">Objectives</Label><Textarea id="obj" value={f.objectives} onChange={(e) => set("objectives", e.target.value)} rows={2} placeholder="What students should be able to do by the end." /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Previously studied topics</Label>{listField("previousTopics")}</div>
            <div className="space-y-1.5"><Label>Further / upcoming topics</Label>{listField("furtherTopics")}</div>
          </div>
        </section>

        {/* Resources */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Resources & follow-up</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>What students must bring</Label>{listField("materialsToBring")}</div>
            <div className="space-y-1.5"><Label htmlFor="planner">Lesson-planner link</Label><Input id="planner" value={f.lessonPlannerLink} onChange={(e) => set("lessonPlannerLink", e.target.value)} placeholder="https://diksha.gov.in/…" /><Err msg={shown.lessonPlannerLink} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="hw">Homework</Label><Textarea id="hw" value={f.homework} onChange={(e) => set("homework", e.target.value)} rows={2} placeholder="Exercise 4.2, Q1–Q10." /></div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Class notes (audio / video / document)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addNote}><Plus className="mr-1 h-4 w-4" />Add note</Button>
            </div>
            {f.classNotes.map((n, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select value={n.kind} onChange={(e) => setNote(i, { kind: e.target.value as ResourceLink["kind"] })} className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm">{RESOURCE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                <Input className="col-span-4" value={n.title} onChange={(e) => setNote(i, { title: e.target.value })} placeholder="Title" />
                <Input className="col-span-4" value={n.url} onChange={(e) => setNote(i, { url: e.target.value })} placeholder="https://…" />
                <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeNote(i)} aria-label="Remove note"><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Err msg={shown.classNotes} />
          </div>
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create lesson plan"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
