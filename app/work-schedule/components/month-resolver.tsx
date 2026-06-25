"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolveMonthAction } from "../actions"
import type { SchoolDay, RangeSummary } from "@/lib/worktime"

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function dowOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay()
}

/**
 * Joins the Working-Time profile with the Holiday Calendar (server resolveMonthAction) and renders
 * the resolved school days for a month — the chain in action. Working = green, holiday = red,
 * weekly-off = grey, out-of-term = muted.
 */
export function MonthResolver({ profileId, initialYear, initialMonth }: { profileId: string; initialYear: number; initialMonth: number }) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth) // 1-based
  const [days, setDays] = useState<SchoolDay[] | null>(null)
  const [term, setTerm] = useState<RangeSummary | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    start(async () => {
      const res = await resolveMonthAction(profileId, year, month)
      setDays(res?.days ?? [])
      setTerm(res?.termSummary ?? null)
    })
  }, [profileId, year, month])

  function shift(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m); setYear(y)
  }

  const lead = days && days.length > 0 ? dowOf(days[0].date) : 0
  const working = days?.filter((d) => d.working).length ?? 0
  const holidays = days?.filter((d) => d.holidayName).length ?? 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">School days — {MONTH_NAMES[month - 1]} {year}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-green-100 text-green-700 border-0">{working} working</Badge>
          <Badge className="bg-red-100 text-red-700 border-0">{holidays} holiday</Badge>
          {term ? <Badge variant="secondary">Term: {term.working} working days · {Math.round(term.instructionalMinutes / 60)} instructional hrs</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        {pending && !days ? (
          <p className="text-sm text-muted-foreground">Resolving…</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: lead }).map((_, i) => <div key={`x${i}`} />)}
              {(days ?? []).map((d) => {
                const n = Number(d.date.slice(8, 10))
                const cls = d.working
                  ? "bg-green-50 border-green-200 text-green-800"
                  : d.holidayName
                    ? "bg-red-50 border-red-200 text-red-800"
                    : d.reason.startsWith("Weekly off")
                      ? "bg-muted text-muted-foreground"
                      : "bg-background text-muted-foreground/60"
                return (
                  <div key={d.date} className={`min-h-14 rounded-md border p-1 text-left ${cls}`} title={d.reason}>
                    <div className="text-xs font-semibold">{n}</div>
                    <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight">{d.working ? `${d.periods.filter((p) => p.kind === "Period").length} periods` : d.holidayName ?? (d.reason.startsWith("Weekly off") ? "Off" : "")}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
