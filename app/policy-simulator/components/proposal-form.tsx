"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Scale, ShieldCheck } from "lucide-react"
import {
  emptyProposal, validateProposal, project, inr,
  SCOPE_TIERS, PROPOSAL_STATUSES,
  type ProposalInput, type ProposalErrors,
} from "@/lib/policysim"
import { createProposalAction, updateProposalAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function ProposalForm({ id, initial }: { id?: string; initial?: ProposalInput }) {
  const router = useRouter()
  const [f, setF] = useState<ProposalInput>(initial ?? emptyProposal())
  const [errors, setErrors] = useState<ProposalErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof ProposalInput>(k: K, v: ProposalInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateProposal(f).errors : errors
  const proj = project(f) // live Policy Engine projection

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateProposal(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateProposalAction(id, f) : await createProposalAction(f)
      if (res.ok) router.push(id ? `/policy-simulator/${id}` : "/policy-simulator")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the proposal.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit policy proposal" : "New policy proposal"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Proposal</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Pudhumai Penn — expand to 90%" /><Err msg={shown.title} /></div>
            <div className="space-y-1.5"><Label htmlFor="scheme">Scheme *</Label><Input id="scheme" value={f.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="Pudhumai Penn" /><Err msg={shown.scheme} /></div>
            <div className="space-y-1.5"><Label htmlFor="scope">Scope *</Label><select id="scope" value={f.scope} onChange={(e) => set("scope", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SCOPE_TIERS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.scope} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Baseline & lever</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="pop">Eligible population *</Label><Input id="pop" type="number" min={1} value={f.population} onChange={(e) => set("population", Number(e.target.value))} /><Err msg={shown.population} /></div>
            <div className="space-y-1.5"><Label htmlFor="base">Current coverage (%) *</Label><Input id="base" type="number" min={0} max={100} value={f.baselineCoveragePct} onChange={(e) => set("baselineCoveragePct", Number(e.target.value))} /><Err msg={shown.baselineCoveragePct} /></div>
            <div className="space-y-1.5"><Label htmlFor="target">Target coverage (%) *</Label><Input id="target" type="number" min={0} max={100} value={f.targetCoveragePct} onChange={(e) => set("targetCoveragePct", Number(e.target.value))} /><Err msg={shown.targetCoveragePct} /></div>
            <div className="space-y-1.5"><Label htmlFor="cost">Unit cost / beneficiary (₹) *</Label><Input id="cost" type="number" min={0} value={f.unitCost} onChange={(e) => set("unitCost", Number(e.target.value))} /><Err msg={shown.unitCost} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.equityWeighted} onChange={(e) => set("equityWeighted", e.target.checked)} className="h-4 w-4" />Equity-weighted (prioritise under-served blocks)</label>
        </section>

        {/* Live Policy Engine projection */}
        <section className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Scale className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold">Policy Engine projection</span>
            <Badge className="bg-indigo-100 text-indigo-700 border-0"><ShieldCheck className="mr-1 h-3 w-3" />Human authority</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">+{proj.newlyCovered.toLocaleString("en-IN")} beneficiaries</Badge>
            <Badge variant="secondary">coverage → {Math.round(proj.projectedCoverage * 100)}%</Badge>
            <Badge variant="secondary">indicative {inr(proj.indicativeCost)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{proj.explanation}</p>
          <p className="text-xs text-muted-foreground">{proj.equityNote}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Sanction decision (authority decides)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as ProposalInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{PROPOSAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
            <div className="space-y-1.5"><Label htmlFor="decided">Sanctioning authority</Label><Input id="decided" value={f.decidedBy} onChange={(e) => set("decidedBy", e.target.value)} placeholder="DEO / Secretary" /><Err msg={shown.decidedBy} /></div>
            <div className="space-y-1.5"><Label htmlFor="budget">Sanctioned budget (₹)</Label><Input id="budget" type="number" min={0} value={f.sanctionedBudget} onChange={(e) => set("sanctionedBudget", Number(e.target.value))} /><Err msg={shown.sanctionedBudget} /></div>
          </div>
          <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Decision notes / conditions…" />
        </section>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create proposal"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
