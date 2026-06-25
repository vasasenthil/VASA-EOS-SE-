"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { emptyKpi, validateKpi, type KpiInput, type KpiErrors } from "@/lib/rollup"
import { createKpiAction, updateKpiAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function KpiForm({ id, initial }: { id?: string; initial?: KpiInput }) {
  const router = useRouter()
  const [f, setF] = useState<KpiInput>(initial ?? emptyKpi())
  const [errors, setErrors] = useState<KpiErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof KpiInput>(k: K, v: KpiInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateKpi(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateKpi(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateKpiAction(id, f) : await createKpiAction(f)
      if (res.ok) router.push("/governance-rollup")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the snapshot.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit school KPI snapshot" : "New school KPI snapshot"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="name">School name *</Label><Input id="name" value={f.schoolName} onChange={(e) => set("schoolName", e.target.value)} placeholder="GHSS Egmore" /><Err msg={shown.schoolName} /></div>
          <div className="space-y-1.5"><Label htmlFor="udise">UDISE code *</Label><Input id="udise" inputMode="numeric" value={f.udise} onChange={(e) => set("udise", e.target.value)} placeholder="33010100101" /><Err msg={shown.udise} /></div>
          <div className="space-y-1.5"><Label htmlFor="district">District *</Label><Input id="district" value={f.district} onChange={(e) => set("district", e.target.value)} placeholder="Chennai" /><Err msg={shown.district} /></div>
          <div className="space-y-1.5"><Label htmlFor="block">Block *</Label><Input id="block" value={f.block} onChange={(e) => set("block", e.target.value)} placeholder="Egmore" /><Err msg={shown.block} /></div>
          <div className="space-y-1.5"><Label htmlFor="ay">Academic year *</Label><Input id="ay" value={f.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2026-2027" /><Err msg={shown.academicYear} /></div>
          <div className="space-y-1.5"><Label htmlFor="enrol">Enrolment *</Label><Input id="enrol" type="number" min={1} value={f.enrolment} onChange={(e) => set("enrolment", Number(e.target.value))} /><Err msg={shown.enrolment} /></div>
          <div className="space-y-1.5"><Label htmlFor="att">Attendance % *</Label><Input id="att" type="number" min={0} max={100} value={f.attendancePct} onChange={(e) => set("attendancePct", Number(e.target.value))} /><Err msg={shown.attendancePct} /></div>
          <div className="space-y-1.5"><Label htmlFor="pass">Pass % *</Label><Input id="pass" type="number" min={0} max={100} value={f.passPct} onChange={(e) => set("passPct", Number(e.target.value))} /><Err msg={shown.passPct} /></div>
          <div className="space-y-1.5"><Label htmlFor="fee">Fee collection % *</Label><Input id="fee" type="number" min={0} max={100} value={f.feeCollectionPct} onChange={(e) => set("feeCollectionPct", Number(e.target.value))} /><Err msg={shown.feeCollectionPct} /></div>
          <div className="space-y-1.5"><Label htmlFor="risk">At-risk students</Label><Input id="risk" type="number" min={0} value={f.atRiskCount} onChange={(e) => set("atRiskCount", Number(e.target.value))} /><Err msg={shown.atRiskCount} /></div>
          <div className="space-y-1.5"><Label htmlFor="gaps">Compliance gaps</Label><Input id="gaps" type="number" min={0} value={f.complianceGaps} onChange={(e) => set("complianceGaps", Number(e.target.value))} /><Err msg={shown.complianceGaps} /></div>
        </div>
        <p className="text-xs text-muted-foreground">These per-school KPIs roll up — enrolment-weighted — to block, district and state for evidence-based decisions.</p>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create snapshot"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
