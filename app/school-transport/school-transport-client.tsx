"use client"

import { useActionState } from "react"
import { allotAction, withdrawAction, registerRouteAction, type ActionResult } from "./actions"
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

/** Seat a student on a route — capacity + serviceability enforced server-side. */
export function AllotForm({ routes }: { routes: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(allotAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="t-route">Route</Label>
          <select id="t-route" name="route_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select a route…</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-student">Student id</Label>
          <Input id="t-student" name="student_id" placeholder="SYN-S-099" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-stop">Stop</Label>
          <Input id="t-stop" name="stop" placeholder="Boarding stop" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try a full route, or a route flagged unserviceable (lapsed fitness/licence) — the backbone refuses the
        seat with the exact safety reason.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Seating…" : "Allot seat"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Withdraw a seat (frees capacity). */
export function WithdrawButton({ allotmentId }: { allotmentId: string }) {
  const [state, action, pending] = useActionState(withdrawAction, EMPTY)
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={allotmentId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} title={state.message || "Free this seat"}>
        {pending ? "…" : "Withdraw"}
      </Button>
    </form>
  )
}

/** Register a school bus route. */
export function RegisterRouteForm() {
  const [state, action, pending] = useActionState(registerRouteAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="rt-id">Route id</Label>
          <Input id="rt-id" name="id" placeholder="RT-NEW-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rt-name">Name</Label>
          <Input id="rt-name" name="name" placeholder="Adyar–Besant Nagar" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rt-veh">Vehicle no</Label>
          <Input id="rt-veh" name="vehicle_no" placeholder="TN-09-AB-1199" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rt-cap">Capacity</Label>
          <Input id="rt-cap" name="capacity" type="number" min={1} max={100} placeholder="40" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rt-fit">Fitness valid till</Label>
          <Input id="rt-fit" name="fitness_valid_till" type="date" defaultValue="2027-03-31" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rt-lic">Licence valid till</Label>
          <Input id="rt-lic" name="licence_valid_till" type="date" defaultValue="2028-01-31" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="rt-drv">Driver name</Label>
          <Input id="rt-drv" name="driver_name" placeholder="Driver" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register route"}</Button>
      <Notice state={state} />
    </form>
  )
}
