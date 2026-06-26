"use client"

import { useActionState } from "react"
import { openLedgerAction, accrueAction, payAction, waiveAction, borrowAction, type ActionResult } from "./actions"
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

/** Open a member fine ledger. */
export function OpenLedgerForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(openLedgerAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="space-y-1">
        <Label htmlFor="o-mem">Member id</Label>
        <Input id="o-mem" name="member_id" placeholder="SYN-S-CHN-M3" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="o-thr">Block threshold (₹)</Label>
        <Input id="o-thr" name="threshold_rupees" type="number" min={0} step="0.01" defaultValue={100} className="w-32" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open ledger"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Accrue an overdue fine. */
export function AccrueForm() {
  const [state, action, pending] = useActionState(accrueAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-id">Ledger id</Label>
          <Input id="a-id" name="id" placeholder="FINE-CHN-M1" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-book">Book</Label>
          <Input id="a-book" name="book" placeholder="Wings of Fire" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-days">Days overdue</Label>
          <Input id="a-days" name="days_overdue" type="number" min={1} defaultValue={10} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-rate">Daily rate (₹)</Label>
          <Input id="a-rate" name="rate_rupees" type="number" min={0} step="0.01" defaultValue={2} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Accruing…" : "Accrue fine"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Pay a fine. */
export function PayForm() {
  const [state, action, pending] = useActionState(payAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="p-id">Ledger id</Label>
        <Input id="p-id" name="id" placeholder="FINE-CHN-M2" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="p-fid">Fine id</Label>
        <Input id="p-fid" name="fine_id" placeholder="F-CHN-2" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="p-amt">Amount (₹)</Label>
        <Input id="p-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={160} className="w-28" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Paying…" : "Pay"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Waive a fine. */
export function WaiveForm() {
  const [state, action, pending] = useActionState(waiveAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="w-id">Ledger id</Label>
        <Input id="w-id" name="id" placeholder="FINE-CHN-M2" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="w-fid">Fine id</Label>
        <Input id="w-fid" name="fine_id" placeholder="F-CHN-2" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Waiving…" : "Waive"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Request to borrow (gate). */
export function BorrowForm() {
  const [state, action, pending] = useActionState(borrowAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="b-id">Ledger id</Label>
        <Input id="b-id" name="id" placeholder="FINE-CHN-M2" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="b-book">Book to borrow</Label>
        <Input id="b-book" name="book" placeholder="The Discovery of India" className="w-52" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Checking…" : "Request loan"}</Button>
      <Notice state={state} />
    </form>
  )
}
