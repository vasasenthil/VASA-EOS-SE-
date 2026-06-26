"use client"

import { useActionState } from "react"
import { chargeAction, inquiryAction, decideAction, appealAction, closeCaseAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const PENALTIES = ["censure", "withhold_increment", "recovery", "reduction_in_rank", "compulsory_retirement", "removal", "dismissal"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Issue a charge. */
export function ChargeForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(chargeAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="c-emp">Employee id</Label>
          <Input id="c-emp" name="employee_id" placeholder="SYN-T-CHN-14" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-charge">Charge</Label>
          <Input id="c-charge" name="charge" placeholder="Unauthorised absence" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue charge"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record the inquiry. */
export function InquiryForm() {
  const [state, action, pending] = useActionState(inquiryAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="i-id">Case id</Label>
          <Input id="i-id" name="id" placeholder="DIS-CHN-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-find">Findings</Label>
          <Input id="i-find" name="findings" placeholder="Charge proved" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record inquiry"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Impose a penalty. */
export function DecideForm() {
  const [state, action, pending] = useActionState(decideAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="d-id">Case id</Label>
        <Input id="d-id" name="id" placeholder="DIS-CHN-02" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="d-pen">Penalty</Label>
        <select id="d-pen" name="penalty" defaultValue="censure" className="h-9 w-48 rounded-md border bg-background px-3 text-sm">
          {PENALTIES.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Deciding…" : "Decide (impose penalty)"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Appeal a decided case. */
export function AppealForm() {
  const [state, action, pending] = useActionState(appealAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Case id</Label>
        <Input id="a-id" name="id" placeholder="DIS-CHN-03" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="a-gr">Grounds</Label>
        <Input id="a-gr" name="grounds" placeholder="Penalty disproportionate" className="w-52" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Filing…" : "File appeal"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a decided case. */
export function CloseCaseForm() {
  const [state, action, pending] = useActionState(closeCaseAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cc-id">Case id</Label>
        <Input id="cc-id" name="id" placeholder="DIS-CHN-03" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
