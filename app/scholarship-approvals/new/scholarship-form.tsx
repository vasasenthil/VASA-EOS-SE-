"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  emptyScholarship,
  validateScholarship,
  deriveEligibility,
  maskAccount,
  SCHOLARSHIP_SCHEMES,
  SOCIAL_CATEGORIES,
  type ScholarshipForm,
  type FieldErrors,
} from "@/lib/scholarship/application"
import { fileScholarshipAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function ScholarshipFormUI() {
  const router = useRouter()
  const [f, setF] = useState<ScholarshipForm>(emptyScholarship())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ScholarshipForm>(key: K, value: ScholarshipForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateScholarship(f).errors : errors
  const elig = deriveEligibility(f)

  function submit() {
    setSubmitted(true)
    const v = validateScholarship(f)
    setErrors(v.errors)
    if (!v.ok) return
    const e = deriveEligibility(f)
    startTransition(async () => {
      const saved = await fileScholarshipAction({
        student: f.studentName.trim(),
        scheme: f.scheme,
        amount: f.amount,
        details: {
          category: f.category,
          annualIncome: f.annualIncome,
          attendancePct: f.attendancePct,
          accountMasked: maskAccount(f.bankAccount),
          eligible: e.eligible,
          eligibilityReasons: e.reasons,
        },
      })
      if (saved) router.push("/scholarship-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scholarship / Benefit Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="name">Student name *</Label><Input id="name" value={f.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="Full name" /><Err msg={shown.studentName} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="scheme">Scheme *</Label>
            <select id="scheme" value={f.scheme} onChange={(e) => set("scheme", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{SCHOLARSHIP_SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.scheme} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Social category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{SOCIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="inc">Annual family income ₹ *</Label><Input id="inc" type="number" min={0} value={f.annualIncome || ""} onChange={(e) => set("annualIncome", Number(e.target.value))} placeholder="e.g. 120000" /><Err msg={shown.annualIncome} /></div>
          <div className="space-y-1.5"><Label htmlFor="att">Attendance % *</Label><Input id="att" type="number" min={0} max={100} value={f.attendancePct || ""} onChange={(e) => set("attendancePct", Number(e.target.value))} placeholder="e.g. 92" /><Err msg={shown.attendancePct} /></div>
          <div className="space-y-1.5"><Label htmlFor="acc">DBT bank account *</Label><Input id="acc" value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} placeholder="9–18 digit account no." /><Err msg={shown.bankAccount} /></div>
          <div className="space-y-1.5"><Label htmlFor="amt">Benefit amount ₹ *</Label><Input id="amt" type="number" min={0} value={f.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} placeholder="e.g. 12000" /><Err msg={shown.amount} /></div>
        </div>

        <div className="rounded-md border bg-muted/40 p-2.5 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">AI eligibility (Reasoning engine):</span>
            <Badge variant={elig.eligible ? "default" : "outline"} className={elig.eligible ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>
              {elig.eligible ? "Eligible" : "Review needed"}
            </Badge>
          </div>
          {elig.reasons.length ? <ul className="list-disc pl-4 text-muted-foreground">{elig.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="text-muted-foreground">Fill the form to derive eligibility.</p>}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the particulars are true and consent to DBT disbursement (DPDP).</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit application</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster</strong> → <strong>BEO sanction</strong>{f.amount >= 25000 ? <> → <strong>DEO scrutiny</strong></> : null} → <strong>DBT release</strong>.</p>
        </div>
      </CardContent>
    </Card>
  )
}
