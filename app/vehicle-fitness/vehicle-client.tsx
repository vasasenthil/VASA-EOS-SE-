"use client"

import { useActionState } from "react"
import { registerVehicleAction, recordDocAction, clearVehicleAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const DOC_KINDS = ["fitness", "insurance", "permit", "puc", "driver_licence"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Register a vehicle. */
export function RegisterVehicleForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerVehicleAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="space-y-1">
        <Label htmlFor="v-reg">Registration no.</Label>
        <Input id="v-reg" name="reg_no" placeholder="SYN-TN-CHN-0002" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register vehicle"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a statutory document. */
export function RecordDocForm() {
  const [state, action, pending] = useActionState(recordDocAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="r-id">Vehicle id</Label>
          <Input id="r-id" name="id" placeholder="VEH-CHN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-kind">Document</Label>
          <select id="r-kind" name="kind" defaultValue="fitness" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {DOC_KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-valid">Validity</Label>
          <select id="r-valid" name="valid" defaultValue="true" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="true">valid (renew)</option>
            <option value="false">lapsed</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-exp">Expiry</Label>
          <Input id="r-exp" name="expiry" type="date" defaultValue="2027-03-31" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record document"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Clear a vehicle for service. */
export function ClearVehicleForm() {
  const [state, action, pending] = useActionState(clearVehicleAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="c-id">Vehicle id</Label>
        <Input id="c-id" name="id" placeholder="VEH-CHN" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Clearing…" : "Clear for service"}</Button>
      <Notice state={state} />
    </form>
  )
}
