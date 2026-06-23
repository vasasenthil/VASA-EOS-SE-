"use client"

import { useActionState } from "react"
import { fileAction, sanctionAction, disburseAction, reconcileAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const SCHEMES: { code: string; label: string }[] = [
  { code: "post-matric", label: "Post-Matric" },
  { code: "pre-matric", label: "Pre-Matric" },
  { code: "merit", label: "Merit-cum-Means" },
  { code: "maintenance", label: "Maintenance Allowance" },
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

/** File a disbursement — the amount sizes the sanction chain (PFMS/GFR). */
export function FileForm() {
  const [state, action, pending] = useActionState(fileAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="d-student">Student id</Label>
          <Input id="d-student" name="student_id" placeholder="SYN-S-010" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-scheme">Scheme</Label>
          <select id="d-scheme" name="scheme" defaultValue="post-matric" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {SCHEMES.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="d-amt">Amount (₹)</Label>
          <Input id="d-amt" name="amount" type="number" min={1} step="0.01" placeholder="75000.00" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try ₹75,000 → the chain adds DEO (over ₹50k); ₹2,50,000 → adds the directorate (over ₹2L). Higher money,
        more levels of human approval.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Filing…" : "File disbursement"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Sanction at the current tier — Approve advances the chain, Reject stops it. */
export function SanctionButtons({ caseId, role }: { caseId: string; role: string }) {
  const [state, action, pending] = useActionState(sanctionAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={caseId} />
        <input type="hidden" name="role" value={role} />
        <Button type="submit" name="approve" value="true" variant="default" size="sm" disabled={pending}>Approve ({role})</Button>
        <Button type="submit" name="approve" value="false" variant="outline" size="sm" disabled={pending}>Reject</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}

/** Disburse a sanctioned case (with a payment reference). */
export function DisburseButton({ caseId }: { caseId: string }) {
  const [state, action, pending] = useActionState(disburseAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="id" value={caseId} />
        <Input name="payment_ref" placeholder="PFMS ref (optional)" className="h-8 w-40 text-xs" />
        <Button type="submit" variant="default" size="sm" disabled={pending}>Disburse</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}

/** Reconcile a disbursed case against the rail — matched → reconciled, unmatched → flagged (leakage). */
export function ReconcileButtons({ caseId }: { caseId: string }) {
  const [state, action, pending] = useActionState(reconcileAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={caseId} />
        <Button type="submit" name="matched" value="true" variant="default" size="sm" disabled={pending}>Rail matched</Button>
        <Button type="submit" name="matched" value="false" variant="destructive" size="sm" disabled={pending}>Unmatched (flag)</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
