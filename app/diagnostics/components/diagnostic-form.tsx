"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Brain, ShieldCheck, Wand2 } from "lucide-react"
import {
  emptyDiagnostic, validateDiagnostic, diagnose, suggestRemediation,
  ASSESSMENT_TYPES, PLAN_STATUSES, SUBJECT_AREAS, CLASS_LEVELS, SECTIONS,
  type DiagnosticInput, type DiagnosticErrors, type RubricEntry,
} from "@/lib/diagnostics"
import { createDiagnosticAction, updateDiagnosticAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function DiagnosticForm({ id, initial }: { id?: string; initial?: DiagnosticInput }) {
  const router = useRouter()
  const [f, setF] = useState<DiagnosticInput>(initial ?? emptyDiagnostic())
  const [errors, setErrors] = useState<DiagnosticErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof DiagnosticInput>(k: K, v: DiagnosticInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setItem(i: number, patch: Partial<RubricEntry>) { setF((p) => ({ ...p, items: p.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })) }
  function addItem() { setF((p) => ({ ...p, items: [...p.items, { id: `i${p.items.length + 1}-${Math.random().toString(36).slice(2, 5)}`, objective: "", marks: 10, awarded: 0 }] })) }
  function removeItem(i: number) { setF((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateDiagnostic(f).errors : errors
  const result = diagnose(f.items) // live Assessment Engine output

  function applySuggestion() { set("remediation", suggestRemediation(result)) }

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateDiagnostic(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateDiagnosticAction(id, f) : await createDiagnosticAction(f)
      if (res.ok) router.push(id ? `/diagnostics/${id}` : "/diagnostics")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the diagnostic.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit diagnostic" : "New diagnostic"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Learner & assessment</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Bharath K." /><Err msg={shown.student} /></div>
            <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id</Label><Input id="apaar" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300402" /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="sec">Section *</Label><select id="sec" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Algebra diagnostic" /><Err msg={shown.title} /></div>
            <div className="space-y-1.5"><Label htmlFor="type">Type *</Label><select id="type" value={f.assessmentType} onChange={(e) => set("assessmentType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.assessmentType} /></div>
            <div className="space-y-1.5"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /><Err msg={shown.date} /></div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Rubric — objective · marks · awarded</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />Add item</Button>
          </div>
          {f.items.map((it, i) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-6" value={it.objective} onChange={(e) => setItem(i, { objective: e.target.value })} placeholder="Curriculum objective (e.g. Factorisation)" />
              <Input className="col-span-2" type="number" min={0} value={it.awarded} onChange={(e) => setItem(i, { awarded: Number(e.target.value) })} aria-label="Awarded" />
              <span className="col-span-1 text-center text-muted-foreground text-sm">/</span>
              <Input className="col-span-2" type="number" min={1} value={it.marks} onChange={(e) => setItem(i, { marks: Number(e.target.value) })} aria-label="Max marks" />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeItem(i)} aria-label="Remove item" disabled={f.items.length <= 1}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Err msg={shown.items} />
        </section>

        {/* Live Assessment Engine diagnosis */}
        <section className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold">Assessment Engine diagnosis</span>
            <Badge variant="secondary">{result.pct}% · band {result.band}</Badge>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.objectiveMastery.map((o) => (
              <Badge key={o.objective} className={`${o.pct < 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} border-0`}>{o.objective}: {o.pct}%</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{result.explanation}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Remediation plan (you decide)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="plan">Plan status *</Label><select id="plan" value={f.planStatus} onChange={(e) => set("planStatus", e.target.value as DiagnosticInput["planStatus"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.planStatus} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="approver">Approved by</Label><Input id="approver" value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} placeholder="Teacher who approves the plan" /><Err msg={shown.approvedBy} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={applySuggestion}><Wand2 className="mr-1 h-4 w-4" />Use AI suggestion</Button>
            <span className="text-xs text-muted-foreground">AI suggests; you review and edit before approving.</span>
          </div>
          <Textarea value={f.remediation} onChange={(e) => set("remediation", e.target.value)} rows={3} placeholder="Remediation actions for the weak objectives…" />
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create diagnostic"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
