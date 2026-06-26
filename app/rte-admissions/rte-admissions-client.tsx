"use client"

import { useActionState } from "react"
import { applyAction, finaliseAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const CATEGORIES = ["GEN", "OBC", "SC", "ST", "EWS", "DG"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Submit an admission application (admit / reject) — RTE rules are enforced server-side. */
export function ApplyForm() {
  const [state, action, pending] = useActionState(applyAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ap-id">Applicant id</Label>
          <Input id="ap-id" name="applicant_id" placeholder="APP-2026-001" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ap-name">Applicant name</Label>
          <Input id="ap-name" name="applicant_name" placeholder="Child's name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ap-age">Age</Label>
          <Input id="ap-age" name="age" type="number" min={3} max={18} defaultValue={6} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ap-cat">Category</Label>
          <select id="ap-cat" name="category" defaultValue="EWS" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ap-dec">Decision</Label>
          <select id="ap-dec" name="decision" defaultValue="admit" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="admit">Admit</option>
            <option value="reject">Reject</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-1 text-sm">
          <input type="checkbox" name="quota_full" className="h-4 w-4" />
          RTE 25% quota already full
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Try: Decision <strong>Reject</strong>, Category <strong>EWS</strong>, quota <strong>not</strong> full →
        the backbone holds it for BEO/DEO review (RTE §12(1)(c)), not an instant reject.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit application"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Officer finalisation of a pending-approval request: Uphold (approve) or Overturn (reverse). */
export function FinaliseButtons({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(finaliseAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="request_id" value={requestId} />
        <input type="hidden" name="officer" value="DEO-Chennai" />
        <Button type="submit" name="approve" value="true" variant="outline" size="sm" disabled={pending}>Uphold</Button>
        <Button type="submit" name="approve" value="false" variant="default" size="sm" disabled={pending}>Overturn</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
