"use client"

import { useState } from "react"
import { makeApaarId, validateApplicant, type Applicant } from "@/lib/admissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY = { name: "", dob: "", gender: "female", category: "BC", className: "Class 1" }

export function AdmissionsForm() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [seq, setSeq] = useState(1)
  const [form, setForm] = useState({ ...EMPTY })

  const error = validateApplicant(form)

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function enrol() {
    if (error) return
    setApplicants((prev) => [
      { id: `app-${seq}`, ...form, apaarId: makeApaarId(seq), status: "enrolled" },
      ...prev,
    ])
    setSeq((n) => n + 1)
    setForm({ ...EMPTY })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader><CardTitle>New admission</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="n">Student name</Label><Input id="n" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="dob">Date of birth</Label><Input id="dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {["SC", "ST", "MBC", "BC", "FC", "Minority"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <select value={form.className} onChange={(e) => set("className", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button onClick={enrol} disabled={!!error} className="w-full">Enrol &amp; provision APAAR</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Enrolled ({applicants.length})</CardTitle></CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admissions yet.</p>
          ) : (
            <ul className="space-y-2">
              {applicants.map((a) => (
                <li key={a.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{a.name}</span>
                    <Badge>{a.status}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="font-mono">{a.apaarId}</span>
                    <span>{a.className}</span>
                    <span>{a.gender} · {a.category}</span>
                    {a.dob ? <span>DOB {a.dob}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
