"use client"

import { useActionState } from "react"
import {
  scheduleSMCAction,
  conveneSMCAction,
  resolveSMCAction,
  completeSMCAction,
  closeSMCAction,
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

/** Constitute/schedule a new SMC meeting — composition (≥75% parents) is enforced server-side. */
export function ScheduleSMCForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(scheduleSMCAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="s-title">Meeting title</Label>
          <Input id="s-title" name="title" defaultValue="Quarterly School Development Review" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-date">Scheduled date</Label>
          <Input id="s-date" name="scheduled_date" type="date" defaultValue="2026-09-15" required />
        </div>
        <div className="space-y-1" />
        <div className="space-y-1">
          <Label htmlFor="s-total">Total members</Label>
          <Input id="s-total" name="total_members" type="number" min={1} defaultValue={12} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-parents">Parent members</Label>
          <Input id="s-parents" name="parent_members" type="number" min={0} defaultValue={9} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        RTE §21(2): at least <strong>three-fourths</strong> of the committee must be parents/guardians — a
        non-compliant composition is rejected by the backbone.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Scheduling…" : "Schedule meeting"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Convene a scheduled meeting with attendance — quorum (majority present) is enforced server-side. */
export function ConveneSMCForm() {
  const [state, action, pending] = useActionState(conveneSMCAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="c-id">Meeting id</Label>
        <Input id="c-id" name="id" placeholder="SMC-CHN-Q2" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-present">Members present</Label>
        <Input id="c-present" name="present_count" type="number" min={0} defaultValue={8} className="w-32" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Convening…" : "Convene"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Pass a resolution on a convened meeting. */
export function ResolveSMCForm() {
  const [state, action, pending] = useActionState(resolveSMCAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="r-id">Meeting id (convened)</Label>
          <Input id="r-id" name="id" placeholder="SMC-CHN-Q1" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-owner">Owner</Label>
          <Input id="r-owner" name="owner" placeholder="SYN-HM-CHN" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="r-subject">Resolution</Label>
          <Input id="r-subject" name="subject" placeholder="Approve School Development Plan budget" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-due">Due date</Label>
          <Input id="r-due" name="due_date" type="date" defaultValue="2026-07-31" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A resolution can only be recorded on a meeting that reached quorum (convened).</p>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Pass resolution"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Mark an open resolution done. */
export function CompleteResolutionForm({ meetingId, resolutionId }: { meetingId: string; resolutionId: string }) {
  const [state, action, pending] = useActionState(completeSMCAction, EMPTY)
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={meetingId} />
      <input type="hidden" name="resolution_id" value={resolutionId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "…" : "Mark done"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a convened meeting. */
export function CloseSMCForm() {
  const [state, action, pending] = useActionState(closeSMCAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cl-id">Meeting id</Label>
        <Input id="cl-id" name="id" placeholder="SMC-CHN-Q1" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Closing…" : "Close meeting"}</Button>
      <Notice state={state} />
    </form>
  )
}
