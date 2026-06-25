"use client"

import { useActionState } from "react"
import { sanctionAction, appointAction, vacateAction, type ActionResult } from "./actions"
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

/** Sanction (create) a cadre's post line. */
export function SanctionForm() {
  const [state, action, pending] = useActionState(sanctionAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="s-id">Post-line id</Label>
          <Input id="s-id" name="id" placeholder="ESTAB-NEW-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-cadre">Cadre</Label>
          <Input id="s-cadre" name="cadre" placeholder="Graduate Teacher (BT)" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-sanctioned">Sanctioned</Label>
          <Input id="s-sanctioned" name="sanctioned" type="number" min={1} placeholder="8" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Sanctioning…" : "Sanction posts"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Appoint staff into a sanctioned post — the over-appointment invariant is enforced server-side. */
export function AppointForm({ cadres }: { cadres: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(appointAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-est">Cadre (post line)</Label>
          <select id="a-est" name="establishment_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select a cadre…</option>
            {cadres.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-emp">Employee id</Label>
          <Input id="a-emp" name="employee_id" placeholder="SYN-T-101" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-name">Name</Label>
          <Input id="a-name" name="name" placeholder="Staff member" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-date">Appointed on</Label>
          <Input id="a-date" name="appointed_on" type="date" defaultValue="2026-06-22" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Appointing…" : "Appoint staff"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Vacate a filled post (frees a sanctioned slot). */
export function VacateButton({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState(vacateAction, EMPTY)
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={appointmentId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} title={state.message || "Vacate this post"}>
        {pending ? "…" : "Vacate"}
      </Button>
    </form>
  )
}
