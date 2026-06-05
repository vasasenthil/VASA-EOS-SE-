"use client"

import { useState } from "react"
import { SIS_ROSTER } from "@/lib/sis"
import { defaultRecords, summariseAttendance, NEXT_STATUS, STATUS_LABELS, type AttendanceStatus } from "@/lib/attendance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const STATUS_VARIANT: Record<AttendanceStatus, "default" | "destructive" | "secondary" | "outline"> = {
  present: "default",
  absent: "destructive",
  late: "secondary",
  leave: "outline",
}

export function AttendanceSheet() {
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() => defaultRecords())
  const [saved, setSaved] = useState(false)
  const summary = summariseAttendance(records)

  function cycle(apaarId: string) {
    setRecords((r) => ({ ...r, [apaarId]: NEXT_STATUS[r[apaarId] ?? "present"] }))
    setSaved(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Mark attendance — tap a name to change status</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {SIS_ROSTER.map((s) => {
              const st = records[s.apaarId] ?? "present"
              return (
                <li key={s.apaarId}>
                  <button
                    type="button"
                    onClick={() => cycle(s.apaarId)}
                    className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-accent/40"
                  >
                    <span>
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.className}</span>
                    </span>
                    <Badge variant={STATUS_VARIANT[st]}>{STATUS_LABELS[st]}</Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{summary.pct}%</span>
              <span className="text-sm text-muted-foreground">present</span>
            </div>
            <Progress value={summary.pct} className="mt-2 h-2" />
          </div>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Present</span><span>{summary.present}</span></li>
            <li className="flex justify-between"><span>Late</span><span>{summary.late}</span></li>
            <li className="flex justify-between"><span>Absent</span><span className="text-destructive">{summary.absent}</span></li>
            <li className="flex justify-between"><span>On leave</span><span>{summary.leave}</span></li>
            <li className="flex justify-between border-t pt-1 font-medium"><span>Total</span><span>{summary.total}</span></li>
          </ul>
          <Button className="w-full" onClick={() => setSaved(true)}>
            {saved ? "Saved ✓" : "Submit attendance"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
