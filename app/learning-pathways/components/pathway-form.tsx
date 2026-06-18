"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Sparkles, ShieldCheck, Wand2 } from "lucide-react"
import {
  emptyPathway, validatePathway, recommend, suggestPlan,
  PATHWAY_STATUSES, SUBJECT_AREAS, CLASS_LEVELS, SECTIONS,
  type PathwayInput, type PathwayErrors, type PathwayObjective,
} from "@/lib/pathways"
import { createPathwayAction, updatePathwayAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function PathwayForm({ id, initial }: { id?: string; initial?: PathwayInput }) {
  const router = useRouter()
  const [f, setF] = useState<PathwayInput>(initial ?? emptyPathway())
  const [errors, setErrors] = useState<PathwayErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof PathwayInput>(k: K, v: PathwayInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setObj(i: number, patch: Partial<PathwayObjective>) { setF((p) => ({ ...p, objectives: p.objectives.map((o, j) => (j === i ? { ...o, ...patch } : o)) })) }
  function addObj() { setF((p) => ({ ...p, objectives: [...p.objectives, { id: `o${p.objectives.length + 1}-${Math.random().toString(36).slice(2, 4)}`, label: "", prereqs: [], mastery: 0 }] })) }
  function removeObj(i: number) { setF((p) => ({ ...p, objectives: p.objectives.filter((_, j) => j !== i) })) }

  const shown = submitted ? validatePathway(f).errors : errors
  const result = recommend(f.objectives, f.threshold) // live Personalisation Engine output

  function applySuggestion() { set("plan", suggestPlan(result)) }

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validatePathway(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updatePathwayAction(id, f) : await createPathwayAction(f)
      if (res.ok) router.push(id ? `/learning-pathways/${id}` : "/learning-pathways")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the pathway.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit pathway" : "New learning pathway"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Learner & subject</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Bharath K." /><Err msg={shown.student} /></div>
            <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id</Label><Input id="apaar" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300402" /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="sec">Section *</Label><select id="sec" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><select id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SUBJECT_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.subject} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Algebra pathway" /><Err msg={shown.title} /></div>
            <div className="space-y-1.5"><Label htmlFor="thr">Mastery threshold (%) *</Label><Input id="thr" type="number" min={1} max={100} value={f.threshold} onChange={(e) => set("threshold", Number(e.target.value))} /><Err msg={shown.threshold} /></div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Objectives — label · prerequisites · mastery %</h3>
            <Button type="button" variant="outline" size="sm" onClick={addObj}><Plus className="mr-1 h-4 w-4" />Add objective</Button>
          </div>
          <p className="text-xs text-muted-foreground">Prerequisites: comma-separated objective labels that must be mastered first.</p>
          {f.objectives.map((o, i) => (
            <div key={o.id} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-4" value={o.label} onChange={(e) => setObj(i, { label: e.target.value })} placeholder="Objective (e.g. Factorisation)" />
              <Input className="col-span-5" value={o.prereqs.join(", ")} onChange={(e) => setObj(i, { prereqs: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="Prerequisites (labels)" />
              <Input className="col-span-2" type="number" min={0} max={100} value={o.mastery} onChange={(e) => setObj(i, { mastery: Number(e.target.value) })} aria-label="Mastery %" />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeObj(i)} aria-label="Remove objective" disabled={f.objectives.length <= 1}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Err msg={shown.objectives} />
        </section>

        {/* Live Personalisation Engine recommendation */}
        <section className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold">Personalisation Engine — ready next steps</span>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority</Badge>
          </div>
          {result.recommendations.length === 0 ? (
            <p className="text-xs text-muted-foreground">{result.explanation}</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {result.recommendations.map((r, i) => (
                <li key={r.objectiveId} className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{i + 1}</Badge>
                  <span className="font-medium">{r.label}</span>
                  <Badge variant="outline">priority {r.priority}</Badge>
                  <span className="text-xs text-muted-foreground">{r.reason}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-xs text-muted-foreground">{result.explanation}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Approved pathway plan (you decide)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="plan">Status *</Label><select id="plan" value={f.planStatus} onChange={(e) => set("planStatus", e.target.value as PathwayInput["planStatus"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PATHWAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.planStatus} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="approver">Approved by</Label><Input id="approver" value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} placeholder="Teacher who approves the pathway" /><Err msg={shown.approvedBy} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={applySuggestion}><Wand2 className="mr-1 h-4 w-4" />Use AI suggestion</Button>
            <span className="text-xs text-muted-foreground">AI suggests the sequence; you review and edit before approving.</span>
          </div>
          <Textarea value={f.plan} onChange={(e) => set("plan", e.target.value)} rows={3} placeholder="Approved learning sequence & activities…" />
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create pathway"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
