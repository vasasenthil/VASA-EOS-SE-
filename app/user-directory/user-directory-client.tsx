"use client"

import { useActionState } from "react"
import { upsertUserAction, explainAccessAction, type ActionResult, type ExplainResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const EMPTY: ActionResult = { ok: false, message: "" }
const EMPTY_EXPLAIN: ExplainResult = { ok: false, message: "" }

function Notice({ state }: { state: ActionResult }) {
  if (!state.message) return null
  return (
    <p className={`mt-2 text-sm ${state.ok ? "text-green-600" : "text-destructive"}`} role="status">
      {state.ok ? "✓ " : "✕ "}
      {state.message}
    </p>
  )
}

/** Add or update a directory user against the durable backbone. */
export function UpsertUserForm({ org, roles }: { org: string; roles: { code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(upsertUserAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="u-id">User id</Label>
          <Input id="u-id" name="id" placeholder="SYN-U-NEW-01" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-name">Name</Label>
          <Input id="u-name" name="name" placeholder="Full name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-role">Role</Label>
          <select id="u-role" name="role" defaultValue="TEACHER" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
            {roles.map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="u-org">Org unit (tenancy node)</Label>
          <Input id="u-org" name="org_unit" defaultValue={org} required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="suspended" className="h-4 w-4 rounded border" /> Suspended (fails closed everywhere)
      </label>
      <p className="text-xs text-muted-foreground">
        The role must be one of the canonical catalogue codes; the org unit must be a real tenancy node so ReBAC
        jurisdiction resolves. The user is propagated to the identity plane the unified PDP decides over.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save user"}</Button>
      <Notice state={state} />
    </form>
  )
}

const EFFECT_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  permit: "default",
  "require-approval": "secondary",
  deny: "destructive",
}

/** Reverse access lookup — "why can/can't this user do X" with the full per-model trace. */
export function AccessExplainForm({ org, users }: { org: string; users: string[] }) {
  const [state, action, pending] = useActionState(explainAccessAction, EMPTY_EXPLAIN)
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="x-user">User</Label>
            <input list="dir-users" id="x-user" name="user" placeholder="SYN-U-TCH" required
              className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
            <datalist id="dir-users">
              {users.map((u) => <option key={u} value={u} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label htmlFor="x-action">Action</Label>
            <Input id="x-action" name="action" placeholder="write:assessment" defaultValue="write:assessment" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="x-org">Resource org</Label>
            <Input id="x-org" name="resource_org" defaultValue={org} />
          </div>
          <div className="flex items-end gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="sensitive" className="h-4 w-4 rounded border" /> sensitive</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="pii" className="h-4 w-4 rounded border" /> PII</label>
          </div>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Evaluating…" : "Explain access"}</Button>
      </form>

      {state.message && !state.effect && (
        <p className="text-sm text-destructive" role="status">✕ {state.message}</p>
      )}
      {state.effect && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Badge variant={EFFECT_VARIANT[state.effect] ?? "secondary"} className="uppercase">{state.effect}</Badge>
            <span className="text-sm text-muted-foreground">decided by <strong>{state.deciding_model}</strong></span>
          </div>
          <p className="mt-2 text-sm">{state.reason}</p>
          {state.trace && state.trace.length > 0 && (
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-4 font-medium">Model</th>
                  <th className="py-1 pr-4 font-medium">Verdict</th>
                  <th className="py-1 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {state.trace.map((t, i) => (
                  <tr key={t.model + i} className="border-t">
                    <td className="py-1 pr-4 font-mono">{t.model}</td>
                    <td className="py-1 pr-4">
                      <Badge variant={t.verdict === "permit" ? "default" : t.verdict === "deny" ? "destructive" : "secondary"} className="text-[10px] uppercase">{t.verdict}</Badge>
                    </td>
                    <td className="py-1 text-muted-foreground">{t.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
