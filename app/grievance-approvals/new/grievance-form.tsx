"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  emptyGrievance,
  validateGrievance,
  completenessPct,
  GRIEVANCE_CATEGORIES,
  RELATIONSHIPS,
  URGENCY_LEVELS,
  type GrievanceFilingForm,
  type FieldErrors,
} from "@/lib/grievance/filing"
import { fileGrievanceFlowAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function GrievanceFormUI() {
  const router = useRouter()
  const [f, setF] = useState<GrievanceFilingForm>(emptyGrievance())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof GrievanceFilingForm>(key: K, value: GrievanceFilingForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateGrievance(f).errors : errors
  const pct = completenessPct(f)

  function submit() {
    setSubmitted(true)
    const v = validateGrievance(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileGrievanceFlowAction({
        applicant: f.applicantName.trim(),
        category: f.category,
        description: f.description.trim(),
        details: {
          relationship: f.relationship,
          contactPhone: f.contactPhone.trim(),
          contactEmail: f.contactEmail.trim() || undefined,
          school: f.school.trim(),
          district: f.district.trim(),
          subject: f.subject.trim(),
          urgency: f.urgency,
        },
      })
      if (saved) router.push("/grievance-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File a Grievance</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Your name *</Label><Input id="name" value={f.applicantName} onChange={(e) => set("applicantName", e.target.value)} placeholder="e.g. R. Murugan" /><Err msg={shown.applicantName} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="rel">You are a *</Label>
            <select id="rel" value={f.relationship} onChange={(e) => set("relationship", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Err msg={shown.relationship} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="phone">Contact phone *</Label><Input id="phone" value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="10-digit mobile" /><Err msg={shown.contactPhone} /></div>
          <div className="space-y-1.5"><Label htmlFor="email">Contact email (optional)</Label><Input id="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="you@example.com" /><Err msg={shown.contactEmail} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>
              {GRIEVANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="urg">Urgency *</Label>
            <select id="urg" value={f.urgency} onChange={(e) => set("urgency", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <Err msg={shown.urgency} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="school">School *</Label><Input id="school" value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. GHSS Egmore" /><Err msg={shown.school} /></div>
          <div className="space-y-1.5"><Label htmlFor="district">District *</Label><Input id="district" value={f.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Chennai" /><Err msg={shown.district} /></div>
        </div>

        <div className="space-y-1.5"><Label htmlFor="subject">Subject *</Label><Input id="subject" value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="One-line summary" /><Err msg={shown.subject} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description *</Label>
          <Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe what happened, when, and who was involved (min 20 characters)." />
          <Err msg={shown.description} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I consent to my details being processed (DPDP 2023) to redress this complaint and to being contacted about it.</span>
        </label>
        <Err msg={shown.consent} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit grievance</Button>
          <p className="text-xs text-muted-foreground">Routes <strong>Principal → BEO → DEO</strong>, escalating tier by tier with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}
