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
  emptyTicket,
  validateTicket,
  completenessPct,
  MAINT_CATEGORIES,
  MAINT_PRIORITIES,
  type MaintTicketForm,
  type Priority,
  type FieldErrors,
} from "@/lib/maintenance/ticket"
import { raiseTicketFlowAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function TicketFormUI() {
  const router = useRouter()
  const [f, setF] = useState<MaintTicketForm>(emptyTicket())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof MaintTicketForm>(key: K, value: MaintTicketForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateTicket(f).errors : errors
  const pct = completenessPct(f)

  function submit() {
    setSubmitted(true)
    const v = validateTicket(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await raiseTicketFlowAction({
        category: f.category,
        description: f.description.trim(),
        priority: f.priority,
        details: {
          location: f.location.trim(),
          reportedBy: f.reportedBy.trim(),
          estimatedCost: f.estimatedCost || undefined,
          preferredDate: f.preferredDate || undefined,
          safetyHazard: f.safetyHazard || undefined,
        },
      })
      if (saved) router.push("/maintenance-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raise a Maintenance Ticket</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="loc">Location (block / room) *</Label><Input id="loc" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Block B, Room 12" /><Err msg={shown.location} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{MAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prio">Priority *</Label>
            <select id="prio" value={f.priority} onChange={(e) => set("priority", e.target.value as Priority)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {MAINT_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select><Err msg={shown.priority} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="rep">Reported by *</Label><Input id="rep" value={f.reportedBy} onChange={(e) => set("reportedBy", e.target.value)} placeholder="Your name" /><Err msg={shown.reportedBy} /></div>
          <div className="space-y-1.5"><Label htmlFor="cost">Estimated cost ₹ (optional)</Label><Input id="cost" type="number" min={0} value={f.estimatedCost || ""} onChange={(e) => set("estimatedCost", Number(e.target.value))} placeholder="0" /><Err msg={shown.estimatedCost} /></div>
          <div className="space-y-1.5"><Label htmlFor="pref">Preferred completion (optional)</Label><Input id="pref" type="date" value={f.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} /><Err msg={shown.preferredDate} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Fault description *</Label>
          <Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="What is broken, since when, and any impact on teaching or safety (min 20 characters)." />
          <Err msg={shown.description} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.safetyHazard} onChange={(e) => { const on = e.target.checked; set("safetyHazard", on); if (on) set("priority", "high") }} className="mt-0.5 h-4 w-4" />
          <span>This fault is a <strong>safety hazard</strong> (escalates to high priority).</span>
        </label>
        {f.safetyHazard && <Badge variant="default" className="bg-red-600 hover:bg-red-600">Safety hazard — high priority</Badge>}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I confirm the fault details above are accurate to the best of my knowledge.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Raise ticket</Button>
          <p className="text-xs text-muted-foreground">Routes to <strong>Principal triage</strong> → <strong>Vendor work</strong> → <strong>Principal verify &amp; close</strong>, with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}
