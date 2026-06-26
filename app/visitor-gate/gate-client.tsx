"use client"

import { useActionState } from "react"
import { checkInAction, checkOutAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const PURPOSES = ["parent_meeting", "official", "vendor", "maintenance", "inspection", "guest"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Register a visitor at the gate. */
export function CheckInForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(checkInAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g-vid">Visitor id</Label>
          <Input id="g-vid" name="visitor_id" placeholder="SYN-V-CHN-09" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-name">Name</Label>
          <Input id="g-name" name="name" placeholder="Visitor SYN-V-CHN-09" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-purpose">Purpose</Label>
          <select id="g-purpose" name="purpose" defaultValue="parent_meeting" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {PURPOSES.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-host">Host (staff id)</Label>
          <Input id="g-host" name="host" placeholder="SYN-HM-CHN" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Checking in…" : "Check in"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a visitor's exit. */
export function CheckOutForm() {
  const [state, action, pending] = useActionState(checkOutAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="go-id">Pass id</Label>
        <Input id="go-id" name="id" placeholder="VIS-CHN-01" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Checking out…" : "Check out"}</Button>
      <Notice state={state} />
    </form>
  )
}
