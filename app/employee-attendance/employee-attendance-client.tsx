"use client"

import { useActionState } from "react"
import { markStaffAttendanceAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const STATUSES = ["present", "absent", "half_day", "leave", "on_duty"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Mark or correct an employee's attendance for a date against the durable backbone. */
export function MarkStaffForm({ org, date, employees }: { org: string; date: string; employees: string[] }) {
  const [state, action, pending] = useActionState(markStaffAttendanceAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="s-emp">Employee id</Label>
          <input list="staff-emps" id="s-emp" name="employee_id" placeholder="SYN-T-01-CHN" required
            className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
          <datalist id="staff-emps">
            {employees.map((e) => <option key={e} value={e} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-date">Date</Label>
          <Input id="s-date" name="date" type="date" defaultValue={date} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-status">Status</Label>
          <select id="s-status" name="status" defaultValue="present" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Payable weight: <code>present</code>/<code>on_duty</code>/<code>leave</code> = 1 day, <code>half_day</code>{" "}
        = 0.5; an <strong>unauthorised absence</strong> = 0 and accrues toward leave-without-pay. Marks are keyed by
        (employee, date): re-marking corrects rather than duplicates.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Marking…" : "Mark attendance"}</Button>
      <Notice state={state} />
    </form>
  )
}
