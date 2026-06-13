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
  emptyReferral,
  validateReferral,
  needsSpecialistReferral,
  triageBand,
  RBSK_CATEGORIES,
  SEVERITY_LEVELS,
  type ReferralForm,
  type FieldErrors,
} from "@/lib/health/referral"
import { fileReferralAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

function mask(phone: string): string {
  const p = phone.trim()
  return p.length <= 4 ? p : `••••••${p.slice(-4)}`
}

export function ReferralFormUI() {
  const router = useRouter()
  const [f, setF] = useState<ReferralForm>(emptyReferral())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ReferralForm>(key: K, value: ReferralForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateReferral(f).errors : errors
  const referral = needsSpecialistReferral(f)
  const triage = triageBand(f)

  function submit() {
    setSubmitted(true)
    const v = validateReferral(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileReferralAction({
        student: f.studentName.trim(),
        category: f.category,
        specialistReferral: referral,
        details: {
          className: f.className.trim(),
          severity: f.severity,
          screeningDate: f.screeningDate,
          findings: f.findings.trim(),
          guardianMasked: mask(f.guardianPhone),
          triage,
        },
      })
      if (saved) router.push("/health-referrals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RBSK Health Screening / Referral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Student name *</Label><Input id="name" value={f.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="Full name" /><Err msg={shown.studentName} /></div>
          <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><Input id="cls" value={f.className} onChange={(e) => set("className", e.target.value)} placeholder="e.g. IV-B" /><Err msg={shown.className} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">RBSK category (4 Ds) *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{RBSK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sev">Severity *</Label>
            <select id="sev" value={f.severity} onChange={(e) => set("severity", e.target.value as ReferralForm["severity"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {SEVERITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.severity} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="date">Screening date *</Label><Input id="date" type="date" value={f.screeningDate} onChange={(e) => set("screeningDate", e.target.value)} /><Err msg={shown.screeningDate} /></div>
          <div className="space-y-1.5"><Label htmlFor="ph">Guardian phone *</Label><Input id="ph" value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="10-digit" /><Err msg={shown.guardianPhone} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="find">Findings *</Label>
          <Textarea id="find" value={f.findings} onChange={(e) => set("findings", e.target.value)} rows={3} placeholder="Screening findings (min 15 characters)." />
          <Err msg={shown.findings} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={triage === "Urgent" ? "destructive" : triage === "Priority" ? "secondary" : "outline"}>Triage: {triage}</Badge>
          <Badge variant={referral ? "default" : "outline"} className={referral ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>
            {referral ? "Specialist (DEIC) referral" : "Block-level care"}
          </Badge>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>Guardian consent obtained (DPDP) to refer and share health details with the medical officer.</span>
        </label>
        <Err msg={shown.consent} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit referral</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster</strong> → <strong>Block Medical Officer</strong>{referral ? <> → <strong>District DEIC specialist</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
