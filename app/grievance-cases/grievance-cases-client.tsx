"use client"

import { useActionState } from "react"
import { fileAction, actAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const CATEGORIES = ["safety", "financial", "academic", "infrastructure", "other"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Lodge a grievance — the category drives the SLA escalation chain on the backbone. */
export function FileForm() {
  const [state, action, pending] = useActionState(fileAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g-comp">Complainant</Label>
          <Input id="g-comp" name="complainant" placeholder="Parent / guardian name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-cat">Category</Label>
          <select id="g-cat" name="category" defaultValue="safety" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="g-sub">Subject</Label>
          <Input id="g-sub" name="subject" placeholder="Describe the grievance" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Filing…" : "File grievance"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Act on a case at its current tier — resolve, reject, or escalate to the next authority. */
export function ActButtons({ caseId, role }: { caseId: string; role: string }) {
  const [state, action, pending] = useActionState(actAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={caseId} />
        <input type="hidden" name="role" value={role} />
        <Button type="submit" name="action" value="resolve" variant="default" size="sm" disabled={pending}>Resolve</Button>
        <Button type="submit" name="action" value="escalate" variant="secondary" size="sm" disabled={pending}>Escalate</Button>
        <Button type="submit" name="action" value="reject" variant="outline" size="sm" disabled={pending}>Reject</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
