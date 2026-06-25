"use client"

import { useActionState } from "react"
import { recordScreeningAction, advanceReferralAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const FINDINGS: { key: string; label: string }[] = [
  { key: "defect", label: "Defect at birth" },
  { key: "disease", label: "Childhood disease" },
  { key: "deficiency", label: "Deficiency (anaemia/VAD)" },
  { key: "disability", label: "Developmental delay/disability" },
]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Record an RBSK screening; ticking any of the four Ds auto-refers the child to the DEIC. */
export function ScreeningForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(recordScreeningAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="r-student">Student id</Label>
          <Input id="r-student" name="student_id" placeholder="SYN-STU-50" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-date">Screened on</Label>
          <Input id="r-date" name="screened_on" type="date" />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Findings (the four Ds) — any tick auto-refers to the DEIC</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {FINDINGS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`finding_${f.key}`} className="h-4 w-4 rounded border" />
              {f.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Leave all unticked to record a healthy screening (no referral).</p>
      </fieldset>
      <Button type="submit" disabled={pending}>{pending ? "Recording…" : "Record screening"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Referral pipeline controls: treat (referred → under-treatment) then close (with an outcome). */
export function ReferralActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(advanceReferralAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        {status === "referred" && (
          <Button type="submit" name="action" value="treat" size="sm" disabled={pending}>Accept &amp; treat</Button>
        )}
        {(status === "referred" || status === "under-treatment") && (
          <>
            <Input name="outcome" placeholder="closure outcome" className="h-8 w-44 text-xs" />
            <Button type="submit" name="action" value="close" size="sm" variant="secondary" disabled={pending}>Close</Button>
          </>
        )}
      </form>
      <Notice state={state} />
    </div>
  )
}
