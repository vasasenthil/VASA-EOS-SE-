"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ELIGIBILITY_CRITERIA } from "@/lib/recognition"
import {
  emptyApplication,
  validateApplication,
  completenessPct,
  MANAGEMENT_OPTIONS,
  LAND_STATUS_OPTIONS,
  type RecognitionApplicationForm,
  type FieldErrors,
} from "@/lib/recognition/application"
import { fileRecognitionAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function RecognitionApplicationFormUI() {
  const router = useRouter()
  const [f, setF] = useState<RecognitionApplicationForm>(emptyApplication())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof RecognitionApplicationForm>(key: K, value: RecognitionApplicationForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }
  function toggleCriterion(c: string) {
    setF((prev) => ({ ...prev, criteriaMet: prev.criteriaMet.includes(c) ? prev.criteriaMet.filter((x) => x !== c) : [...prev.criteriaMet, c] }))
  }

  const live = validateApplication(f)
  const shown = submitted ? live.errors : errors
  const pct = completenessPct(f)

  function submit() {
    setSubmitted(true)
    const v = validateApplication(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileRecognitionAction({
        school: f.school.trim(),
        district: f.district.trim(),
        type: f.type,
        details: {
          block: f.block.trim(),
          management: f.management,
          trustRegNo: f.trustRegNo.trim() || undefined,
          udiseCode: f.udiseCode.trim() || undefined,
          landStatus: f.landStatus,
          contactEmail: f.contactEmail.trim(),
          contactPhone: f.contactPhone.trim(),
          criteriaMet: f.criteriaMet,
        },
      })
      if (saved) router.push("/recognition-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Recognition Application (TN 1973 Act)</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="school">School name *</Label><Input id="school" value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. GHSS Egmore" /><Err msg={shown.school} /></div>
          <div className="space-y-1.5"><Label htmlFor="district">District *</Label><Input id="district" value={f.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Chennai" /><Err msg={shown.district} /></div>
          <div className="space-y-1.5"><Label htmlFor="block">Block *</Label><Input id="block" value={f.block} onChange={(e) => set("block", e.target.value)} placeholder="e.g. Chennai North" /><Err msg={shown.block} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Application type *</Label>
            <select id="type" value={f.type} onChange={(e) => set("type", e.target.value as RecognitionApplicationForm["type"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="new">New recognition</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mgmt">Management *</Label>
            <select id="mgmt" value={f.management} onChange={(e) => set("management", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>
              {MANAGEMENT_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Err msg={shown.management} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="land">Land status *</Label>
            <select id="land" value={f.landStatus} onChange={(e) => set("landStatus", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>
              {LAND_STATUS_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <Err msg={shown.landStatus} />
          </div>
          {f.type === "new" ? (
            <div className="space-y-1.5"><Label htmlFor="trust">Trust / Society reg. no. *</Label><Input id="trust" value={f.trustRegNo} onChange={(e) => set("trustRegNo", e.target.value)} placeholder="e.g. TR/2026/0091" /><Err msg={shown.trustRegNo} /></div>
          ) : (
            <div className="space-y-1.5"><Label htmlFor="udise">UDISE code (11 digits) *</Label><Input id="udise" value={f.udiseCode} onChange={(e) => set("udiseCode", e.target.value)} placeholder="e.g. 33010100101" /><Err msg={shown.udiseCode} /></div>
          )}
          <div className="space-y-1.5"><Label htmlFor="email">Contact email *</Label><Input id="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="head@school.tn.gov.in" /><Err msg={shown.contactEmail} /></div>
          <div className="space-y-1.5"><Label htmlFor="phone">Contact phone *</Label><Input id="phone" value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="10-digit mobile" /><Err msg={shown.contactPhone} /></div>
        </div>

        <div className="space-y-2">
          <Label>Statutory eligibility criteria (attest at least 4) *</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ELIGIBILITY_CRITERIA.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.criteriaMet.includes(c)} onChange={() => toggleCriterion(c)} className="h-4 w-4" />
                {c}
              </label>
            ))}
          </div>
          <Err msg={shown.criteriaMet} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I declare that the particulars furnished are true, and I understand that suppression of facts attracts withdrawal of recognition under the TN 1973 Act.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit application</Button>
          <p className="text-xs text-muted-foreground">On submit, the application routes <strong>BEO → DEO → Director</strong> with a full audit trail; any tier can reject.</p>
        </div>
      </CardContent>
    </Card>
  )
}
