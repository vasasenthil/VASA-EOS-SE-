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
  emptyIndent,
  validateIndent,
  purchaseMode,
  isTender,
  PROCUREMENT_CATEGORIES,
  FUNDING_HEADS,
  type IndentForm,
  type FieldErrors,
} from "@/lib/procurement/indent"
import { fileIndentAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function IndentFormUI() {
  const router = useRouter()
  const [f, setF] = useState<IndentForm>(emptyIndent())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof IndentForm>(key: K, value: IndentForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateIndent(f).errors : errors
  const mode = purchaseMode(f)
  const tender = isTender(f)

  function submit() {
    setSubmitted(true)
    const v = validateIndent(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileIndentAction({
        item: f.item.trim(),
        category: f.category,
        cost: f.estimatedCost,
        details: { quantity: f.quantity, fundingHead: f.fundingHead, justification: f.justification.trim(), mode },
      })
      if (saved) router.push("/procurement-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement Indent (GeM / GFR 2017)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat">Category *</Label>
            <select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{PROCUREMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.category} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fh">Funding head *</Label>
            <select id="fh" value={f.fundingHead} onChange={(e) => set("fundingHead", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{FUNDING_HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select><Err msg={shown.fundingHead} />
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="item">Item description *</Label><Input id="item" value={f.item} onChange={(e) => set("item", e.target.value)} placeholder="e.g. 40 dual-desk benches" /><Err msg={shown.item} /></div>
          <div className="space-y-1.5"><Label htmlFor="qty">Quantity *</Label><Input id="qty" type="number" min={1} value={f.quantity || ""} onChange={(e) => set("quantity", Number(e.target.value))} /><Err msg={shown.quantity} /></div>
          <div className="space-y-1.5"><Label htmlFor="cost">Estimated cost ₹ *</Label><Input id="cost" type="number" min={0} value={f.estimatedCost || ""} onChange={(e) => set("estimatedCost", Number(e.target.value))} placeholder="e.g. 120000" /><Err msg={shown.estimatedCost} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="just">Justification *</Label>
          <Textarea id="just" value={f.justification} onChange={(e) => set("justification", e.target.value)} rows={2} placeholder="Need and norm reference (min 15 characters)." />
          <Err msg={shown.justification} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">Mode: {mode}</Badge>
          {tender ? <Badge variant="default">Tender — Directorate approval</Badge> : null}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the indent, quantity and estimate, and fund availability under the head.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit indent</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Headmaster</strong> → <strong>BEO</strong> → <strong>DEO sanction</strong>{tender ? <> → <strong>Directorate</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
