"use client"

import { useActionState } from "react"
import { raiseIndentAction, approveIndentAction, supplyIndentAction, rejectIndentAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const ITEMS = ["textbook_set", "uniform_set", "notebook_pack", "shoes", "atlas"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Raise an indent. */
export function RaiseIndentForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(raiseIndentAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="i-item">Item</Label>
          <select id="i-item" name="item" defaultValue="textbook_set" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {ITEMS.map((i) => <option key={i} value={i}>{i.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-ent">Entitlement</Label>
          <Input id="i-ent" name="entitled_qty" type="number" min={1} defaultValue={320} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-ind">Indented qty</Label>
          <Input id="i-ind" name="indented_qty" type="number" min={1} defaultValue={300} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise indent"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Approve a quantity. */
export function ApproveForm() {
  const [state, action, pending] = useActionState(approveIndentAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Indent id</Label>
        <Input id="a-id" name="id" placeholder="IND-CHN-BOOK" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="a-qty">Approve qty</Label>
        <Input id="a-qty" name="approved_qty" type="number" min={1} defaultValue={280} className="w-28" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Approving…" : "Approve"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a supply. */
export function SupplyForm() {
  const [state, action, pending] = useActionState(supplyIndentAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="s-id">Indent id</Label>
        <Input id="s-id" name="id" placeholder="IND-CHN-UNI" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-qty">Supply qty</Label>
        <Input id="s-qty" name="qty" type="number" min={1} defaultValue={80} className="w-28" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Supplying…" : "Supply"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Reject a raised indent. */
export function RejectForm() {
  const [state, action, pending] = useActionState(rejectIndentAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="rj-id">Indent id</Label>
        <Input id="rj-id" name="id" placeholder="IND-CHN-BOOK" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Rejecting…" : "Reject"}</Button>
      <Notice state={state} />
    </form>
  )
}
