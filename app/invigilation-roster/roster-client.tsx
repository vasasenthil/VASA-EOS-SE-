"use client"

import { useActionState } from "react"
import { createSessionAction, assignAction, unassignAction, closeSessionAction, type ActionResult } from "./actions"
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

/** Open an exam session. */
export function CreateSessionForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createSessionAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="c-exam">Exam</Label>
          <Input id="c-exam" name="exam" placeholder="Half-yearly" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-date">Date</Label>
          <Input id="c-date" name="date" type="date" defaultValue="2026-09-10" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-slot">Slot</Label>
          <select id="c-slot" name="slot" defaultValue="FN" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="FN">FN (forenoon)</option>
            <option value="AN">AN (afternoon)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-hall">Hall</Label>
          <Input id="c-hall" name="hall" placeholder="Hall-B" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-req">Invigilators required</Label>
          <Input id="c-req" name="required_invigilators" type="number" min={1} defaultValue={2} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open session"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Roster an invigilator. */
export function AssignForm() {
  const [state, action, pending] = useActionState(assignAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Session id</Label>
        <Input id="a-id" name="id" placeholder="INV-CHN-AN" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="a-t">Invigilator id</Label>
        <Input id="a-t" name="teacher" placeholder="SYN-T-CHN-04" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Rostering…" : "Assign"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Remove an invigilator. */
export function UnassignForm() {
  const [state, action, pending] = useActionState(unassignAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="u-id">Session id</Label>
        <Input id="u-id" name="id" placeholder="INV-CHN-FN" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="u-t">Invigilator id</Label>
        <Input id="u-t" name="teacher" placeholder="SYN-T-CHN-02" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Removing…" : "Unassign"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Finalise a session. */
export function CloseSessionForm() {
  const [state, action, pending] = useActionState(closeSessionAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">Session id</Label>
        <Input id="cl-id" name="id" placeholder="INV-CHN-FN" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Finalising…" : "Finalise"}</Button>
      <Notice state={state} />
    </form>
  )
}
