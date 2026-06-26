"use client"

import { useActionState } from "react"
import { createBatchAction, enrolAction, graduateAction, closeBatchAction, type ActionResult } from "./actions"
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

/** Open a remedial batch. */
export function CreateBatchForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createBatchAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="b-sub">Subject</Label>
          <select id="b-sub" name="subject" defaultValue="literacy" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="literacy">literacy</option>
            <option value="numeracy">numeracy</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-tgt">Proficiency target (1–5)</Label>
          <Input id="b-tgt" name="target_level" type="number" min={1} max={5} defaultValue={4} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="b-cap">Capacity</Label>
          <Input id="b-cap" name="capacity" type="number" min={1} defaultValue={10} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open batch"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Enrol a student. */
export function EnrolForm() {
  const [state, action, pending] = useActionState(enrolAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="e-id">Batch id</Label>
        <Input id="e-id" name="id" placeholder="REM-CHN-LIT" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="e-stu">Student id</Label>
        <Input id="e-stu" name="student_id" placeholder="SYN-S-CHN-L10" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="e-lvl">Diagnostic level</Label>
        <Input id="e-lvl" name="level" type="number" min={0} max={5} defaultValue={2} className="w-24" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Enrolling…" : "Enrol"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Graduate a student. */
export function GraduateForm() {
  const [state, action, pending] = useActionState(graduateAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="g-id">Batch id</Label>
        <Input id="g-id" name="id" placeholder="REM-CHN-LIT" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="g-stu">Student id</Label>
        <Input id="g-stu" name="student_id" placeholder="SYN-S-CHN-L02" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="g-lvl">Re-assessed level</Label>
        <Input id="g-lvl" name="exit_level" type="number" min={0} max={5} defaultValue={4} className="w-24" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Graduating…" : "Graduate"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Close a batch. */
export function CloseBatchForm() {
  const [state, action, pending] = useActionState(closeBatchAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="cb-id">Batch id</Label>
        <Input id="cb-id" name="id" placeholder="REM-CHN-NUM" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Closing…" : "Close"}</Button>
      <Notice state={state} />
    </form>
  )
}
