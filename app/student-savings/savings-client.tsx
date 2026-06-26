"use client"

import { useActionState } from "react"
import { openAccountAction, depositAction, withdrawAction, freezeAction, closeAccountAction, type ActionResult } from "./actions"
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

/** Open a passbook. */
export function OpenAccountForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(openAccountAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="space-y-1">
        <Label htmlFor="o-stu">Student id</Label>
        <Input id="o-stu" name="student_id" placeholder="SYN-S-CHN-S3" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open passbook"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Deposit. */
export function DepositForm() {
  const [state, action, pending] = useActionState(depositAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="d-id">Account id</Label>
        <Input id="d-id" name="id" placeholder="SAV-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="d-amt">Amount (₹)</Label>
        <Input id="d-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={100} className="w-32" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Depositing…" : "Deposit"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Withdraw. */
export function WithdrawForm() {
  const [state, action, pending] = useActionState(withdrawAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="w-id">Account id</Label>
        <Input id="w-id" name="id" placeholder="SAV-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="w-amt">Amount (₹)</Label>
        <Input id="w-amt" name="amount_rupees" type="number" min={0} step="0.01" defaultValue={50} className="w-32" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Withdrawing…" : "Withdraw"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Freeze a passbook (guardian hold). */
export function FreezeForm() {
  const [state, action, pending] = useActionState(freezeAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="f-id">Account id</Label>
        <Input id="f-id" name="id" placeholder="SAV-CHN-01" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-mode">Hold</Label>
        <select id="f-mode" name="frozen" defaultValue="true" className="h-9 w-32 rounded-md border bg-background px-3 text-sm">
          <option value="true">freeze</option>
          <option value="false">unfreeze</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Apply hold"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a zero-balance passbook. */
export function CloseAccountForm() {
  const [state, action, pending] = useActionState(closeAccountAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">Account id</Label>
        <Input id="cl-id" name="id" placeholder="SAV-CHN-01" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
