"use client"

import { useState } from "react"
import { INTEREST_AREAS, recommend } from "@/lib/career"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CareerGuide() {
  const [interests, setInterests] = useState<Set<string>>(new Set(["Science & Tech", "Mathematics"]))
  const recs = recommend([...interests])

  function toggle(area: string) {
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      return next
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <Card>
        <CardHeader>
          <CardTitle>Your interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTEREST_AREAS.map((area) => (
            <div key={area} className="flex items-center gap-2">
              <Checkbox id={area} checked={interests.has(area)} onCheckedChange={() => toggle(area)} />
              <Label htmlFor={area} className="text-sm">{area}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested pathways</CardTitle>
        </CardHeader>
        <CardContent>
          {recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pick one or more interests to see suggested streams.</p>
          ) : (
            <ul className="space-y-3">
              {recs.map((r) => (
                <li key={r.path.stream} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.path.stream}</span>
                    <Badge variant="outline">{r.score} match{r.score === 1 ? "" : "es"}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.path.careers.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Vocational pathways connect to Naan Mudhalvan skilling and placement. High-stakes guidance routes to a human
            counsellor.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
