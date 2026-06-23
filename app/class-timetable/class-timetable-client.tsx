"use client"

import { useActionState } from "react"
import { setSlotAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Assign a class-slot — the teacher-clash invariant is enforced server-side. */
export function AssignSlotForm({ org, classes, teachers }: { org: string; classes: string[]; teachers: string[] }) {
  const [state, action, pending] = useActionState(setSlotAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="tt-class">Class</Label>
          {classes.length > 0 ? (
            <select id="tt-class" name="class" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <Input id="tt-class" name="class" placeholder="Grade 8-A" required />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="tt-day">Day</Label>
          <select id="tt-day" name="day" defaultValue="monday" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tt-period">Period (1–8)</Label>
          <Input id="tt-period" name="period" type="number" min={1} max={8} defaultValue={1} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tt-subject">Subject</Label>
          <Input id="tt-subject" name="subject" placeholder="Mathematics" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="tt-teacher">Teacher</Label>
          {teachers.length > 0 ? (
            <select id="tt-teacher" name="teacher_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <Input id="tt-teacher" name="teacher_id" placeholder="SYN-T-01" required />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try assigning a teacher who already has a class at the same day + period — the backbone rejects the clash
        (a teacher can never be in two classes at once).
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign slot"}</Button>
      <Notice state={state} />
    </form>
  )
}
