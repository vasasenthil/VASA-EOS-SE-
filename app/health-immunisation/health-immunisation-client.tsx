"use client"

import { useActionState } from "react"
import { recordDoseAction, type ActionResult } from "./actions"
import type { PlatformVaccine } from "@/lib/platform-client"
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

/** Record an administered vaccine dose — sequence/schedule enforced server-side. */
export function RecordDoseForm({ schedule }: { schedule: PlatformVaccine[] }) {
  const [state, action, pending] = useActionState(recordDoseAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="i-student">Student id</Label>
          <Input id="i-student" name="student_id" placeholder="SYN-S-008" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-vac">Vaccine</Label>
          <select id="i-vac" name="vaccine" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {schedule.length === 0 && <option value="">Schedule unavailable</option>}
            {schedule.map((v) => <option key={v.code} value={v.code}>{v.name} ({v.required_doses} dose{v.required_doses > 1 ? "s" : ""})</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-dose">Dose number</Label>
          <Input id="i-dose" name="dose_number" type="number" min={1} max={3} defaultValue={1} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-date">Administered on</Label>
          <Input id="i-date" name="administered_on" type="date" defaultValue="2026-06-20" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="i-batch">Batch</Label>
          <Input id="i-batch" name="batch" placeholder="Batch no" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try recording <strong>MR dose 2</strong> for a child with no dose 1 → the backbone rejects it
        (out-of-sequence). Off-schedule vaccines and future dates are rejected too.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record dose"}</Button>
      <Notice state={state} />
    </form>
  )
}
