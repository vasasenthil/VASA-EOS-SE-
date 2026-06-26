"use client"

import { useActionState } from "react"
import { registerHostelAction, allotBedAction, vacateBedAction, closeHostelAction, type ActionResult } from "./actions"
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

/** Register a new hostel. */
export function RegisterHostelForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerHostelAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="h-name">Hostel name</Label>
          <Input id="h-name" name="name" placeholder="Adi Dravidar Welfare Hostel" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="h-type">Type</Label>
          <select id="h-type" name="type" defaultValue="boys" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="boys">boys</option>
            <option value="girls">girls</option>
            <option value="tribal">tribal</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="h-cap">Capacity (beds)</Label>
          <Input id="h-cap" name="capacity" type="number" min={1} defaultValue={50} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register hostel"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Allot a bed — capacity + one-bed-per-student enforced server-side. */
export function AllotBedForm() {
  const [state, action, pending] = useActionState(allotBedAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Hostel id</Label>
        <Input id="a-id" name="id" placeholder="HOS-CHN-boys" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="a-student">Student id</Label>
        <Input id="a-student" name="student_id" placeholder="SYN-S-CHN-101" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Allotting…" : "Allot bed"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Vacate a bed. */
export function VacateBedForm() {
  const [state, action, pending] = useActionState(vacateBedAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="v-id">Hostel id</Label>
        <Input id="v-id" name="id" placeholder="HOS-CHN-boys" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="v-student">Student id</Label>
        <Input id="v-student" name="student_id" placeholder="SYN-S-CHN-101" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Vacating…" : "Vacate"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close an empty hostel. */
export function CloseHostelForm() {
  const [state, action, pending] = useActionState(closeHostelAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="c-id">Hostel id</Label>
        <Input id="c-id" name="id" placeholder="HOS-CHN-girls" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
