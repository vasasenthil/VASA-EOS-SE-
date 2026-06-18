"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarCheck, CalendarOff, BookOpen, ExternalLink } from "lucide-react"
import { CLASS_LEVELS, SECTIONS } from "@/lib/students"
import type { DayPlan } from "@/lib/dayplan"
import { resolveDayPlanAction } from "./actions"

const KIND_STYLE: Record<string, string> = {
  Period: "border-blue-200",
  Break: "border-amber-200 bg-amber-50/50",
  Assembly: "border-purple-200 bg-purple-50/50",
}

export function DayPlanView({ defaultClass, defaultSection, defaultDate }: { defaultClass: string; defaultSection: string; defaultDate: string }) {
  const [classLevel, setClassLevel] = useState(defaultClass)
  const [section, setSection] = useState(defaultSection)
  const [date, setDate] = useState(defaultDate)
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    start(async () => setPlan(await resolveDayPlanAction(classLevel, section, date)))
  }, [classLevel, section, date])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cls">Class</Label>
            <select id="cls" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{CLASS_LEVELS.map((c) => <option key={c} value={c}>Class {c}</option>)}</select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sec">Section</Label>
            <select id="sec" value={section} onChange={(e) => setSection(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}</select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {!plan ? (
        <p className="text-sm text-muted-foreground">{pending ? "Resolving the school day…" : ""}</p>
      ) : !plan.working ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <CalendarOff className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-semibold">{plan.weekday || "—"}, {plan.date} — not a school day</p>
              <p className="text-sm text-muted-foreground">{plan.reason}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <CalendarCheck className="h-7 w-7 text-green-600" />
              <span className="font-semibold">{plan.weekday}, {plan.date} — working day · Class {plan.classLevel}-{plan.section}</span>
              <div className="ml-auto flex gap-2 text-xs">
                <Badge className="bg-blue-100 text-blue-700 border-0">{plan.stats.teaching} periods</Badge>
                <Badge className="bg-green-100 text-green-700 border-0">{plan.stats.scheduled} scheduled</Badge>
                <Badge className="bg-purple-100 text-purple-700 border-0">{plan.stats.planned} lesson plans</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Day schedule</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {plan.periods.map((p, i) => (
                <div key={i} className={`rounded-md border p-3 ${KIND_STYLE[p.kind] ?? ""}`}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-24 tabular-nums text-muted-foreground">{p.startTime}–{p.endTime}</span>
                    {p.kind !== "Period" ? (
                      <Badge variant="outline">{p.label}</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">P{p.ordinal}</Badge>
                        {p.entry ? (
                          <span className="font-medium">{p.entry.subject} · {p.entry.teacher} · {p.entry.room}</span>
                        ) : (
                          <span className="text-muted-foreground">Free — no timetable entry</span>
                        )}
                        {p.lesson ? (
                          <Link href={`/lesson-plans/${p.lesson.id}`} className="ml-auto inline-flex items-center gap-1 text-primary underline">
                            <BookOpen className="h-3.5 w-3.5" />{p.lesson.topic}<ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : p.entry ? (
                          <span className="ml-auto text-xs text-muted-foreground">No lesson plan</span>
                        ) : null}
                      </>
                    )}
                  </div>
                  {p.lesson ? (
                    <div className="mt-2 flex flex-wrap gap-1 pl-24 text-xs">
                      <Badge className="bg-blue-100 text-blue-700 border-0">{p.lesson.lessonType}</Badge>
                      {p.lesson.materialsToBring.length > 0 ? <Badge variant="outline">bring: {p.lesson.materialsToBring.join(", ")}</Badge> : null}
                      {p.lesson.homework ? <Badge variant="outline">homework</Badge> : null}
                      {p.lesson.classNotes.length > 0 ? <Badge variant="outline">{p.lesson.classNotes.length} note{p.lesson.classNotes.length === 1 ? "" : "s"}</Badge> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
