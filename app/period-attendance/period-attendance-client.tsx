"use client"

import { useActionState } from "react"
import { markPeriodAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Mark a class-period. The subject/teacher are taken from the timetable; a delivered period may link a plan. */
export function MarkPeriodForm({ org, date }: { org: string; date: string }) {
  const [state, action, pending] = useActionState(markPeriodAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="p-class">Class</Label>
          <Input id="p-class" name="class" defaultValue="Grade 8-A" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-date">Date</Label>
          <Input id="p-date" name="date" type="date" defaultValue={date} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-period">Period</Label>
          <Input id="p-period" name="period" type="number" min={1} max={8} defaultValue={3} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-status">Status</Label>
          <select id="p-status" name="status" defaultValue="delivered" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="delivered">delivered</option>
            <option value="not_held">not held</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-strength">Class strength</Label>
          <Input id="p-strength" name="strength" type="number" min={0} defaultValue={30} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-plan">Lesson plan id (published)</Label>
          <Input id="p-plan" name="lesson_plan_id" placeholder="LP-CHN-01" />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <Label htmlFor="p-abs">Absentees (comma-separated student ids)</Label>
          <Input id="p-abs" name="absentees" placeholder="SYN-S-001, SYN-S-002" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The period must exist in the class timetable for that day (subject + teacher are snapshotted from it); a
        delivered period can only link a <strong>published</strong> lesson plan. Day is derived from the date;
        start/end come from the bell schedule. Re-marking the same period corrects it.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Marking…" : "Mark period"}</Button>
      <Notice state={state} />
    </form>
  )
}
