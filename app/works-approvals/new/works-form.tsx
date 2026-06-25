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
  emptyWorks,
  validateWorks,
  isHighValue,
  isMandated,
  WORK_TYPES,
  FUNDING_SOURCES,
  type WorksForm,
  type FieldErrors,
} from "@/lib/infrastructure/works"
import { fileWorksAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function WorksFormUI() {
  const router = useRouter()
  const [f, setF] = useState<WorksForm>(emptyWorks())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof WorksForm>(key: K, value: WorksForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateWorks(f).errors : errors
  const highValue = isHighValue(f)
  const mandated = isMandated(f)

  function submit() {
    setSubmitted(true)
    const v = validateWorks(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileWorksAction({
        school: f.school.trim(),
        workType: f.workType,
        cost: f.estimatedCost,
        details: { fundingSource: f.fundingSource, justification: f.justification.trim(), mandated },
      })
      if (saved) router.push("/works-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infrastructure Works Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="school">School *</Label><Input id="school" value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. GHSS Egmore" /><Err msg={shown.school} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wt">Work type *</Label>
            <select id="wt" value={f.workType} onChange={(e) => set("workType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select><Err msg={shown.workType} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs">Funding source *</Label>
            <select id="fs" value={f.fundingSource} onChange={(e) => set("fundingSource", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><Err msg={shown.fundingSource} />
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cost">Estimated cost ₹ *</Label><Input id="cost" type="number" min={0} value={f.estimatedCost || ""} onChange={(e) => set("estimatedCost", Number(e.target.value))} placeholder="e.g. 850000" /><Err msg={shown.estimatedCost} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="just">Justification *</Label>
          <Textarea id="just" value={f.justification} onChange={(e) => set("justification", e.target.value)} rows={3} placeholder="Need, beneficiaries and norm reference (min 20 characters)." />
          <Err msg={shown.justification} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={highValue ? "secondary" : "outline"}>{highValue ? "High-value (Directorate approval)" : "District-level sanction"}</Badge>
          {mandated ? <Badge variant="default">RTE/RPwD-mandated · priority</Badge> : null}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the proposal, estimate and site readiness.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit proposal</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster</strong> → <strong>Block AE</strong> → <strong>District EE/DEO</strong>{highValue ? <> → <strong>Directorate</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
