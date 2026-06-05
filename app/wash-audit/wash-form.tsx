"use client"

import { useState } from "react"
import { QUALITY } from "@/lib/quality"
import { WASH_CHECKLIST, washScore, washRating, type WashAudit, type WashRating } from "@/lib/wash"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const RATING_VARIANT: Record<WashRating, "default" | "secondary" | "destructive"> = {
  "5-star": "default",
  "4-star": "default",
  "3-star": "secondary",
  "needs improvement": "destructive",
}
const TODAY = new Date().toISOString().slice(0, 10)

export function WashForm() {
  const [audits, setAudits] = useState<WashAudit[]>([])
  const [school, setSchool] = useState(QUALITY[0]?.name ?? "")
  const [checked, setChecked] = useState<Set<string>>(new Set(WASH_CHECKLIST))

  const score = washScore(checked.size)
  const rating = washRating(score)

  function toggle(item: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }
  function record() {
    setAudits((prev) => [{ id: `w-${Date.now()}`, school, date: TODAY, checked: [...checked] }, ...prev])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader><CardTitle>WASH checklist — {score}% ({rating})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>School</Label>
            <select value={school} onChange={(e) => setSchool(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {QUALITY.map((q) => <option key={q.udise} value={q.name}>{q.name}</option>)}
            </select>
          </div>
          {WASH_CHECKLIST.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox id={c} checked={checked.has(c)} onCheckedChange={() => toggle(c)} />
              <Label htmlFor={c} className="text-sm font-normal">{c}</Label>
            </div>
          ))}
          <Button onClick={record} className="w-full">Record audit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audits ({audits.length})</CardTitle></CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audits recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {audits.map((a) => {
                const sc = washScore(a.checked.length)
                return (
                  <li key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      <span className="font-medium">{a.school}</span>
                      <span className="block text-xs text-muted-foreground">{a.date}</span>
                    </span>
                    <Badge variant={RATING_VARIANT[washRating(sc)]}>{sc}% · {washRating(sc)}</Badge>
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
