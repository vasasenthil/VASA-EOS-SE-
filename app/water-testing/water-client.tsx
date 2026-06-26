"use client"

import { useActionState } from "react"
import { registerSampleAction, recordParamAction, approveWaterAction, failWaterAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const SOURCES = ["borewell", "tap", "ro", "tanker", "open_well"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Register a water sample. */
export function RegisterSampleForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerSampleAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="w-src">Source</Label>
          <select id="w-src" name="source" defaultValue="borewell" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="w-date">Sample date</Label>
          <Input id="w-date" name="sample_date" type="date" defaultValue="2026-06-25" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register sample"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a parameter reading. */
export function RecordParamForm() {
  const [state, action, pending] = useActionState(recordParamAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="p-id">Sample id</Label>
          <Input id="p-id" name="id" placeholder="WTR-CHN" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-name">Parameter</Label>
          <Input id="p-name" name="name" placeholder="ecoli_cfu" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-val">Reading</Label>
          <Input id="p-val" name="value" type="number" step="any" defaultValue={0} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="p-min">Safe min</Label>
            <Input id="p-min" name="safe_min" type="number" step="any" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-max">Safe max</Label>
            <Input id="p-max" name="safe_max" type="number" step="any" defaultValue={0} />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="critical" defaultChecked className="h-4 w-4" />
        Critical parameter (gates potability)
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record reading"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Approve potable. */
export function ApproveWaterForm() {
  const [state, action, pending] = useActionState(approveWaterAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="a-id">Sample id</Label>
        <Input id="a-id" name="id" placeholder="WTR-CHN" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Approving…" : "Approve potable"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Mark unsafe. */
export function FailWaterForm() {
  const [state, action, pending] = useActionState(failWaterAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="f-id">Sample id</Label>
        <Input id="f-id" name="id" placeholder="WTR-CBE" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-rem">Remarks</Label>
        <Input id="f-rem" name="remarks" placeholder="E.coli detected" className="w-48" />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Failing…" : "Mark unsafe"}</Button>
      <Notice state={state} />
    </form>
  )
}
