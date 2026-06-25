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
  emptyAsset, validateAsset, totalValue, bookValue, isLowStock, inr,
  ASSET_CATEGORIES, CONDITIONS, ASSET_STATUSES, UNITS, FUNDING_SOURCES,
  type AssetInput, type AssetErrors,
} from "@/lib/assetmgmt"
import { createAssetAction, updateAssetAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function AssetForm({ id, initial }: { id?: string; initial?: AssetInput }) {
  const router = useRouter()
  const [f, setF] = useState<AssetInput>(initial ?? emptyAsset())
  const [errors, setErrors] = useState<AssetErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof AssetInput>(k: K, v: AssetInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateAsset(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateAsset(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateAssetAction(id, f) : await createAssetAction(f)
      if (res.ok) router.push(id ? `/asset-register/${id}` : "/asset-register")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the asset.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit asset" : "New asset"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Identity</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="tag">Asset tag *</Label><Input id="tag" value={f.assetTag} onChange={(e) => set("assetTag", e.target.value.toUpperCase())} placeholder="AST-00101" /><Err msg={shown.assetTag} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="name">Name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Desktop computer" /><Err msg={shown.name} /></div>
            <div className="space-y-1.5"><Label htmlFor="cat">Category *</Label><select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="loc">Location *</Label><Input id="loc" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Computer lab" /><Err msg={shown.location} /></div>
            <div className="space-y-1.5"><Label htmlFor="qty">Quantity *</Label><Input id="qty" type="number" min={0} value={f.quantity} onChange={(e) => set("quantity", Number(e.target.value))} /><Err msg={shown.quantity} /></div>
            <div className="space-y-1.5"><Label htmlFor="unit">Unit *</Label><select id="unit" value={f.unit} onChange={(e) => set("unit", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select><Err msg={shown.unit} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Condition & assignment</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="cond">Condition *</Label><select id="cond" value={f.condition} onChange={(e) => set("condition", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.condition} /></div>
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as AssetInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="assigned">Assigned to</Label><Input id="assigned" value={f.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} placeholder="Person / department" disabled={f.status !== "Assigned"} /><Err msg={shown.assignedTo} /></div>
            <div className="space-y-1.5"><Label htmlFor="reorder">Reorder level</Label><Input id="reorder" type="number" min={0} value={f.reorderLevel} onChange={(e) => set("reorderLevel", Number(e.target.value))} /><Err msg={shown.reorderLevel} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Procurement & valuation</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="pd">Purchase date *</Label><Input id="pd" type="date" value={f.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} /><Err msg={shown.purchaseDate} /></div>
            <div className="space-y-1.5"><Label htmlFor="uc">Unit cost (₹) *</Label><Input id="uc" type="number" min={0} value={f.unitCost} onChange={(e) => set("unitCost", Number(e.target.value))} /><Err msg={shown.unitCost} /></div>
            <div className="space-y-1.5"><Label htmlFor="life">Useful life (yrs) *</Label><Input id="life" type="number" min={1} value={f.usefulLifeYears} onChange={(e) => set("usefulLifeYears", Number(e.target.value))} /><Err msg={shown.usefulLifeYears} /></div>
            <div className="space-y-1.5"><Label htmlFor="fund">Funding source *</Label><select id="fund" value={f.fundingSource} onChange={(e) => set("fundingSource", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.fundingSource} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Purchase value</span><Badge variant="secondary">{inr(totalValue(f))}</Badge>
            <span className="text-muted-foreground">· Book value (now)</span><Badge variant="secondary">{inr(bookValue(f))}</Badge>
            {isLowStock(f) ? <Badge className="bg-red-100 text-red-700 border-0">Low stock</Badge> : null}
          </div>
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create asset"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
