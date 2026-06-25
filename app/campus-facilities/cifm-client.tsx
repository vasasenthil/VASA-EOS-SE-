"use client"

import { useActionState } from "react"
import {
  registerFacilityAction,
  raiseWorkOrderAction,
  completeWorkOrderAction,
  setOperationalAction,
  closeFacilityAction,
  type ActionResult,
} from "./actions"
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

/** Register a facility. */
export function RegisterFacilityForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerFacilityAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="f-name">Facility name</Label>
          <Input id="f-name" name="name" placeholder="Science Lab Block" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-cat">Category</Label>
          <select id="f-cat" name="category" defaultValue="building" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="building">building</option>
            <option value="lab">lab</option>
            <option value="toilet">toilet</option>
            <option value="water">water</option>
            <option value="electrical">electrical</option>
            <option value="ground">ground</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-cond">Condition</Label>
          <select id="f-cond" name="condition" defaultValue="good" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="good">good</option>
            <option value="fair">fair</option>
            <option value="poor">poor</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-amc">AMC vendor</Label>
          <Input id="f-amc" name="amc_vendor" placeholder="SYN-AMC-CHN" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-exp">AMC expiry</Label>
          <Input id="f-exp" name="amc_expiry" type="date" defaultValue="2027-03-31" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register facility"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Raise a work order. */
export function RaiseWorkOrderForm() {
  const [state, action, pending] = useActionState(raiseWorkOrderAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="w-id">Facility id</Label>
          <Input id="w-id" name="id" placeholder="FAC-CHN-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="w-pri">Priority</Label>
          <select id="w-pri" name="wo_priority" defaultValue="medium" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="w-title">Work-order title</Label>
          <Input id="w-title" name="wo_title" placeholder="Repair leaking roof" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A <strong>critical</strong> work order auto-moves the facility to under-maintenance and blocks return-to-operational until done.</p>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise work order"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Complete a work order. */
export function CompleteWorkOrderForm() {
  const [state, action, pending] = useActionState(completeWorkOrderAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cw-id">Facility id</Label>
        <Input id="cw-id" name="id" placeholder="FAC-CHN-02" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cw-wo">Work-order id</Label>
        <Input id="cw-wo" name="wo_id" placeholder="FAC-CHN-02-WO01" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Completing…" : "Complete"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Return a facility to operational. */
export function SetOperationalForm() {
  const [state, action, pending] = useActionState(setOperationalAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="op-id">Facility id</Label>
        <Input id="op-id" name="id" placeholder="FAC-CHN-02" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Updating…" : "Set operational"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a facility. */
export function CloseFacilityForm() {
  const [state, action, pending] = useActionState(closeFacilityAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">Facility id</Label>
        <Input id="cl-id" name="id" placeholder="FAC-CHN-03" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
