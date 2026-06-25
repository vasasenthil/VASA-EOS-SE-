"use client"

import { useActionState } from "react"
import { enterMarksAction, lifecycleAction, type ActionResult } from "./actions"
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

function ActorSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="as" defaultValue={defaultValue} className="h-9 rounded-md border bg-background px-2 text-sm" title="Acting identity (PDP-gated)">
      <option value="teacher">as Teacher (SYN-U-TCH)</option>
      <option value="head">as Head Teacher (SYN-U-HM)</option>
    </select>
  )
}

/** Enter a student's marks on an open/returned sheet. PDP-gated by the acting identity. */
export function EnterMarksForm({ sheets }: { sheets: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(enterMarksAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="m-sheet">Sheet</Label>
          {sheets.length ? (
            <select id="m-sheet" name="exam_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          ) : (
            <Input id="m-sheet" name="exam_id" placeholder="EXM-CHN-MATHS-T1" required />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="m-student">Student id</Label>
          <Input id="m-student" name="student_id" placeholder="SYN-STU-001" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="m-marks">Marks</Label>
          <Input id="m-marks" name="marks" type="number" min={0} placeholder="77" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="m-as">Acting as</Label>
          <ActorSelect defaultValue="teacher" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Marks can only be entered on an <strong>open</strong> or <strong>returned</strong> sheet, by an authorised
        teacher of that school — an unknown actor is denied by the unified PDP.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Enter marks"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Lifecycle controls appropriate to a sheet's status: submit / publish / return. */
export function SheetLifecycle({ examId, status }: { examId: string; status: string }) {
  const [state, action, pending] = useActionState(lifecycleAction, EMPTY)
  if (status === "published") return <span className="text-xs text-muted-foreground">published</span>
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="exam_id" value={examId} />
        {(status === "open" || status === "returned") && (
          <>
            <ActorSelect defaultValue="head" />
            <Button type="submit" name="op" value="submit" size="sm" disabled={pending}>Submit for moderation</Button>
          </>
        )}
        {status === "submitted" && (
          <>
            <ActorSelect defaultValue="head" />
            <Button type="submit" name="op" value="publish" size="sm" disabled={pending}>Publish</Button>
            <Button type="submit" name="op" value="return" size="sm" variant="destructive" disabled={pending}>Return</Button>
          </>
        )}
      </form>
      <Notice state={state} />
    </div>
  )
}
