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
  emptyHealth, validateHealth, bmi, bmiBand, isAnaemic, needsReferral, referralReasons,
  SCREEN_RESULTS, CLASS_LEVELS, SECTIONS, GENDERS,
  type HealthInput, type HealthErrors,
} from "@/lib/healthregister"
import { createHealthAction, updateHealthAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

const BAND_STYLE: Record<string, string> = { Underweight: "bg-amber-100 text-amber-700", Normal: "bg-green-100 text-green-700", Overweight: "bg-amber-100 text-amber-700", Obese: "bg-red-100 text-red-700", "—": "bg-gray-100 text-gray-600" }

export function HealthForm({ id, initial }: { id?: string; initial?: HealthInput }) {
  const router = useRouter()
  const [f, setF] = useState<HealthInput>(initial ?? emptyHealth())
  const [errors, setErrors] = useState<HealthErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof HealthInput>(k: K, v: HealthInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateHealth(f).errors : errors
  const band = bmiBand(f)
  const reasons = referralReasons(f)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateHealth(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateHealthAction(id, f) : await createHealthAction(f)
      if (res.ok) router.push(id ? `/health-register/${id}` : "/health-register")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the record.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit health record" : "New health record"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Student & screening</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Aarthi M." /><Err msg={shown.student} /></div>
            <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id</Label><Input id="apaar" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="sec">Section *</Label><select id="sec" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="gender">Gender *</Label><select id="gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select><Err msg={shown.gender} /></div>
            <div className="space-y-1.5"><Label htmlFor="date">Screening date *</Label><Input id="date" type="date" value={f.screeningDate} onChange={(e) => set("screeningDate", e.target.value)} /><Err msg={shown.screeningDate} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Anthropometry & screening</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="h">Height (cm) *</Label><Input id="h" type="number" min={50} max={220} value={f.heightCm || ""} onChange={(e) => set("heightCm", Number(e.target.value))} /><Err msg={shown.heightCm} /></div>
            <div className="space-y-1.5"><Label htmlFor="w">Weight (kg) *</Label><Input id="w" type="number" min={5} max={150} value={f.weightKg || ""} onChange={(e) => set("weightKg", Number(e.target.value))} /><Err msg={shown.weightKg} /></div>
            <div className="space-y-1.5"><Label htmlFor="hb">Haemoglobin (g/dL)</Label><Input id="hb" type="number" step="0.1" min={0} max={25} value={f.hemoglobin || ""} onChange={(e) => set("hemoglobin", Number(e.target.value))} /><Err msg={shown.hemoglobin} /></div>
            <div className="space-y-1.5"><Label htmlFor="vision">Vision *</Label><select id="vision" value={f.vision} onChange={(e) => set("vision", e.target.value as HealthInput["vision"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SCREEN_RESULTS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.vision} /></div>
            <div className="space-y-1.5"><Label htmlFor="hearing">Hearing *</Label><select id="hearing" value={f.hearing} onChange={(e) => set("hearing", e.target.value as HealthInput["hearing"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SCREEN_RESULTS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.hearing} /></div>
            <div className="space-y-1.5"><Label htmlFor="dental">Dental *</Label><select id="dental" value={f.dental} onChange={(e) => set("dental", e.target.value as HealthInput["dental"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SCREEN_RESULTS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.dental} /></div>
            <div className="space-y-1.5"><Label>Immunisation</Label><label className="flex items-center gap-2 h-9 text-sm"><input type="checkbox" checked={f.immunisationUpToDate} onChange={(e) => set("immunisationUpToDate", e.target.checked)} className="h-4 w-4" />Up to date</label></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">BMI</span><Badge variant="secondary">{bmi(f) || "—"}</Badge>
            <Badge className={`${BAND_STYLE[band]} border-0`}>{band}</Badge>
            {isAnaemic(f) ? <Badge className="bg-red-100 text-red-700 border-0">Anaemia</Badge> : null}
            {needsReferral(f) ? <Badge className="bg-red-100 text-red-700 border-0">Referral: {reasons.length}</Badge> : <Badge className="bg-green-100 text-green-700 border-0">No referral</Badge>}
            <span className="ml-auto text-[11px] text-muted-foreground">Indicative band (adult cut-offs); RBSK provides clinical screening.</span>
          </div>
        </section>

        <div className="space-y-1.5"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={f.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} placeholder="Screening notes (optional)." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create record"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
