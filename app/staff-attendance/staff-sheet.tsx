"use client"

import { useState, useTransition } from "react"
import { TEACHERS } from "@/lib/timetable"
import { defaultStaffRecords, summariseStaff, NEXT_STAFF_STATUS, STAFF_STATUS_LABELS, type StaffStatus } from "@/lib/staff-attendance"
import type { SavedSheet } from "@/lib/staff-attendance/store"
import { saveSheetAction } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STATUS_VARIANT: Record<StaffStatus, "default" | "destructive" | "secondary" | "outline"> = {
  present: "default",
  absent: "destructive",
  late: "secondary",
  on_duty: "outline",
}
const TODAY = new Date().toISOString().slice(0, 10)

export function StaffSheet({ initial = [] }: { initial?: SavedSheet[] }) {
  const [records, setRecords] = useState<Record<string, StaffStatus>>(() => defaultStaffRecords(TEACHERS))
  const [saved, setSaved] = useState(false)
  const [sheets, setSheets] = useState<SavedSheet[]>(initial)
  const [pending, startTransition] = useTransition()
  const summary = summariseStaff(records, TEACHERS)

  function cycle(name: string) {
    setRecords((r) => ({ ...r, [name]: NEXT_STAFF_STATUS[r[name] ?? "present"] }))
    setSaved(false)
  }

  function submit() {
    startTransition(async () => {
      const s = await saveSheetAction({ date: TODAY, records, pct: summary.pct })
      if (s) {
        setSheets((prev) => [s, ...prev])
        setSaved(true)
      }
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Mark staff attendance — tap to change</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {TEACHERS.map((name) => {
              const st = records[name] ?? "present"
              return (
                <li key={name}>
                  <button type="button" onClick={() => cycle(name)} className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-accent/40">
                    <span className="font-medium">{name}</span>
                    <Badge variant={STATUS_VARIANT[st]}>{STAFF_STATUS_LABELS[st]}</Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{summary.pct}%</span>
              <span className="text-sm text-muted-foreground">attended</span>
            </div>
            <Progress value={summary.pct} className="mt-2 h-2" />
          </div>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Present</span><span>{summary.present}</span></li>
            <li className="flex justify-between"><span>Late</span><span>{summary.late}</span></li>
            <li className="flex justify-between"><span>On duty</span><span>{summary.onDuty}</span></li>
            <li className="flex justify-between"><span>Absent</span><span className="text-destructive">{summary.absent}</span></li>
            <li className="flex justify-between border-t pt-1 font-medium"><span>Total</span><span>{summary.total}</span></li>
          </ul>
          <Button className="w-full" onClick={submit} disabled={pending}>{saved ? "Saved ✓" : "Submit & save"}</Button>
          {sheets.length > 0 ? (
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Saved sheets ({sheets.length})</p>
              <ul className="space-y-1 text-xs">
                {sheets.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex justify-between text-muted-foreground">
                    <span>{s.date}</span>
                    <span>{s.pct}% attended</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
