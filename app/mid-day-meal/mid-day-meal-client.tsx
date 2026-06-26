"use client"

import { useActionState } from "react"
import { receiveAction, serveAction, type ActionResult } from "./actions"
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

function SchoolSelect({ schools, id }: { schools: string[]; id: string }) {
  return (
    <select id={id} name="org_unit" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
      {schools.length === 0 && <option value="">No school in scope</option>}
      {schools.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

/** Record a foodgrain receipt (increases stock). */
export function ReceiveForm({ schools }: { schools: string[] }) {
  const [state, action, pending] = useActionState(receiveAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="r-school">School</Label>
          <SchoolSelect schools={schools} id="r-school" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-grain">Foodgrain (kg)</Label>
          <Input id="r-grain" name="grain_kg" type="number" min={1} step="0.1" placeholder="100" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-date">Date</Label>
          <Input id="r-date" name="date" type="date" defaultValue="2026-06-22" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-note">Note</Label>
          <Input id="r-note" name="note" placeholder="TPDS lifting" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record receipt"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a day's meal service — stock-non-negative + meals<=enrolment enforced server-side. */
export function ServeForm({ schools }: { schools: string[] }) {
  const [state, action, pending] = useActionState(serveAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="s-school">School</Label>
          <SchoolSelect schools={schools} id="s-school" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-date">Date</Label>
          <Input id="s-date" name="date" type="date" defaultValue="2026-06-23" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-served">Meals served</Label>
          <Input id="s-served" name="meals_served" type="number" min={1} placeholder="300" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-enrol">Enrolment</Label>
          <Input id="s-enrol" name="enrolment" type="number" min={1} placeholder="320" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-grain">Grain cooked (kg)</Label>
          <Input id="s-grain" name="grain_kg" type="number" min={0.1} step="0.1" placeholder="30" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try cooking more grain than the school&apos;s balance, or serving more than enrolment — the backbone
        rejects it (stock can never go negative; meals ≤ enrolment).
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record day's service"}</Button>
      <Notice state={state} />
    </form>
  )
}
