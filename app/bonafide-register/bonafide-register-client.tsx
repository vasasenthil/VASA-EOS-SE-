"use client"

import { useActionState } from "react"
import { requestBonafideAction, issueBonafideAction, revokeBonafideAction, type ActionResult } from "./actions"
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

/** Raise a new bonafide certificate request. */
export function RequestBonafideForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(requestBonafideAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="b-student">Student id (APAAR/synthetic)</Label>
          <Input id="b-student" name="student_id" placeholder="SYN-S-CHN-101" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-name">Student name</Label>
          <Input id="b-name" name="student_name" placeholder="SYN Student" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="b-purpose">Purpose</Label>
          <select id="b-purpose" name="purpose" defaultValue="scholarship" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="scholarship">scholarship</option>
            <option value="passport">passport</option>
            <option value="bank">bank account</option>
            <option value="bus-pass">bus-pass</option>
            <option value="other">other</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Requesting…" : "Request certificate"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Issue a requested certificate — the cross-module TC gate is enforced server-side. */
export function IssueBonafideForm() {
  const [state, action, pending] = useActionState(issueBonafideAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="i-id">Certificate id</Label>
        <Input id="i-id" name="id" placeholder="BNF-CHN-02" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue (stamp serial)"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Revoke an issued certificate. */
export function RevokeBonafideForm() {
  const [state, action, pending] = useActionState(revokeBonafideAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="rv-id">Certificate id</Label>
        <Input id="rv-id" name="id" placeholder="BNF-CHN-01" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Revoking…" : "Revoke"}</Button>
      <Notice state={state} />
    </form>
  )
}
