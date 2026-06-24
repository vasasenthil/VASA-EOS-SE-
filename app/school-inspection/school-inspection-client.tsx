"use client"

import { useActionState } from "react"
import { fileInspectionAction, advanceInspectionAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const TYPES = ["academic", "administrative", "safety", "financial"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** File a monitoring visit. A duplicate open inspection of the same type at the school is rejected server-side. */
export function FileInspectionForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(fileInspectionAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="i-type">Type</Label>
          <select id="i-type" name="type" defaultValue="academic" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-inspector">Inspector id</Label>
          <Input id="i-inspector" name="inspector_id" placeholder="SYN-BEO-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-date">Visited on</Label>
          <Input id="i-date" name="visited_on" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="i-score">Compliance score (0–100)</Label>
          <Input id="i-score" name="compliance_score" type="number" min={0} max={100} defaultValue={75} required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="i-findings">Findings</Label>
          <Input id="i-findings" name="findings" placeholder="Observations from the visit" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        A school cannot carry two <strong>open</strong> inspections of the same type at once — the backbone rejects
        the duplicate.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Filing…" : "File inspection"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Lifecycle controls for an inspection: record action (open → action_taken) then close. */
export function InspectionActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(advanceInspectionAction, EMPTY)
  if (status === "closed") return <span className="text-xs text-muted-foreground">closed</span>
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        {status === "open" && (
          <>
            <Input name="note" placeholder="action taken" className="h-8 w-44 text-xs" required />
            <Button type="submit" name="action" value="action" size="sm" disabled={pending}>Record action</Button>
          </>
        )}
        {status === "action_taken" && (
          <Button type="submit" name="action" value="close" size="sm" variant="secondary" disabled={pending}>Close</Button>
        )}
      </form>
      <Notice state={state} />
    </div>
  )
}
