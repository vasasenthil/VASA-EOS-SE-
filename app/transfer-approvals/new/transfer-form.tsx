"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  emptyTransfer,
  validateTransfer,
  isInterDistrict,
  transferEligibility,
  TRANSFER_REASONS,
  TN_DISTRICTS,
  type TransferForm,
  type FieldErrors,
} from "@/lib/staff/transfer"
import { fileTransferAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function TransferFormUI() {
  const router = useRouter()
  const [f, setF] = useState<TransferForm>(emptyTransfer())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof TransferForm>(key: K, value: TransferForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateTransfer(f).errors : errors
  const inter = isInterDistrict(f)
  const elig = transferEligibility(f)

  function submit() {
    setSubmitted(true)
    const v = validateTransfer(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileTransferAction({
        teacher: f.teacherName.trim(),
        interDistrict: inter,
        details: {
          currentSchool: f.currentSchool.trim(),
          currentDistrict: f.currentDistrict,
          requestedDistrict: f.requestedDistrict,
          requestedSchool: f.requestedSchool.trim(),
          reason: f.reason,
          yearsOfService: f.yearsOfService,
          eligible: elig.eligible,
          eligibilityReason: elig.reason,
        },
      })
      if (saved) router.push("/transfer-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Transfer Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="name">Teacher name *</Label><Input id="name" value={f.teacherName} onChange={(e) => set("teacherName", e.target.value)} placeholder="Full name" /><Err msg={shown.teacherName} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="cs">Current school *</Label><Input id="cs" value={f.currentSchool} onChange={(e) => set("currentSchool", e.target.value)} placeholder="e.g. GHSS Egmore" /><Err msg={shown.currentSchool} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cd">Current district *</Label>
            <select id="cd" value={f.currentDistrict} onChange={(e) => set("currentDistrict", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select><Err msg={shown.currentDistrict} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rd">Requested district *</Label>
            <select id="rd" value={f.requestedDistrict} onChange={(e) => set("requestedDistrict", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select><Err msg={shown.requestedDistrict} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="rs">Requested school / place *</Label><Input id="rs" value={f.requestedSchool} onChange={(e) => set("requestedSchool", e.target.value)} placeholder="e.g. GHSS Coimbatore" /><Err msg={shown.requestedSchool} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <select id="reason" value={f.reason} onChange={(e) => set("reason", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{TRANSFER_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select><Err msg={shown.reason} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="yos">Years of service *</Label><Input id="yos" type="number" min={0} max={40} value={f.yearsOfService || ""} onChange={(e) => set("yearsOfService", Number(e.target.value))} placeholder="e.g. 8" /><Err msg={shown.yearsOfService} /></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={elig.eligible ? "default" : "outline"} className={elig.eligible ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>{elig.eligible ? "Eligible" : "Not eligible"}</Badge>
          <Badge variant={inter ? "secondary" : "outline"}>{inter ? "Inter-district (Directorate sanction)" : "Intra-district"}</Badge>
          <span className="text-muted-foreground">{elig.reason}</span>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the request particulars are true.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit request</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster NOC</strong> → <strong>BEO</strong> → <strong>DEO counselling</strong>{inter ? <> → <strong>Directorate sanction</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
