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
  emptyTc,
  validateTc,
  needsCountersign,
  TC_TYPES,
  CLASSES,
  type TcForm,
  type FieldErrors,
} from "@/lib/academic/tc"
import { fileTcAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function TcFormUI() {
  const router = useRouter()
  const [f, setF] = useState<TcForm>(emptyTc())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof TcForm>(key: K, value: TcForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }

  const shown = submitted ? validateTc(f).errors : errors
  const countersign = needsCountersign(f)

  function submit() {
    setSubmitted(true)
    const v = validateTc(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileTcAction({
        student: f.studentName.trim(),
        needsCountersign: countersign,
        details: {
          apaarId: f.apaarId.trim(),
          udiseCode: f.udiseCode.trim(),
          lastClass: f.lastClass,
          tcType: f.tcType,
          reason: f.reason.trim(),
          dateOfLeaving: f.dateOfLeaving.trim(),
          duesCleared: f.duesCleared,
          needsCountersign: countersign,
        },
      })
      if (saved) router.push("/tc-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Certificate request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="sn">Student name *</Label><Input id="sn" value={f.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="e.g. Kavya R." /><Err msg={shown.studentName} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="apaar">APAAR id (12 digits) *</Label><Input id="apaar" inputMode="numeric" value={f.apaarId} onChange={(e) => set("apaarId", e.target.value)} placeholder="100200300401" /><Err msg={shown.apaarId} /></div>
          <div className="space-y-1.5"><Label htmlFor="udise">UDISE code (11 digits) *</Label><Input id="udise" inputMode="numeric" value={f.udiseCode} onChange={(e) => set("udiseCode", e.target.value)} placeholder="33010100101" /><Err msg={shown.udiseCode} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class last studied *</Label>
            <select id="cls" value={f.lastClass} onChange={(e) => set("lastClass", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select><Err msg={shown.lastClass} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="dol">Date of leaving *</Label><Input id="dol" type="date" value={f.dateOfLeaving} onChange={(e) => set("dateOfLeaving", e.target.value)} /><Err msg={shown.dateOfLeaving} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tt">Certificate type *</Label>
            <select id="tt" value={f.tcType} onChange={(e) => set("tcType", e.target.value as TcForm["tcType"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {TC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select><Err msg={shown.tcType} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason for leaving *</Label>
          <Textarea id="reason" value={f.reason} onChange={(e) => set("reason", e.target.value)} rows={2} placeholder="e.g. Family relocating to another district for employment (min 10 characters)." />
          <Err msg={shown.reason} />
        </div>

        <Badge variant={countersign ? "default" : "secondary"}>{countersign ? "Needs Block (BEO) counter-signature" : "Headmaster signature only"}</Badge>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.duesCleared} onChange={(e) => set("duesCleared", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>All school dues (fees, library, instruments) are cleared — a TC cannot be issued otherwise.</span>
        </label>
        <Err msg={shown.duesCleared} />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I certify the particulars above are correct as per the school record and APAAR.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit request</Button>
          <p className="text-xs text-muted-foreground">Routes: <strong>Class Teacher</strong> → <strong>Headmaster</strong>{countersign ? <> → <strong>Block (BEO)</strong></> : null}.</p>
        </div>
      </CardContent>
    </Card>
  )
}
