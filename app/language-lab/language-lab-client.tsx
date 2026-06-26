"use client"

import { useActionState } from "react"
import { requestTranslationAction, advanceTranslationAction, type ActionResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY: ActionResult = { ok: false, message: "" }

const LANGS: [string, string][] = [
  ["ta", "Tamil"], ["en", "English"], ["hi", "Hindi"], ["te", "Telugu"], ["kn", "Kannada"],
  ["ml", "Malayalam"], ["ur", "Urdu"], ["bn", "Bengali"], ["mr", "Marathi"], ["gu", "Gujarati"],
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

/** Request a new translation job. */
export function RequestTranslationForm({ org }: { org: string }) {
  const [state, action, pending] = useActionState(requestTranslationAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="org_unit" value={org} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="t-title">Content title</Label>
          <Input id="t-title" name="title" placeholder="Mid-term PTM notice" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-domain">Domain</Label>
          <select id="t-domain" name="domain" defaultValue="parent-comms" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="curriculum">curriculum</option>
            <option value="notice">notice</option>
            <option value="circular">circular</option>
            <option value="parent-comms">parent-comms</option>
            <option value="exam">exam</option>
          </select>
        </div>
        <div className="space-y-1" />
        <div className="space-y-1">
          <Label htmlFor="t-src">Source language</Label>
          <select id="t-src" name="source_lang" defaultValue="en" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {LANGS.map(([c, n]) => <option key={c} value={c}>{n} ({c})</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-tgt">Target language</Label>
          <select id="t-tgt" name="target_lang" defaultValue="ta" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {LANGS.map(([c, n]) => <option key={c} value={c}>{n} ({c})</option>)}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Requesting…" : "Request translation"}</Button>
      <Notice state={state} />
    </form>
  )
}

/** Advance a translation job (translate / review / publish / reject). */
export function AdvanceTranslationForm() {
  const [state, action, pending] = useActionState(advanceTranslationAction, EMPTY)
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="a-id">Job id</Label>
          <Input id="a-id" name="id" placeholder="TJ-CHN-02" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-act">Action</Label>
          <select id="a-act" name="action" defaultValue="review" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="translate">translate (Bhashini draft)</option>
            <option value="review">review</option>
            <option value="publish">publish (needs review)</option>
            <option value="reject">reject</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-actor">Actor (translator / reviewer)</Label>
          <Input id="a-actor" name="actor" placeholder="SYN-RV-CHN" />
        </div>
        <div className="flex items-end gap-2">
          <input id="a-mt" name="machine_assisted" type="checkbox" className="h-4 w-4" />
          <Label htmlFor="a-mt" className="text-sm">Bhashini machine-assisted</Label>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A translation cannot be <strong>published</strong> until it has been <strong>reviewed</strong> — machine output never reaches parents unreviewed.</p>
      <Button type="submit" disabled={pending}>{pending ? "Working…" : "Advance"}</Button>
      <Notice state={state} />
    </form>
  )
}
