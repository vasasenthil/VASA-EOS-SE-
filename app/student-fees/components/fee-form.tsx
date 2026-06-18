"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import {
  emptyFee, validateFee, feeGross, netDemand, totalPaid, balance, paymentStatus, inr,
  FEE_HEAD_TYPES, CONCESSION_TYPES, PAYMENT_MODES, CLASS_LEVELS, SECTIONS,
  type FeeInput, type FeeErrors, type FeeHead, type FeeReceipt,
} from "@/lib/studentfees"
import { createFeeAction, updateFeeAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function FeeForm({ id, initial }: { id?: string; initial?: FeeInput }) {
  const router = useRouter()
  const [f, setF] = useState<FeeInput>(initial ?? emptyFee())
  const [errors, setErrors] = useState<FeeErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof FeeInput>(k: K, v: FeeInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  function setHead(i: number, patch: Partial<FeeHead>) { setF((p) => ({ ...p, heads: p.heads.map((h, j) => (j === i ? { ...h, ...patch } : h)) })) }
  function addHead() { setF((p) => ({ ...p, heads: [...p.heads, { type: "Special Fee", amount: 0 }] })) }
  function removeHead(i: number) { setF((p) => ({ ...p, heads: p.heads.filter((_, j) => j !== i) })) }
  function setReceipt(i: number, patch: Partial<FeeReceipt>) { setF((p) => ({ ...p, receipts: p.receipts.map((r, j) => (j === i ? { ...r, ...patch } : r)) })) }
  function addReceipt() { setF((p) => ({ ...p, receipts: [...p.receipts, { date: new Date().toISOString().slice(0, 10), amount: 0, mode: "UPI", reference: "" }] })) }
  function removeReceipt(i: number) { setF((p) => ({ ...p, receipts: p.receipts.filter((_, j) => j !== i) })) }

  const shown = submitted ? validateFee(f).errors : errors
  const net = netDemand(f)
  const paid = totalPaid(f.receipts)
  const bal = balance(f)
  const status = paymentStatus(f)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateFee(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateFeeAction(id, f) : await createFeeAction(f)
      if (res.ok) router.push(id ? `/student-fees/${id}` : "/student-fees")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the fee record.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit fee record" : "New fee record"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Student</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="student">Student *</Label><Input id="student" value={f.student} onChange={(e) => set("student", e.target.value)} placeholder="Aarthi M." /><Err msg={shown.student} /></div>
            <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
            <div className="space-y-1.5"><Label htmlFor="ay">Academic year *</Label><Input id="ay" value={f.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2026-2027" /><Err msg={shown.academicYear} /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class *</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
            <div className="space-y-1.5"><Label htmlFor="section">Section *</Label><select id="section" value={f.section} onChange={(e) => set("section", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.section} /></div>
            <div className="space-y-1.5"><Label htmlFor="due">Due date *</Label><Input id="due" type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /><Err msg={shown.dueDate} /></div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Fee heads (demand)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addHead}><Plus className="mr-1 h-4 w-4" />Add head</Button>
          </div>
          {f.heads.map((h, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select value={h.type} onChange={(e) => setHead(i, { type: e.target.value })} className="col-span-6 h-9 rounded-md border bg-background px-2 text-sm">{FEE_HEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <Input className="col-span-5" type="number" min={0} value={h.amount} onChange={(e) => setHead(i, { amount: Number(e.target.value) })} aria-label="Amount" />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeHead(i)} aria-label="Remove head" disabled={f.heads.length <= 1}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Err msg={shown.heads} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Concession & DBT linkage</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="ct">Concession *</Label><select id="ct" value={f.concessionType} onChange={(e) => set("concessionType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{CONCESSION_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.concessionType} /></div>
            <div className="space-y-1.5"><Label htmlFor="ca">Concession amount</Label><Input id="ca" type="number" min={0} value={f.concessionAmount} onChange={(e) => set("concessionAmount", Number(e.target.value))} /><Err msg={shown.concessionAmount} /></div>
            <div className="space-y-1.5"><Label htmlFor="sch">Scholarship scheme</Label><Input id="sch" value={f.scholarshipScheme} onChange={(e) => set("scholarshipScheme", e.target.value)} placeholder="Pudhumai Penn" /></div>
            <div className="space-y-1.5"><Label htmlFor="dbt">DBT reference</Label><Input id="dbt" value={f.dbtReference} onChange={(e) => set("dbtReference", e.target.value)} placeholder="DBT-TN-…" /><Err msg={shown.dbtReference} /></div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Receipts (collection)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addReceipt}><Plus className="mr-1 h-4 w-4" />Add receipt</Button>
          </div>
          {f.receipts.length === 0 ? <p className="text-sm text-muted-foreground">No receipts yet.</p> : null}
          {f.receipts.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-3" type="date" value={r.date} onChange={(e) => setReceipt(i, { date: e.target.value })} aria-label="Date" />
              <Input className="col-span-3" type="number" min={1} value={r.amount} onChange={(e) => setReceipt(i, { amount: Number(e.target.value) })} aria-label="Amount" />
              <select value={r.mode} onChange={(e) => setReceipt(i, { mode: e.target.value })} className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm">{PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
              <Input className="col-span-2" value={r.reference} onChange={(e) => setReceipt(i, { reference: e.target.value })} placeholder="Ref" aria-label="Reference" />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => removeReceipt(i)} aria-label="Remove receipt"><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Err msg={shown.receipts} />
        </section>

        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          <span className="text-muted-foreground">Gross {inr(feeGross(f.heads))}</span>
          <span className="text-muted-foreground">· Net demand</span><Badge variant="secondary">{inr(net)}</Badge>
          <span className="text-muted-foreground">· Paid</span><Badge variant="secondary">{inr(paid)}</Badge>
          <span className="text-muted-foreground">· Balance</span><Badge className={bal > 0 ? "bg-red-100 text-red-700 border-0" : "bg-green-100 text-green-700 border-0"}>{inr(bal)}</Badge>
          <Badge className={status === "Paid" ? "bg-green-100 text-green-700 border-0" : status === "Partial" ? "bg-yellow-100 text-yellow-700 border-0" : "bg-red-100 text-red-700 border-0"}>{status}</Badge>
        </div>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create fee record"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
