"use client"

import { useActionState } from "react"
import { requestTCAction, advanceTCAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const REASONS = ["transfer", "completion", "migration", "withdrawal"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Raise a TC for a leaving student. A second active TC for the same student at the school is rejected. */
export function RequestTCForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(requestTCAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="tc-student">Student id</Label>
          <Input id="tc-student" name="student_id" placeholder="SYN-S-200" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tc-reason">Reason</Label>
          <select id="tc-reason" name="reason" defaultValue="transfer" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        A student can hold at most one <strong>active</strong> TC at a school — the backbone rejects a second.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise TC"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Lifecycle controls: issue a requested TC (with serial) or cancel an active TC. */
export function TCActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(advanceTCAction, EMPTY)
  if (status === "cancelled") return <span className="text-xs text-muted-foreground">cancelled</span>
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        {status === "requested" && (
          <>
            <Input name="serial" placeholder="serial e.g. TC/2026/045" className="h-8 w-40 text-xs" required />
            <Button type="submit" name="action" value="issue" size="sm" disabled={pending}>Issue</Button>
          </>
        )}
        {(status === "requested" || status === "issued") && (
          <Button type="submit" name="action" value="cancel" size="sm" variant="destructive" disabled={pending}>Cancel</Button>
        )}
      </form>
      <Notice state={state} />
    </div>
  )
}
