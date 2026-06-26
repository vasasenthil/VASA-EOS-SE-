"use client"

import { useActionState } from "react"
import { createEventAction, registerAction, withdrawAction, closeEventAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const CATEGORIES = ["sports", "arts", "club", "excursion", "workshop"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Open an event. */
export function CreateEventForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createEventAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="e-name">Name</Label>
          <Input id="e-name" name="name" placeholder="District football trial" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-cat">Category</Label>
          <select id="e-cat" name="category" defaultValue="sports" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-cap">Seat cap</Label>
          <Input id="e-cap" name="seat_cap" type="number" min={1} defaultValue={4} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-date">Event date</Label>
          <Input id="e-date" name="event_date" type="date" defaultValue="2026-07-15" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open event"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Register a student. */
export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="r-id">Event id</Label>
        <Input id="r-id" name="id" placeholder="EVT-CHN-TRIAL" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-stu">Student id</Label>
        <Input id="r-stu" name="student_id" placeholder="SYN-S-CHN-T07" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Withdraw a student. */
export function WithdrawForm() {
  const [state, action, pending] = useActionState(withdrawAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="w-id">Event id</Label>
        <Input id="w-id" name="id" placeholder="EVT-CHN-TRIAL" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="w-stu">Student id</Label>
        <Input id="w-stu" name="student_id" placeholder="SYN-S-CHN-T01" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Withdrawing…" : "Withdraw"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close registration. */
export function CloseEventForm() {
  const [state, action, pending] = useActionState(closeEventAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="ce-id">Event id</Label>
        <Input id="ce-id" name="id" placeholder="EVT-CHN-ARTS" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
