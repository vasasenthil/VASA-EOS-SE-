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
  emptyFundLedger, validateFundLedger, view, SCHEME_CODES, FUND_TIERS,
  type FundLedgerInput, type FundLedgerErrors, type FundLedgerRecord,
} from "@/lib/fundledger"
import { createFundAction, updateFundAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}
function inrCr(n: number): string {
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`
}

export function FundForm({ id, initial }: { id?: string; initial?: FundLedgerInput }) {
  const router = useRouter()
  const [f, setF] = useState<FundLedgerInput>(initial ?? emptyFundLedger())
  const [errors, setErrors] = useState<FundLedgerErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof FundLedgerInput>(k: K, v: FundLedgerInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateFundLedger(f).errors : errors
  const preview = view({ ...f, id: "", tenantId: "", createdAt: "", updatedAt: "" } as FundLedgerRecord)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateFundLedger(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateFundAction(id, f) : await createFundAction(f)
      if (res.ok) router.push(id ? `/scheme-fund-flow/${id}` : "/scheme-fund-flow")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the ledger row.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit fund-flow row" : "New fund-flow row"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Scheme</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="code">Scheme code *</Label><select id="code" value={f.schemeCode} onChange={(e) => set("schemeCode", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SCHEME_CODES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.schemeCode} /></div>
            <div className="space-y-1.5"><Label htmlFor="name">Scheme name *</Label><Input id="name" value={f.schemeName} onChange={(e) => set("schemeName", e.target.value)} placeholder="Samagra Shiksha" /><Err msg={shown.schemeName} /></div>
            <div className="space-y-1.5"><Label htmlFor="fy">Financial year *</Label><Input id="fy" value={f.financialYear} onChange={(e) => set("financialYear", e.target.value)} placeholder="2025-26" /><Err msg={shown.financialYear} /></div>
            <div className="space-y-1.5"><Label htmlFor="tier">Tier *</Label><select id="tier" value={f.tier} onChange={(e) => set("tier", e.target.value as FundLedgerInput["tier"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{FUND_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.tier} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Fund flow (whole rupees) — allocated ≥ released ≥ utilised</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="allocated">Allocated *</Label><Input id="allocated" type="number" min={0} value={f.allocated} onChange={(e) => set("allocated", Number(e.target.value))} /><Err msg={shown.allocated} /><p className="text-xs text-muted-foreground">{inrCr(f.allocated || 0)}</p></div>
            <div className="space-y-1.5"><Label htmlFor="released">Released *</Label><Input id="released" type="number" min={0} value={f.released} onChange={(e) => set("released", Number(e.target.value))} /><Err msg={shown.released} /><p className="text-xs text-muted-foreground">{inrCr(f.released || 0)}</p></div>
            <div className="space-y-1.5"><Label htmlFor="utilised">Utilised *</Label><Input id="utilised" type="number" min={0} value={f.utilised} onChange={(e) => set("utilised", Number(e.target.value))} /><Err msg={shown.utilised} /><p className="text-xs text-muted-foreground">{inrCr(f.utilised || 0)}</p></div>
            <div className="space-y-1.5"><Label htmlFor="asof">As of *</Label><Input id="asof" type="date" value={f.asOf} onChange={(e) => set("asOf", e.target.value)} /><Err msg={shown.asOf} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Release rate {preview.releaseRate}%</Badge>
            <Badge variant="secondary">Utilisation {preview.utilisationPct}%</Badge>
            <Badge variant="secondary">Unspent {inrCr(Math.max(0, preview.unspent))}</Badge>
          </div>
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>
        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create row"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
