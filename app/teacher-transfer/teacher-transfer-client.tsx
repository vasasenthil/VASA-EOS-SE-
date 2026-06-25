"use client"

import { useActionState } from "react"
import {
  requestTransferAction,
  approveTransferAction,
  postTransferAction,
  rejectTransferAction,
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

/** Raise a new teacher transfer request. */
export function RequestTransferForm({ toOrg, fromOrg }: { toOrg: string; fromOrg: string }) {
  const [state, action, pending] = useActionState(requestTransferAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="t-emp">Employee id</Label>
          <Input id="t-emp" name="employee_id" placeholder="SYN-T-042" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-name">Name</Label>
          <Input id="t-name" name="name" placeholder="SYN Teacher" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-cadre">Cadre</Label>
          <select id="t-cadre" name="cadre" defaultValue="Graduate Teacher (BT)" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option>Graduate Teacher (BT)</option>
            <option>Secondary Grade Teacher</option>
            <option>Physical Education Teacher</option>
            <option>Headmaster</option>
            <option>Office Assistant</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-reason">Reason</Label>
          <select id="t-reason" name="reason" defaultValue="request" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="request">request</option>
            <option value="mutual">mutual</option>
            <option value="administrative">administrative</option>
            <option value="promotion">promotion</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-from">From school</Label>
          <Input id="t-from" name="from_org" defaultValue={fromOrg} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-to">Destination school</Label>
          <Input id="t-to" name="to_org" defaultValue={toOrg} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Approval is blocked unless the destination has a <strong>sanctioned vacancy</strong> in the cadre (checked
        live against the Establishment register).
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Requesting…" : "Request transfer"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Approve a requested transfer — the cross-module vacancy gate is enforced server-side. */
export function ApproveTransferForm() {
  const [state, action, pending] = useActionState(approveTransferAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Request id</Label>
        <Input id="a-id" name="id" placeholder="TT-CHN-02" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Approving…" : "Approve (vacancy-gated)"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Post an approved transfer. */
export function PostTransferForm() {
  const [state, action, pending] = useActionState(postTransferAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="p-id">Request id</Label>
        <Input id="p-id" name="id" placeholder="TT-CHN-02" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Posting…" : "Post"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Reject a requested transfer. */
export function RejectTransferForm() {
  const [state, action, pending] = useActionState(rejectTransferAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="rj-id">Request id</Label>
        <Input id="rj-id" name="id" placeholder="TT-CHN-02" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rj-note">Note</Label>
        <Input id="rj-note" name="note" placeholder="reason" />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Rejecting…" : "Reject"}</Button>
      <Notice state={state} />
    </form>
  )
}
