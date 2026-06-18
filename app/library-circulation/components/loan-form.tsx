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
  emptyLoan, validateLoan, loanStatus, overdueDays, fineDue, inr,
  BOOK_CATEGORIES, MEMBER_TYPES, CLASS_LEVELS,
  type LoanInput, type LoanErrors,
} from "@/lib/librarycirc"
import { createLoanAction, updateLoanAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function LoanForm({ id, initial }: { id?: string; initial?: LoanInput }) {
  const router = useRouter()
  const [f, setF] = useState<LoanInput>(initial ?? emptyLoan())
  const [errors, setErrors] = useState<LoanErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErr, setServerErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof LoanInput>(k: K, v: LoanInput[K]) { setF((p) => ({ ...p, [k]: v })) }
  const shown = submitted ? validateLoan(f).errors : errors
  const status = loanStatus(f)
  const fine = fineDue(f)

  function submit() {
    setSubmitted(true); setServerErr(null)
    const v = validateLoan(f); setErrors(v.errors)
    if (!v.ok) return
    start(async () => {
      const res = id ? await updateLoanAction(id, f) : await createLoanAction(f)
      if (res.ok) router.push(id ? `/library-circulation/${id}` : "/library-circulation")
      else if (res.errors) setErrors(res.errors)
      else setServerErr(res.reason ?? "Could not save the loan.")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{id ? "Edit loan" : "Issue a book"}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Book</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="acc">Accession no *</Label><Input id="acc" value={f.accessionNo} onChange={(e) => set("accessionNo", e.target.value.toUpperCase())} placeholder="ACC-00123" /><Err msg={shown.accessionNo} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="title">Title *</Label><Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Wings of Fire" /><Err msg={shown.title} /></div>
            <div className="space-y-1.5"><Label htmlFor="cat">Category *</Label><select id="cat" value={f.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{BOOK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><Err msg={shown.category} /></div>
            <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="author">Author *</Label><Input id="author" value={f.author} onChange={(e) => set("author", e.target.value)} placeholder="A.P.J. Abdul Kalam" /><Err msg={shown.author} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Member</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="member">Member *</Label><Input id="member" value={f.member} onChange={(e) => set("member", e.target.value)} placeholder="Aarthi M." /><Err msg={shown.member} /></div>
            <div className="space-y-1.5"><Label htmlFor="mid">Member id *</Label><Input id="mid" value={f.memberId} onChange={(e) => set("memberId", e.target.value)} placeholder="100200300401" /><Err msg={shown.memberId} /></div>
            <div className="space-y-1.5"><Label htmlFor="mtype">Member type *</Label><select id="mtype" value={f.memberType} onChange={(e) => set("memberType", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{MEMBER_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}</select><Err msg={shown.memberType} /></div>
            <div className="space-y-1.5"><Label htmlFor="cls">Class</Label><select id="cls" value={f.classLevel} onChange={(e) => set("classLevel", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm" disabled={f.memberType !== "Student"}><option value="">—</option>{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select><Err msg={shown.classLevel} /></div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Circulation</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label htmlFor="iss">Issue date *</Label><Input id="iss" type="date" value={f.issueDate} onChange={(e) => set("issueDate", e.target.value)} /><Err msg={shown.issueDate} /></div>
            <div className="space-y-1.5"><Label htmlFor="due">Due date *</Label><Input id="due" type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /><Err msg={shown.dueDate} /></div>
            <div className="space-y-1.5"><Label htmlFor="ret">Return date</Label><Input id="ret" type="date" value={f.returnDate} onChange={(e) => set("returnDate", e.target.value)} /><Err msg={shown.returnDate} /></div>
            <div className="space-y-1.5"><Label htmlFor="ren">Renewals</Label><Input id="ren" type="number" min={0} value={f.renewalCount} onChange={(e) => set("renewalCount", Number(e.target.value))} /><Err msg={shown.renewalCount} /></div>
            <div className="space-y-1.5"><Label htmlFor="fpd">Fine / day (₹)</Label><Input id="fpd" type="number" min={0} value={f.finePerDay} onChange={(e) => set("finePerDay", Number(e.target.value))} /><Err msg={shown.finePerDay} /></div>
            <div className="space-y-1.5"><Label htmlFor="fw">Fine waived (₹)</Label><Input id="fw" type="number" min={0} value={f.fineWaived} onChange={(e) => set("fineWaived", Number(e.target.value))} /><Err msg={shown.fineWaived} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge className={status === "Returned" ? "bg-green-100 text-green-700 border-0" : status === "Overdue" ? "bg-red-100 text-red-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>{status}</Badge>
            <span className="text-muted-foreground">· Overdue {overdueDays(f)} day(s)</span>
            <span className="text-muted-foreground">· Fine due</span><Badge className={fine > 0 ? "bg-red-100 text-red-700 border-0" : "bg-green-100 text-green-700 border-0"}>{inr(fine)}</Badge>
          </div>
        </section>

        <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes." /></div>

        {serverErr ? <p className="text-sm text-red-600">{serverErr}</p> : null}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{id ? "Save changes" : "Issue book"}</Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
