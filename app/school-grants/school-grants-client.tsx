"use client"

import { useActionState } from "react"
import { allocateGrantAction, grantActionAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const HEADS = ["composite", "library", "sports", "maintenance"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Allocate a grant to a school (rupees). */
export function AllocateGrantForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(allocateGrantAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g-head">Head</Label>
          <select id="g-head" name="head" defaultValue="composite" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-amt">Allocation (₹)</Label>
          <Input id="g-amt" name="rupees" type="number" min={1} step="0.01" placeholder="50000" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Allocating…" : "Allocate grant"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Grant controls: book expenditure (rupees) or close. An over-spend is rejected server-side. */
export function GrantActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(grantActionAction, EMPTY)
  if (status === "closed") return <span className="text-xs text-muted-foreground">closed</span>
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="rupees" type="number" min={1} step="0.01" placeholder="₹ spend" className="h-8 w-24 text-xs" />
        <Input name="purpose" placeholder="purpose" className="h-8 w-28 text-xs" />
        <Button type="submit" name="action" value="spend" size="sm" disabled={pending}>Book</Button>
        <Button type="submit" name="action" value="close" size="sm" variant="secondary" disabled={pending}>Close</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
