"use client"

import { useActionState } from "react"
import { openVisitAction, treatVisitAction, closeVisitAction, type ActionResult } from "./actions"
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

/** Open a sick-room visit. */
export function OpenVisitForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(openVisitAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="o-stu">Student id</Label>
          <Input id="o-stu" name="student_id" placeholder="SYN-S-CHN-C09" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="o-comp">Complaint</Label>
          <Input id="o-comp" name="complaint" placeholder="Headache" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open visit"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a treatment. */
export function TreatForm() {
  const [state, action, pending] = useActionState(treatVisitAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="t-id">Visit id</Label>
        <Input id="t-id" name="id" placeholder="CLN-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="t-note">Treatment note</Label>
        <Input id="t-note" name="note" placeholder="Rest + ORS" className="w-48" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record treatment"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a visit with an outcome. */
export function CloseVisitForm() {
  const [state, action, pending] = useActionState(closeVisitAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="c-id">Visit id</Label>
        <Input id="c-id" name="id" placeholder="CLN-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-out">Outcome</Label>
        <select id="c-out" name="outcome" defaultValue="recovered" className="h-9 w-36 rounded-md border bg-background px-3 text-sm">
          <option value="recovered">recovered</option>
          <option value="referred">referred</option>
          <option value="sent_home">sent home</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-dest">Destination (if referred)</Label>
        <Input id="c-dest" name="destination" placeholder="PHC-CHN" className="w-40" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Closing…" : "Close visit"}</Button>
      <Notice state={state} />
    </form>
  )
}
