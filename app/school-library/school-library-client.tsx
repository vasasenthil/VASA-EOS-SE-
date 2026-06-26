"use client"

import { useActionState } from "react"
import { issueAction, actAction, type ActionResult } from "./actions"
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

/** Issue a physical copy to a member — one-copy-one-borrower enforced server-side. */
export function IssueForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(issueAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="l-book">Book id (ISBN)</Label>
          <Input id="l-book" name="book_id" placeholder="BK-TAM-001" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="l-title">Title</Label>
          <Input id="l-title" name="title" placeholder="Ponniyin Selvan" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="l-copy">Copy id (barcode)</Label>
          <Input id="l-copy" name="copy_id" placeholder="CP-TAM-001-1" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="l-member">Member id</Label>
          <Input id="l-member" name="member_id" placeholder="SYN-S-099" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Try issuing a copy that is already on loan (e.g. a seeded copy barcode) — the backbone rejects it (a
        single copy can be on loan to at most one member).
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue copy"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Loan lifecycle: return, renew, or mark lost. */
export function LoanActions({ loanId }: { loanId: string }) {
  const [state, action, pending] = useActionState(actAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={loanId} />
        <Button type="submit" name="action" value="return" variant="default" size="sm" disabled={pending}>Return</Button>
        <Button type="submit" name="action" value="renew" variant="secondary" size="sm" disabled={pending}>Renew</Button>
        <Button type="submit" name="action" value="lost" variant="destructive" size="sm" disabled={pending}>Lost</Button>
      </form>
      <Notice state={state} />
    </div>
  )
}
