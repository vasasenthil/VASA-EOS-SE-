"use client"

import { useActionState } from "react"
import { raiseDemandAction, collectPaymentAction, waiveAction, type ActionResult } from "./actions"
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

/** Raise a fee demand against a student. */
export function RaiseDemandForm() {
  const [state, action, pending] = useActionState(raiseDemandAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="d-id">Demand id</Label>
          <Input id="d-id" name="id" placeholder="FEE-NEW-001" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-student">Student id</Label>
          <Input id="d-student" name="student_id" placeholder="SYN-S-010" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-cat">Category</Label>
          <Input id="d-cat" name="category" placeholder="exam" defaultValue="exam" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-amt">Amount (₹)</Label>
          <Input id="d-amt" name="amount" type="number" min={1} step="0.01" placeholder="250.00" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-term">Term</Label>
          <Input id="d-term" name="term" defaultValue="2026-T1" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-due">Due on</Label>
          <Input id="d-due" name="due_on" type="date" defaultValue="2026-06-30" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise demand"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Collect a payment against a demand — the no-overpayment guard is enforced server-side. */
export function CollectPaymentForm({ demands }: { demands: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(collectPaymentAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="p-demand">Demand</Label>
          <select id="p-demand" name="demand_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select an open demand…</option>
            {demands.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-amt">Amount (₹)</Label>
          <Input id="p-amt" name="amount" type="number" min={1} step="0.01" placeholder="100.00" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-mode">Mode</Label>
          <select id="p-mode" name="mode" defaultValue="upi" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="dd">DD</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-ref">Reference</Label>
          <Input id="p-ref" name="reference" placeholder="UPI-TXN-…" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Collecting…" : "Collect payment"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Waive a demand (concession). */
export function WaiveButton({ demandId }: { demandId: string }) {
  const [state, action, pending] = useActionState(waiveAction, EMPTY)
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={demandId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} title={state.message || "Waive this demand"}>
        {pending ? "…" : "Waive"}
      </Button>
    </form>
  )
}
