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
  emptyResolution,
  validateResolution,
  quorumMet,
  completenessPct,
  SMC_QUORUM,
  RESOLUTION_CATEGORIES,
  type SmcResolutionForm,
  type FieldErrors,
} from "@/lib/smc/resolution"
import { fileResolutionAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function ResolutionFormUI() {
  const router = useRouter()
  const [f, setF] = useState<SmcResolutionForm>(emptyResolution())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof SmcResolutionForm>(key: K, value: SmcResolutionForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateResolution(f).errors : errors
  const pct = completenessPct(f)

  function submit() {
    setSubmitted(true)
    const v = validateResolution(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileResolutionAction({
        title: f.title.trim(),
        description: f.description.trim(),
        details: {
          category: f.category,
          meetingDate: f.meetingDate,
          proposedBy: f.proposedBy.trim(),
          secondedBy: f.secondedBy.trim(),
          membersPresent: f.membersPresent,
          fundImplication: f.fundImplication || undefined,
        },
      })
      if (saved) router.push("/smc-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMC Resolution (RTE §21)</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="title">Resolution title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Approve kitchen repair" /><Err msg={shown.title} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{RESOLUTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="date">Meeting date *</Label><Input id="date" type="date" value={f.meetingDate} onChange={(e) => set("meetingDate", e.target.value)} /><Err msg={shown.meetingDate} /></div>
          <div className="space-y-1.5"><Label htmlFor="prop">Proposed by *</Label><Input id="prop" value={f.proposedBy} onChange={(e) => set("proposedBy", e.target.value)} placeholder="Member name" /><Err msg={shown.proposedBy} /></div>
          <div className="space-y-1.5"><Label htmlFor="sec">Seconded by *</Label><Input id="sec" value={f.secondedBy} onChange={(e) => set("secondedBy", e.target.value)} placeholder="A different member" /><Err msg={shown.secondedBy} /></div>
          <div className="space-y-1.5"><Label htmlFor="members">Members present *</Label><Input id="members" type="number" min={0} value={f.membersPresent || ""} onChange={(e) => set("membersPresent", Number(e.target.value))} placeholder={`Quorum ≥ ${SMC_QUORUM}`} /><Err msg={shown.membersPresent} /></div>
          <div className="space-y-1.5"><Label htmlFor="fund">Fund implication ₹ (optional)</Label><Input id="fund" type="number" min={0} value={f.fundImplication || ""} onChange={(e) => set("fundImplication", Number(e.target.value))} placeholder="0" /><Err msg={shown.fundImplication} /></div>
        </div>

        {f.membersPresent > 0 && <Badge variant={quorumMet(f) ? "default" : "outline"} className={quorumMet(f) ? "" : "border-amber-500 text-amber-600 dark:text-amber-500"}>{quorumMet(f) ? "Quorum met" : `Quorum NOT met (need ${SMC_QUORUM})`}</Badge>}

        <div className="space-y-1.5">
          <Label htmlFor="desc">Resolution text *</Label>
          <Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="The full text of the resolution as passed (min 30 characters)." />
          <Err msg={shown.description} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I confirm this resolution was duly proposed, seconded and passed by the quorum present.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit resolution</Button>
          <p className="text-xs text-muted-foreground">Routes to a <strong>3-member quorum</strong> approval, then <strong>Principal counter-sign</strong>, with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}
