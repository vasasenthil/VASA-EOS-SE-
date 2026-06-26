"use client"

import { useActionState } from "react"
import { draftGOAction, advanceGOAction, type ActionResult } from "./actions"
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

/** Draft a new Government Order. */
export function DraftGOForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(draftGOAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g-dept">Department</Label>
          <Input id="g-dept" name="department" placeholder="School Education (SE1)" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-cat">Category</Label>
          <select id="g-cat" name="category" defaultValue="policy" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="policy">Policy</option>
            <option value="financial">Financial</option>
            <option value="establishment">Establishment</option>
            <option value="scheme">Scheme</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="g-subj">Subject</Label>
          <Input id="g-subj" name="subject" placeholder="Sanction of …" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-amt">Amount ₹ (financial GOs)</Label>
          <Input id="g-amt" name="amount" type="number" min={0} step="0.01" placeholder="0" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Drafting…" : "Draft GO"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Advance a GO one stage: vet → approve → issue → publish. */
export function AdvanceGOForm() {
  const [state, action, pending] = useActionState(advanceGOAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-id">GO id</Label>
          <Input id="a-id" name="id" placeholder="GO-CHN-FIN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-action">Action</Label>
          <select id="a-action" name="action" defaultValue="vet" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="vet">Vet (legal)</option>
            <option value="approve">Approve</option>
            <option value="issue">Issue (assign number)</option>
            <option value="publish">Publish</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-by">Officer (vet / approve)</Label>
          <Input id="a-by" name="by" placeholder="SYN-SEC-01" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-num">Gazette number (issue)</Label>
          <Input id="a-num" name="number" placeholder="G.O.(Ms)No.142/SE/2026" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-cat">Category (issue gate)</Label>
          <select id="a-cat" name="category" defaultValue="policy" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="policy">Policy</option>
            <option value="financial">Financial</option>
            <option value="establishment">Establishment</option>
            <option value="scheme">Scheme</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-amt">Amount ₹ (financial issue)</Label>
          <Input id="a-amt" name="amount" type="number" min={0} step="0.01" placeholder="0" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="sanctioned" defaultChecked /> Sanction order on file (financial GOs)
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Advancing…" : "Advance"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Rescind a GO with a reason. */
export function WithdrawGOForm() {
  const [state, action, pending] = useActionState(advanceGOAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="action" value="withdraw" />
      <div className="space-y-1">
        <Label htmlFor="w-id">GO id</Label>
        <Input id="w-id" name="id" placeholder="GO-CHN-POL" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="w-reason">Reason</Label>
        <Input id="w-reason" name="reason" placeholder="superseded by a later order" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Withdrawing…" : "Withdraw"}</Button>
      <Notice state={state} />
    </form>
  )
}
