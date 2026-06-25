"use client"

import { useActionState } from "react"
import {
  registerAssetAction,
  raiseTicketAction,
  advanceTicketAction,
  decommissionAssetAction,
  returnAssetAction,
  type ActionResult,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const CATEGORIES = ["room", "furniture", "equipment", "ict", "sanitation", "playground", "vehicle"]
const CONDITIONS = ["good", "fair", "poor", "unusable"]
const SEVERITIES = ["low", "medium", "high", "critical"]

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Register a new asset on the estate register. */
export function RegisterAssetForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(registerAssetAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-id">Asset id</Label>
          <Input id="a-id" name="id" placeholder="AST-CHN-CLASS-9B" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-name">Name</Label>
          <Input id="a-name" name="name" placeholder="Classroom 9-B" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-cat">Category</Label>
          <select id="a-cat" name="category" defaultValue="room" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-cond">Condition</Label>
          <select id="a-cond" name="condition" defaultValue="good" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-acq">Acquired on</Label>
          <Input id="a-acq" name="acquired_on" type="date" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registering…" : "Register asset"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Raise a maintenance ticket against an asset. */
export function RaiseTicketForm({ org, assets }: { org: string; assets: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(raiseTicketAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="t-asset">Asset</Label>
          {assets.length ? (
            <select id="t-asset" name="asset_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
            </select>
          ) : (
            <Input id="t-asset" name="asset_id" placeholder="AST-CHN-LAB-COMP" required />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-sev">Severity</Label>
          <select id="t-sev" name="severity" defaultValue="medium" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="t-issue">Issue</Label>
          <Input id="t-issue" name="issue" placeholder="Ceiling fan not working in row 3" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        A <strong>critical</strong> ticket automatically flips its asset to <code>under_maintenance</code>; while any
        ticket is open the asset cannot be decommissioned or returned to service.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Raising…" : "Raise ticket"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Ticket lifecycle controls: assign → resolve → close. */
export function TicketActions({ ticketId, status }: { ticketId: string; status: string }) {
  const [state, action, pending] = useActionState(advanceTicketAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="id" value={ticketId} />
        {status === "open" && (
          <>
            <Input name="assignee" placeholder="assignee (SYN-TECH-01)" className="h-8 w-44 text-xs" required />
            <Button type="submit" name="action" value="assign" size="sm" disabled={pending}>Assign</Button>
          </>
        )}
        {status === "in_progress" && (
          <Button type="submit" name="action" value="resolve" size="sm" variant="secondary" disabled={pending}>Resolve</Button>
        )}
        {status === "resolved" && (
          <Button type="submit" name="action" value="close" size="sm" variant="default" disabled={pending}>Close</Button>
        )}
        {status === "closed" && <span className="text-xs text-muted-foreground">closed</span>}
      </form>
      <Notice state={state} />
    </div>
  )
}

/** Asset lifecycle controls: decommission (guarded) / return to service. */
export function AssetActions({ assetId, status, hasOpenTicket }: { assetId: string; status: string; hasOpenTicket: boolean }) {
  const [decState, decAction, decPending] = useActionState(decommissionAssetAction, EMPTY)
  const [retState, retAction, retPending] = useActionState(returnAssetAction, EMPTY)
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "under_maintenance" && (
          <form action={retAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={assetId} />
            <select name="condition" defaultValue="fair" className="h-8 rounded-md border bg-background px-2 text-xs">
              {CONDITIONS.filter((c) => c !== "unusable").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button type="submit" size="sm" variant="secondary" disabled={retPending}>Return to service</Button>
          </form>
        )}
        {status !== "decommissioned" && (
          <form action={decAction}>
            <input type="hidden" name="id" value={assetId} />
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={decPending}
              title={hasOpenTicket ? "Backbone will reject: asset has an open ticket" : "Decommission this asset"}
            >
              Decommission
            </Button>
          </form>
        )}
      </div>
      <Notice state={decState.message ? decState : retState} />
    </div>
  )
}
