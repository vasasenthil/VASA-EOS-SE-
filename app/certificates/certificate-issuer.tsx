"use client"

import { useState, useTransition } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { CERT_TYPES, certRef, certTypeDef, type CertType, type Certificate } from "@/lib/certificates"
import { issueCertificateAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CertificateIssuer({ initial = [] }: { initial?: Certificate[] }) {
  const [issued, setIssued] = useState<Certificate[]>(initial)
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")
  const [type, setType] = useState<CertType>("transfer")
  const [remarks, setRemarks] = useState("")
  const [, startTransition] = useTransition()

  function issue() {
    const s = SIS_ROSTER.find((x) => x.apaarId === student)
    if (!s) return
    const optimistic: Certificate = {
      id: `cert-${Date.now()}`,
      ref: certRef(type, issued.filter((c) => c.type === type).length + 1),
      type,
      studentApaar: s.apaarId,
      studentName: s.name,
      issuedOn: new Date().toISOString().slice(0, 10),
      remarks: remarks.trim() || undefined,
    }
    setIssued((prev) => [optimistic, ...prev])
    startTransition(async () => {
      const saved = await issueCertificateAction({ type, studentApaar: s.apaarId, studentName: s.name, remarks: optimistic.remarks })
      if (saved) setIssued((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)))
    })
    setRemarks("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader>
          <CardTitle>Issue certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {SIS_ROSTER.map((s) => (
                <option key={s.apaarId} value={s.apaarId}>{s.name} — {s.className}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as CertType)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {CERT_TYPES.map((c) => (
                <option key={c.type} value={c.type}>{c.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{certTypeDef(type).purpose}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rem">Remarks (optional)</Label>
            <Input id="rem" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Promoted to Class 10" />
          </div>
          <Button onClick={issue} className="w-full">Issue &amp; number</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issued ({issued.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issued.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
          ) : (
            <ul className="space-y-2">
              {issued.map((c) => (
                <li key={c.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.studentName}</span>
                    <Badge variant="outline">{certTypeDef(c.type).label}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="font-mono">{c.ref}</span>
                    <span>issued {c.issuedOn}</span>
                    {c.remarks ? <span>· {c.remarks}</span> : null}
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
