"use client"

import { useActionState } from "react"
import { createCircularAction, publishCircularAction, ackCircularAction, archiveCircularAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const CATEGORIES = ["academic", "administrative", "safety", "examination", "finance"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Draft a circular. */
export function CreateCircularForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(createCircularAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" name="title" placeholder="Half-yearly exam schedule" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-cat">Category</Label>
          <select id="c-cat" name="category" defaultValue="academic" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="c-sum">Summary</Label>
          <Input id="c-sum" name="summary" placeholder="One-line summary" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="c-tgt">Target recipients</Label>
          <Input id="c-tgt" name="target_count" type="number" min={1} defaultValue={5} required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Drafting…" : "Draft circular"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Publish a draft. */
export function PublishForm() {
  const [state, action, pending] = useActionState(publishCircularAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="pb-id">Circular id</Label>
        <Input id="pb-id" name="id" placeholder="CIR-CHN-ADMIN" required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Record a read-receipt. */
export function AckForm() {
  const [state, action, pending] = useActionState(ackCircularAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="ak-id">Circular id</Label>
        <Input id="ak-id" name="id" placeholder="CIR-CHN-EXAM" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ak-rcp">Recipient id</Label>
        <Input id="ak-rcp" name="recipient_id" placeholder="SYN-T-CHN-04" required />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Acknowledging…" : "Acknowledge"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Archive a fully-acknowledged circular. */
export function ArchiveForm() {
  const [state, action, pending] = useActionState(archiveCircularAction, EMPTY)
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="ar-id">Circular id</Label>
        <Input id="ar-id" name="id" placeholder="CIR-CHN-SAFE" required />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Archiving…" : "Archive"}</Button>
      <Notice state={state} />
    </form>
  )
}
