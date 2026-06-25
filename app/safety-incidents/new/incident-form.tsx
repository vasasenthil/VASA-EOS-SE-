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
  emptyIncident,
  validateIncident,
  isMandatoryReport,
  mustEscalate,
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITY,
  type IncidentForm,
  type FieldErrors,
} from "@/lib/safety/incident"
import { fileIncidentAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function IncidentFormUI() {
  const router = useRouter()
  const [f, setF] = useState<IncidentForm>(emptyIncident())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof IncidentForm>(key: K, value: IncidentForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateIncident(f).errors : errors
  const mandatory = isMandatoryReport(f)
  const escalate = mustEscalate(f)

  function submit() {
    setSubmitted(true)
    const v = validateIncident(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileIncidentAction({
        caseRef: f.caseRef.trim(),
        category: f.category,
        escalate,
        details: {
          severity: f.severity,
          incidentDate: f.incidentDate,
          account: f.account.trim(),
          reportedBy: f.reportedBy.trim(),
          mandatoryReport: mandatory,
        },
      })
      if (saved) router.push("/safety-incidents")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Child-Safety Incident</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
          <strong>POCSO §23 confidentiality:</strong> do not enter the child&apos;s name or any identifying detail — use
          an anonymised case reference only.
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="ref">Anonymised case reference *</Label><Input id="ref" value={f.caseRef} onChange={(e) => set("caseRef", e.target.value)} placeholder="e.g. SI-2026-0142" /><Err msg={shown.caseRef} /></div>
          <div className="space-y-1.5"><Label htmlFor="rb">Reported by (role) *</Label><Input id="rb" value={f.reportedBy} onChange={(e) => set("reportedBy", e.target.value)} placeholder="e.g. Class teacher" /><Err msg={shown.reportedBy} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{INCIDENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sev">Severity *</Label>
            <select id="sev" value={f.severity} onChange={(e) => set("severity", e.target.value as IncidentForm["severity"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {INCIDENT_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.severity} />
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="date">Incident date *</Label><Input id="date" type="date" value={f.incidentDate} onChange={(e) => set("incidentDate", e.target.value)} /><Err msg={shown.incidentDate} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc">Factual account *</Label>
          <Textarea id="acc" value={f.account} onChange={(e) => set("account", e.target.value)} rows={3} placeholder="What happened, when and where — facts only, no identifying details (min 20 characters)." />
          <Err msg={shown.account} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {mandatory ? <Badge variant="destructive">Mandatory CWC/Police report (within 24h)</Badge> : null}
          <Badge variant={escalate ? "secondary" : "outline"}>{escalate ? "Escalates to District Child Protection" : "Block-level review"}</Badge>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.confidentiality} onChange={(e) => set("confidentiality", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I acknowledge POCSO §23 confidentiality and that no victim-identifying detail has been entered.</span>
        </label>
        <Err msg={shown.confidentiality} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Report incident</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster</strong> → <strong>Block safety</strong>{escalate ? <> → <strong>District Child Protection</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
