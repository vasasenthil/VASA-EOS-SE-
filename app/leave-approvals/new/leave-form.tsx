"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  emptyLeave,
  validateLeave,
  durationDays,
  completenessPct,
  LEAVE_TYPES,
  type LeaveApplicationForm,
  type LeaveType,
  type FieldErrors,
} from "@/lib/leave/application"
import { fileLeaveFlowAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function LeaveFormUI() {
  const router = useRouter()
  const [f, setF] = useState<LeaveApplicationForm>(emptyLeave())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof LeaveApplicationForm>(key: K, value: LeaveApplicationForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateLeave(f).errors : errors
  const pct = completenessPct(f)
  const days = durationDays(f)

  function submit() {
    setSubmitted(true)
    const v = validateLeave(f)
    setErrors(v.errors)
    if (!v.ok || !f.type) return
    startTransition(async () => {
      const saved = await fileLeaveFlowAction({
        teacher: f.teacher.trim(),
        type: f.type as LeaveType,
        from: f.from,
        to: f.to,
        reason: f.reason.trim(),
        details: { substitute: f.substitute.trim() || undefined, contact: f.contact.trim() || undefined, medicalCert: f.medicalCert },
      })
      if (saved) router.push("/leave-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Leave Application</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="teacher">Teacher name *</Label><Input id="teacher" value={f.teacher} onChange={(e) => set("teacher", e.target.value)} /><Err msg={shown.teacher} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Leave type *</Label>
            <select id="type" value={f.type} onChange={(e) => set("type", e.target.value as LeaveType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{LEAVE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select><Err msg={shown.type} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="from">From *</Label><Input id="from" type="date" value={f.from} onChange={(e) => set("from", e.target.value)} /><Err msg={shown.from} /></div>
          <div className="space-y-1.5"><Label htmlFor="to">To *</Label><Input id="to" type="date" value={f.to} onChange={(e) => set("to", e.target.value)} /><Err msg={shown.to} /></div>
          <div className="space-y-1.5"><Label htmlFor="sub">Substitute arrangement</Label><Input id="sub" value={f.substitute} onChange={(e) => set("substitute", e.target.value)} placeholder="Who covers your classes" /></div>
          <div className="space-y-1.5"><Label htmlFor="contact">Contact while on leave</Label><Input id="contact" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="10-digit (optional)" /><Err msg={shown.contact} /></div>
        </div>

        {days > 0 && <Badge variant="secondary">Duration: {days} day{days > 1 ? "s" : ""}</Badge>}

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason *</Label>
          <Textarea id="reason" value={f.reason} onChange={(e) => set("reason", e.target.value)} rows={3} placeholder="Reason for leave (min 10 characters)" />
          <Err msg={shown.reason} />
        </div>

        {f.type === "medical" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.medicalCert} onChange={(e) => set("medicalCert", e.target.checked)} className="h-4 w-4" />
            Medical certificate attached <span className="text-xs text-muted-foreground">(required beyond 2 days)</span>
          </label>
        )}
        <Err msg={shown.medicalCert} />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I declare the information is correct and I have arranged for my duties to be covered.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit leave request</Button>
          <p className="text-xs text-muted-foreground">Routes <strong>Principal → BEO → DEO</strong> with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}
