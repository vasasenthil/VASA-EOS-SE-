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
  emptyStaff, validateStaff, serviceYears, ageYears, totalLeaveBalance,
  DESIGNATIONS, CADRES, DEPARTMENTS, EMPLOYMENT_TYPES, STAFF_STATUSES, GENDERS,
  type StaffInput, type StaffErrors,
} from "@/lib/staffmaster"
import { createStaffAction, updateStaffAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function StaffForm({ id, initial }: { id?: string; initial?: StaffInput }) {
  const router = useRouter()
  const [f, setF] = useState<StaffInput>(initial ?? emptyStaff())
  const [errors, setErrors] = useState<StaffErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof StaffInput>(k: K, v: StaffInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateStaff(f).errors : errors

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateStaff(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateStaffAction(id, f) : await createStaffAction(f)
      if (res.ok) router.push(id ? `/staff-directory/${id}` : "/staff-directory")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the staff record.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit staff record" : "New staff record"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Identity & role</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="sid">Staff id *</Label><Input id="sid" value={f.staffId} onChange={(e) => set("staffId", e.target.value.toUpperCase())} placeholder="EMP-001" /><Err msg={shown.staffId} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="name">Name *</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Mr. Sharma" /><Err msg={shown.name} /></div>
            <div className="space-y-1.5"><Label htmlFor="cadre">Cadre *</Label><select id="cadre" value={f.cadre} onChange={(e) => set("cadre", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{CADRES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.cadre} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="desig">Designation *</Label><select id="desig" value={f.designation} onChange={(e) => set("designation", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select><Err msg={shown.designation} /></div>
            <div className="space-y-1.5"><Label htmlFor="dept">Department *</Label><select id="dept" value={f.department} onChange={(e) => set("department", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select><Err msg={shown.department} /></div>
            <div className="space-y-1.5"><Label htmlFor="etype">Employment type *</Label><select id="etype" value={f.employmentType} onChange={(e) => set("employmentType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select><Err msg={shown.employmentType} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Demographics & contact</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="gender">Gender *</Label><select id="gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select><Err msg={shown.gender} /></div>
            <div className="space-y-1.5"><Label htmlFor="dob">Date of birth *</Label><Input id="dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /><Err msg={shown.dob} /></div>
            <div className="space-y-1.5"><Label htmlFor="doj">Date of joining *</Label><Input id="doj" type="date" value={f.doj} onChange={(e) => set("doj", e.target.value)} /><Err msg={shown.doj} /></div>
            <div className="space-y-1.5"><Label htmlFor="qual">Qualification *</Label><Input id="qual" value={f.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="M.Sc., B.Ed." /><Err msg={shown.qualification} /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone *</Label><Input id="phone" inputMode="numeric" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9840020002" /><Err msg={shown.phone} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="sharma@vasa-eos.tn.gov.in" /><Err msg={shown.email} /></div>
            <div className="space-y-1.5"><Label htmlFor="scale">Pay scale</Label><Input id="scale" value={f.payScale} onChange={(e) => set("payScale", e.target.value)} placeholder="Level 17" /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Service & leave</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="status">Status *</Label><select id="status" value={f.status} onChange={(e) => set("status", e.target.value as StaffInput["status"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{STAFF_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Err msg={shown.status} /></div>
            <div className="space-y-1.5"><Label htmlFor="cl">Casual leave balance</Label><Input id="cl" type="number" min={0} value={f.casualLeaveBalance} onChange={(e) => set("casualLeaveBalance", Number(e.target.value))} /><Err msg={shown.casualLeaveBalance} /></div>
            <div className="space-y-1.5"><Label htmlFor="el">Earned leave balance</Label><Input id="el" type="number" min={0} value={f.earnedLeaveBalance} onChange={(e) => set("earnedLeaveBalance", Number(e.target.value))} /><Err msg={shown.earnedLeaveBalance} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            {f.doj ? <><span className="text-muted-foreground">Service</span><Badge variant="secondary">{serviceYears(f.doj)} yrs</Badge></> : null}
            {f.dob ? <><span className="text-muted-foreground">· Age</span><Badge variant="secondary">{ageYears(f.dob)} yrs</Badge></> : null}
            <span className="text-muted-foreground">· Leave balance</span><Badge variant="secondary">{totalLeaveBalance(f)} days</Badge>
          </div>
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Create staff record"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
