"use client"

import { useActionState } from "react"
import { openImprestAction, spendImprestAction, replenishImprestAction, settleImprestAction, type ActionResult } from "./actions"
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

/** Open an imprest book. */
export function OpenImprestForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(openImprestAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="space-y-1">
        <Label htmlFor="o-amt">Sanctioned float (₹)</Label>
        <Input id="o-amt" name="sanctioned_rupees" type="number" min={1} step="0.01" defaultValue={10000} className="w-40" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open float"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Book a voucher. */
export function SpendForm() {
  const [state, action, pending] = useActionState(spendImprestAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="s-id">Book id</Label>
          <Input id="s-id" name="id" placeholder="IMP-CHN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-payee">Payee</Label>
          <Input id="s-payee" name="payee" placeholder="SYN-VEN-STAT" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-purpose">Purpose</Label>
          <Input id="s-purpose" name="purpose" placeholder="Stationery" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-amt">Amount (₹)</Label>
          <Input id="s-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={500} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Booking…" : "Book voucher"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Replenish. */
export function ReplenishForm() {
  const [state, action, pending] = useActionState(replenishImprestAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="r-id">Book id</Label>
        <Input id="r-id" name="id" placeholder="IMP-CHN" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="r-amt">Amount (₹)</Label>
        <Input id="r-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={2050} className="w-36" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Replenishing…" : "Replenish"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Settle. */
export function SettleForm() {
  const [state, action, pending] = useActionState(settleImprestAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="se-id">Book id</Label>
        <Input id="se-id" name="id" placeholder="IMP-CBE" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Settling…" : "Settle"}</Button>
      <Notice state={state} />
    </form>
  )
}
