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
  emptyBudget,
  validateBudget,
  needsCabinet,
  PROPOSAL_TYPES,
  BUDGET_HEADS,
  type BudgetForm,
  type FieldErrors,
} from "@/lib/finance/budget"
import { fileBudgetAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function BudgetFormUI() {
  const router = useRouter()
  const [f, setF] = useState<BudgetForm>(emptyBudget())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof BudgetForm>(key: K, value: BudgetForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateBudget(f).errors : errors
  const cabinet = needsCabinet(f)
  const isReappr = f.proposalType === "Re-appropriation"

  function submit() {
    setSubmitted(true)
    const v = validateBudget(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileBudgetAction({
        scheme: f.scheme.trim(),
        amount: f.amount,
        needsCabinet: cabinet,
        details: {
          proposalType: f.proposalType,
          budgetHead: f.budgetHead,
          fromHead: isReappr ? f.fromHead : undefined,
          fiscalYear: f.fiscalYear,
          justification: f.justification.trim(),
          needsCabinet: cabinet,
        },
      })
      if (saved) router.push("/budget-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Sanction / Re-appropriation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="scheme">Scheme / purpose *</Label><Input id="scheme" value={f.scheme} onChange={(e) => set("scheme", e.target.value)} placeholder="e.g. Smart classrooms expansion" /><Err msg={shown.scheme} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pt">Proposal type *</Label>
            <select id="pt" value={f.proposalType} onChange={(e) => set("proposalType", e.target.value as BudgetForm["proposalType"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {PROPOSAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select><Err msg={shown.proposalType} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="fy">Fiscal year *</Label><Input id="fy" value={f.fiscalYear} onChange={(e) => set("fiscalYear", e.target.value)} placeholder="2026-27" /><Err msg={shown.fiscalYear} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="bh">Budget head (target) *</Label>
            <select id="bh" value={f.budgetHead} onChange={(e) => set("budgetHead", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{BUDGET_HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select><Err msg={shown.budgetHead} />
          </div>
          {isReappr ? (
            <div className="space-y-1.5">
              <Label htmlFor="fh">Source head (from) *</Label>
              <select id="fh" value={f.fromHead} onChange={(e) => set("fromHead", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select…</option>{BUDGET_HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select><Err msg={shown.fromHead} />
            </div>
          ) : null}
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="amt">Amount ₹ *</Label><Input id="amt" type="number" min={0} value={f.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} placeholder="e.g. 250000000" /><Err msg={shown.amount} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="just">Justification *</Label>
          <Textarea id="just" value={f.justification} onChange={(e) => set("justification", e.target.value)} rows={2} placeholder="Need, expected outcome and fund position (min 20 characters)." />
          <Err msg={shown.justification} />
        </div>

        <Badge variant={cabinet ? "default" : "secondary"}>{cabinet ? "Needs Cabinet / Minister approval" : "Secretariat-level sanction"}</Badge>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the proposal, the fund position and Finance Department concurrence requirements.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit proposal</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Directorate</strong> → <strong>Secretariat &amp; Finance</strong>{cabinet ? <> → <strong>Cabinet / Minister</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
