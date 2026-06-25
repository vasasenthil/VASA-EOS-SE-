"use client"

import { useActionState } from "react"
import { markAttendanceAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const STATUSES = ["present", "absent", "late", "excused"]
const SOURCES = ["manual", "biometric", "rfid"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Mark or correct a student's attendance for a date against the durable backbone. */
export function MarkForm({ org, date, students }: { org: string; date: string; students: string[] }) {
  const [state, action, pending] = useActionState(markAttendanceAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-student">Student id</Label>
          <input list="att-students" id="a-student" name="student_id" placeholder="SYN-STU-D" required
            className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
          <datalist id="att-students">
            {students.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-date">Date</Label>
          <Input id="a-date" name="date" type="date" defaultValue={date} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-status">Status</Label>
          <select id="a-status" name="status" defaultValue="present" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-source">Source</Label>
          <select id="a-source" name="source" defaultValue="manual" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Marks are keyed by (student, date): re-marking the same day <strong>corrects</strong> the record instead
        of duplicating it. <code>late</code> counts as attending; <code>excused</code> is neutral.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Marking…" : "Mark attendance"}</Button>
      <Notice state={state} />
    </form>
  )
}
