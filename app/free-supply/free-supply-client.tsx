"use client"

import { useActionState } from "react"
import { grantAction, issueAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }
const ITEMS = ["textbook", "notebook", "uniform", "shoes", "bag", "cycle"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Issue a distribution against an entitlement — over-issue is rejected server-side. */
export function IssueForm({ entitlements }: { entitlements: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(issueAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="e-ent">Entitlement</Label>
          <select id="e-ent" name="entitlement_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select an entitlement with a balance…</option>
            {entitlements.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="e-qty">Quantity to issue</Label>
          <Input id="e-qty" name="qty" type="number" min={1} placeholder="1" required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="e-ref">Reference (GRN)</Label>
          <Input id="e-ref" name="reference" placeholder="Goods-received-note ref" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try issuing more than the remaining balance — the backbone rejects it (a student can never be issued more
        than their entitlement).
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue supply"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Grant a student's free-supply entitlement. */
export function GrantForm() {
  const [state, action, pending] = useActionState(grantAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="g-student">Student id</Label>
          <Input id="g-student" name="student_id" placeholder="SYN-S-010" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-item">Item</Label>
          <select id="g-item" name="item" defaultValue="uniform" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {ITEMS.map((it) => <option key={it} value={it}>{it}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-qty">Entitled quantity</Label>
          <Input id="g-qty" name="entitled_qty" type="number" min={1} placeholder="4" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="g-term">Term</Label>
          <Input id="g-term" name="term" defaultValue="2026" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Granting…" : "Grant entitlement"}</Button>
      <Notice state={state} />
    </form>
  )
}
