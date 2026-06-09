"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { needsReferral, suggestReferral, healthSummary, type ScreeningRecord } from "@/lib/health"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type Bmi = ScreeningRecord["bmiStatus"]
type Vision = ScreeningRecord["vision"]

export function ScreeningForm() {
  const [records, setRecords] = useState<ScreeningRecord[]>([])
  const [student, setStudent] = useState(SIS_ROSTER[0]?.apaarId ?? "")
  const [bmiStatus, setBmi] = useState<Bmi>("normal")
  const [anaemia, setAnaemia] = useState(false)
  const [vision, setVision] = useState<Vision>("normal")

  const findings = { bmiStatus, anaemia, vision }
  const referral = suggestReferral(findings)
  const summary = healthSummary(records)

  function save() {
    const s = SIS_ROSTER.find((x) => x.apaarId === student)
    if (!s) return
    setRecords((prev) => [
      { apaarId: s.apaarId, name: s.name, bmiStatus, anaemia, vision, referral: referral || undefined },
      ...prev.filter((r) => r.apaarId !== s.apaarId),
    ])
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Screened</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.screened}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Anaemia</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.anaemia}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Referrals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.referrals}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Record screening (RBSK 4 Ds)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <select value={student} onChange={(e) => setStudent(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {SIS_ROSTER.map((s) => <option key={s.apaarId} value={s.apaarId}>{s.name} — {s.className}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>BMI status</Label>
              <select value={bmiStatus} onChange={(e) => setBmi(e.target.value as Bmi)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="normal">Normal</option>
                <option value="underweight">Underweight</option>
                <option value="overweight">Overweight</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="anaemia" checked={anaemia} onCheckedChange={(v) => setAnaemia(v === true)} />
              <Label htmlFor="anaemia" className="text-sm">Anaemia detected</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Vision</Label>
              <select value={vision} onChange={(e) => setVision(e.target.value as Vision)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="normal">Normal</option>
                <option value="refer">Refer</option>
              </select>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {needsReferral(findings) ? (
                <span className="text-destructive">Referral: {referral}</span>
              ) : (
                <span className="text-muted-foreground">No referral needed.</span>
              )}
            </div>
            <Button onClick={save} className="w-full">Save screening</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screenings ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No screenings recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {records.map((r) => (
                  <li key={r.apaarId} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.name}</span>
                      {r.referral ? <Badge variant="destructive">referral</Badge> : <Badge>clear</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>BMI: {r.bmiStatus}</span>
                      <span>Anaemia: {r.anaemia ? "yes" : "no"}</span>
                      <span>Vision: {r.vision}</span>
                      {r.referral ? <span>· {r.referral}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
