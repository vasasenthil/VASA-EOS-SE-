"use client"

import { useState } from "react"
import { TEACHERS } from "@/lib/timetable"
import { defaultStaffRecords, summariseStaff, NEXT_STAFF_STATUS, STAFF_STATUS_LABELS, type StaffStatus } from "@/lib/staff-attendance"
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

export function StaffSheet() {
  const [records, setRecords] = useState<Record<string, StaffStatus>>(() => defaultStaffRecords(TEACHERS))
  const [saved, setSaved] = useState(false)
  const summary = summariseStaff(records, TEACHERS)

  function cycle(name: string) {
    setRecords((r) => ({ ...r, [name]: NEXT_STAFF_STATUS[r[name] ?? "present"] }))
    setSaved(false)
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
          <Button className="w-full" onClick={() => setSaved(true)}>{saved ? "Saved ✓" : "Submit"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
