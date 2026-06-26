"use client"

import { useActionState } from "react"
import { createPOAction, receiveAction, payAction, closePOAction, type ActionResult } from "./actions"
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

/** Raise a GeM purchase order. */
export function CreatePOForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createPOAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="p-item">Item</Label>
          <Input id="p-item" name="item" placeholder="Dual-desk benches" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-vendor">Vendor</Label>
          <Input id="p-vendor" name="vendor" placeholder="SYN-VEN-FURN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-gem">GeM contract</Label>
          <Input id="p-gem" name="gem_contract" placeholder="GEMC-CHN-001" />
        </div>
        <div className="space-y-1" />
        <div className="space-y-1">
          <Label htmlFor="p-qty">Ordered quantity</Label>
          <Input id="p-qty" name="ordered_qty" type="number" min={1} defaultValue={50} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-price">Unit price (₹)</Label>
          <Input id="p-price" name="unit_price_rupees" type="number" min={0} step="0.01" defaultValue={2500} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise PO"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a goods receipt. */
export function ReceiveForm() {
  const [state, action, pending] = useActionState(receiveAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="r-id">PO id</Label>
        <Input id="r-id" name="id" placeholder="PO-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-qty">Qty received</Label>
        <Input id="r-qty" name="qty" type="number" min={1} defaultValue={20} className="w-28" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Receiving…" : "Receive goods"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a payment. */
export function PayForm() {
  const [state, action, pending] = useActionState(payAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="pay-id">PO id</Label>
        <Input id="pay-id" name="id" placeholder="PO-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pay-amt">Amount (₹)</Label>
        <Input id="pay-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={25000} className="w-36" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Paying…" : "Pay vendor"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a fully-received PO. */
export function ClosePOForm() {
  const [state, action, pending] = useActionState(closePOAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">PO id</Label>
        <Input id="cl-id" name="id" placeholder="PO-CHN-02" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
