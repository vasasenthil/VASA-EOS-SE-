"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { CERT_TYPES, certRef, certTypeDef, type CertType, type Certificate } from "@/lib/certificates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CertificateIssuer() {
  const [issued, setIssued] = useState<Certificate[]>([])
  const [seq, setSeq] = useState(1)
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")
  const [type, setType] = useState<CertType>("transfer")
  const [remarks, setRemarks] = useState("")

  function issue() {
    const s = SIS_ROSTER.find((x) => x.apaarId === student)
    if (!s) return
    const cert: Certificate = {
      id: `cert-${seq}`,
      ref: certRef(type, seq),
      type,
      studentApaar: s.apaarId,
      studentName: s.name,
      issuedOn: new Date().toISOString().slice(0, 10),
      remarks: remarks.trim() || undefined,
    }
    setIssued((prev) => [cert, ...prev])
    setSeq((n) => n + 1)
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
