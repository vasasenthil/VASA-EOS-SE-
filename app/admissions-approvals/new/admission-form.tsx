"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  emptyAdmission,
  validateAdmission,
  completenessPct,
  GENDERS,
  SOCIAL_CATEGORIES,
  CLASSES,
  DOCUMENTS,
  type AdmissionApplicationForm,
  type FieldErrors,
} from "@/lib/admissions/application"
import { fileApplicantAction } from "../actions"

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-600 dark:text-red-500">{msg}</p> : null
}

export function AdmissionFormUI() {
  const router = useRouter()
  const [f, setF] = useState<AdmissionApplicationForm>(emptyAdmission())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof AdmissionApplicationForm>(key: K, value: AdmissionApplicationForm[K]) {
    setF((prev) => ({ ...prev, [key]: value }))
  }
  function toggleDoc(d: string) {
    setF((prev) => ({ ...prev, documents: prev.documents.includes(d) ? prev.documents.filter((x) => x !== d) : [...prev.documents, d] }))
  }

  const shown = submitted ? validateAdmission(f).errors : errors
  const pct = completenessPct(f)

  function submit() {
    setSubmitted(true)
    const v = validateAdmission(f)
    setErrors(v.errors)
    if (!v.ok) return
    startTransition(async () => {
      const saved = await fileApplicantAction({
        name: f.studentName.trim(),
        dob: f.dob,
        gender: f.gender,
        category: f.socialCategory,
        className: f.className,
        details: {
          guardianName: f.guardianName.trim(),
          guardianPhone: f.guardianPhone.trim(),
          guardianEmail: f.guardianEmail.trim() || undefined,
          address: f.address.trim(),
          previousSchool: f.previousSchool.trim() || undefined,
          rteQuota: f.rteQuota,
          documents: f.documents,
        },
      })
      if (saved) router.push("/admissions-approvals")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Admission Application (RTE 2009 / APAAR)</CardTitle>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Student name *</Label><Input id="name" value={f.studentName} onChange={(e) => set("studentName", e.target.value)} placeholder="Full name" /><Err msg={shown.studentName} /></div>
          <div className="space-y-1.5"><Label htmlFor="dob">Date of birth *</Label><Input id="dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /><Err msg={shown.dob} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender *</Label>
            <select id="gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select><Err msg={shown.gender} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Social category *</Label>
            <select id="cat" value={f.socialCategory} onChange={(e) => set("socialCategory", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{SOCIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.socialCategory} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="class">Class sought *</Label>
            <select id="class" value={f.className} onChange={(e) => set("className", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select…</option>{CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select><Err msg={shown.className} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="prev">Previous school (optional)</Label><Input id="prev" value={f.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} placeholder="If transferring" /></div>
          <div className="space-y-1.5"><Label htmlFor="gname">Guardian name *</Label><Input id="gname" value={f.guardianName} onChange={(e) => set("guardianName", e.target.value)} /><Err msg={shown.guardianName} /></div>
          <div className="space-y-1.5"><Label htmlFor="gphone">Guardian phone *</Label><Input id="gphone" value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="10-digit mobile" /><Err msg={shown.guardianPhone} /></div>
          <div className="space-y-1.5"><Label htmlFor="gemail">Guardian email (optional)</Label><Input id="gemail" value={f.guardianEmail} onChange={(e) => set("guardianEmail", e.target.value)} /><Err msg={shown.guardianEmail} /></div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="addr">Residential address *</Label>
          <Textarea id="addr" value={f.address} onChange={(e) => set("address", e.target.value)} rows={2} placeholder="House, street, area, district, PIN" />
          <Err msg={shown.address} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.rteQuota} onChange={(e) => set("rteQuota", e.target.checked)} className="h-4 w-4" />
          Claiming a 25% EWS / disadvantaged seat under RTE §12(1)(c)
        </label>

        <div className="space-y-2">
          <Label>Documents attached * {f.rteQuota && <span className="text-xs text-amber-600 dark:text-amber-500">(income certificate required for RTE)</span>}</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {DOCUMENTS.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.documents.includes(d)} onChange={() => toggleDoc(d)} className="h-4 w-4" />{d}
              </label>
            ))}
          </div>
          <Err msg={shown.documents} />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I declare the particulars are true and consent to verification and APAAR provisioning for my child.</span>
        </label>
        <Err msg={shown.declaration} />

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>Submit application</Button>
          <p className="text-xs text-muted-foreground">Routes <strong>Academic Head (verify) → Principal (enrol &amp; APAAR)</strong> with a full audit trail.</p>
        </div>
      </CardContent>
    </Card>
  )
}
