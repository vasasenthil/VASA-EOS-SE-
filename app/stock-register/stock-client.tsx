"use client"

import { useActionState } from "react"
import { addItemAction, receiveStockAction, issueStockAction, closeItemAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const UNITS = ["nos", "kg", "litre", "pack", "metre", "ream"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Add a stock item. */
export function AddItemForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(addItemAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="i-name">Item</Label>
          <Input id="i-name" name="name" placeholder="A4 paper" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-cat">Category</Label>
          <Input id="i-cat" name="category" placeholder="stationery" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-unit">Unit</Label>
          <select id="i-unit" name="unit" defaultValue="nos" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-1" />
        <div className="space-y-1">
          <Label htmlFor="i-onhand">Opening stock</Label>
          <Input id="i-onhand" name="on_hand" type="number" min={0} defaultValue={40} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-reorder">Reorder level</Label>
          <Input id="i-reorder" name="reorder_level" type="number" min={0} defaultValue={10} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add item"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a goods receipt. */
export function ReceiveStockForm() {
  const [state, action, pending] = useActionState(receiveStockAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="rs-id">Item id</Label>
        <Input id="rs-id" name="id" placeholder="STK-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rs-qty">Qty received</Label>
        <Input id="rs-qty" name="qty" type="number" min={1} defaultValue={20} className="w-28" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Receiving…" : "Receive"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book an issue. */
export function IssueStockForm() {
  const [state, action, pending] = useActionState(issueStockAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="is-id">Item id</Label>
        <Input id="is-id" name="id" placeholder="STK-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="is-qty">Qty issued</Label>
        <Input id="is-qty" name="qty" type="number" min={1} defaultValue={5} className="w-28" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Issuing…" : "Issue"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Retire a zero-balance item. */
export function CloseItemForm() {
  const [state, action, pending] = useActionState(closeItemAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="ci-id">Item id</Label>
        <Input id="ci-id" name="id" placeholder="STK-CHN-02" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
