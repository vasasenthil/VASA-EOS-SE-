"use client"

import { useState } from "react"
import { QUALITY } from "@/lib/quality"
import { INSPECTION_CHECKLIST, visitScore, visitRating, type Visit, type VisitRating } from "@/lib/inspection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const RATING_VARIANT: Record<VisitRating, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  poor: "destructive",
}

const TODAY = new Date().toISOString().slice(0, 10)

export function InspectionForm() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [school, setSchool] = useState(QUALITY[0]?.name ?? "")
  const [officer, setOfficer] = useState("")
  const [gps, setGps] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set(INSPECTION_CHECKLIST))
  const [notes, setNotes] = useState("")

  const score = visitScore(checked.size)

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  function save() {
    setVisits((prev) => [
      {
        id: `v-${Date.now()}`,
        school,
        officer: officer.trim() || "Officer",
        date: TODAY,
        gpsVerified: gps,
        checked: [...checked],
        notes: notes.trim() || undefined,
      },
      ...prev,
    ])
    setNotes("")
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Capture visit — score {score}%</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>School</Label>
              <select value={school} onChange={(e) => setSchool(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {QUALITY.map((q) => <option key={q.udise} value={q.name}>{q.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="off">Officer</Label>
              <Input id="off" value={officer} onChange={(e) => setOfficer(e.target.value)} placeholder="CRCC / BEO name" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="gps" checked={gps} onCheckedChange={(v) => setGps(v === true)} />
            <Label htmlFor="gps" className="text-sm">GPS-verified on site</Label>
          </div>
          <div className="space-y-2">
            <Label>Checklist</Label>
            {INSPECTION_CHECKLIST.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <Checkbox id={c} checked={checked.has(c)} onCheckedChange={() => toggle(c)} />
                <Label htmlFor={c} className="text-sm font-normal">{c}</Label>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations / actions" />
          </div>
          <Button onClick={save} className="w-full">Save visit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visits ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits captured yet.</p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => {
                const sc = visitScore(v.checked.length)
                return (
                  <li key={v.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{v.school}</span>
                      <Badge variant={RATING_VARIANT[visitRating(sc)]}>{sc}% · {visitRating(sc)}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{v.officer}</span>
                      <span>{v.date}</span>
                      {v.gpsVerified ? <Badge variant="outline">GPS ✓</Badge> : <span className="text-destructive">no GPS</span>}
                    </div>
                    {v.notes ? <p className="mt-1 text-muted-foreground">{v.notes}</p> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
