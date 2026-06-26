"use client"

import { useActionState } from "react"
import { addEntryAction, decideEntryAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const TYPES = ["term", "exam", "holiday", "ptm", "event"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Add a calendar draft and submit it into its dynamically-sized approval chain. */
export function AddEntryForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(addEntryAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="e-title">Title</Label>
          <Input id="e-title" name="title" placeholder="Term II Examination" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-type">Type</Label>
          <select id="e-type" name="type" defaultValue="exam" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-start">Start date</Label>
          <Input id="e-start" name="start_date" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-end">End date</Label>
          <Input id="e-end" name="end_date" type="date" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The approval depth is derived from the type and jurisdiction: a school <strong>event</strong> auto-publishes;
        a school <strong>exam</strong> needs G4 (DEO) → G3 (Director); wider/holiday entries need more levels.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Add & submit"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Approve/Reject at an entry's current tier — the tier's role + required scope are carried as the actor's. */
export function DecideControls({
  entryId,
  role,
  scope,
}: {
  entryId: string
  role: string
  scope: string
}) {
  const [state, action, pending] = useActionState(decideEntryAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="entry_id" value={entryId} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="scope" value={scope} />
        <Input name="note" placeholder="note (optional)" className="h-8 w-40 text-xs" />
        <Button type="submit" name="approve" value="true" size="sm" disabled={pending}>Approve</Button>
        <Button type="submit" name="approve" value="false" size="sm" variant="destructive" disabled={pending}>Reject</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
