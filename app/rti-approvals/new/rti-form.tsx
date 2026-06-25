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
  emptyRti,
  validateRti,
  applicationFee,
  responseTiming,
  RTI_CATEGORIES,
  type RtiForm,
  type FieldErrors,
} from "@/lib/rti/request"
import { fileRtiAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function RtiFormUI() {
  const router = useRouter()
  const [f, setF] = useState<RtiForm>(emptyRti())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof RtiForm>(key: K, value: RtiForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateRti(f).errors : errors
  const fee = applicationFee(f)
  const timing = responseTiming(f)

  function submit() {
    setSubmitted(true)
    const v = validateRti(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileRtiAction({
        applicant: f.applicant.trim(),
        subject: f.subject.trim(),
        details: {
          category: f.category,
          informationSought: f.informationSought.trim(),
          fee,
          bpl: f.bpl,
          expedited: timing.expedited,
          deadline: timing.deadline,
        },
      })
      if (saved) router.push("/rti-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RTI Application (RTI Act 2005)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="app">Applicant name *</Label><Input id="app" value={f.applicant} onChange={(e) => set("applicant", e.target.value)} placeholder="Full name" /><Err msg={shown.applicant} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{RTI_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="sub">Subject *</Label><Input id="sub" value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Status of RTE reimbursement for 2025-26" /><Err msg={shown.subject} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="info">Information sought *</Label>
          <Textarea id="info" value={f.informationSought} onChange={(e) => set("informationSought", e.target.value)} rows={3} placeholder="The specific records/information requested (min 15 characters)." />
          <Err msg={shown.informationSought} />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.bpl} onChange={(e) => set("bpl", e.target.checked)} className="h-4 w-4" /><span>BPL applicant (fee exempt)</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.lifeAndLiberty} onChange={(e) => set("lifeAndLiberty", e.target.checked)} className="h-4 w-4" /><span>Concerns life &amp; liberty (expedite)</span></label>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Fee: ₹{fee}</Badge>
          <Badge variant={timing.expedited ? "destructive" : "secondary"}>Response in {timing.deadline}</Badge>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I am a citizen of India and the particulars are true.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit RTI</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>PIO</strong> → (appeal) <strong>FAA</strong> → (appeal) <strong>State Information Commission</strong>.</p>
        </div>
      </CardContent>
    </Card>
  )
}
